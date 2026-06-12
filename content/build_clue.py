#!/usr/bin/env python3
"""
build_clue.py — compile the Clue Words section from the clue workbook.

Flow:
    Clue Words  →  group buttons (Positive / Negative)
               →  each group has a Lesson (clue cards) + a Quiz

Input:
  content/sources/clue_workbook.xlsx   (SOURCE OF TRUTH)
    Sheets "Positive Clues" / "Negative Clues" — header on row 3, data from row 4.
    Cols: Clue word/phrase | Meaning | General-use context | Watch-out/exception |
          Sample source refs | Source sets covered | Matched question count
  content/clue_fi_fixes.json           diacritic repairs for the FI phrase column
    (the source export stripped many ä/ö; every fix here was verified against the
    app's existing correctly-accented Finnish — see the homograph note below).

Output:
  src/data/json/clue.json       { groups, words, questions } — the app reads this
  content/output/_clue_report.txt

The lesson text (phrase / meaning / general-use / watch-out) is authored in the
workbook and shows ALL alternate forms (good for teaching).

There is no authored MCQ quiz, so the quiz is GENERATED. To stop testers from
"eyeballing" the answer by matching slash-count / phrase-length between prompt
and option, the quiz uses a single CANONICAL form on each side:

  • prompt   = one Finnish clue word   (first top-level chunk of phrase_fi)
  • options  = one English gloss each   (first top-level chunk of meaning_en)

So all three options are short, single phrases of similar shape — surface cues
no longer leak the answer. The quiz is also BIDIRECTIONAL: roughly half the
questions flip to EN→FI (prompt = English gloss, options = Finnish words), which
forces recognition of the Finnish form rather than English pattern-matching.

The slash-chunks inside a cell are positionally-aligned related words (not
synonyms), so we pair first-FI-chunk ↔ first-EN-chunk. CANON_OVERRIDE fixes any
pair where that heuristic misaligns. A fixed RNG seed keeps the JSON stable.

Run from the project root:  python3 content/build_clue.py
"""

import json
import os
import random
import re

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORKBOOK = os.path.join(HERE, "sources", "clue_workbook.xlsx")
FIXES = os.path.join(HERE, "clue_fi_fixes.json")
OUT_JSON = os.path.join(ROOT, "src", "data", "json", "clue.json")
OUT_REPORT = os.path.join(HERE, "output", "_clue_report.txt")

HEADER_ROW = 3
OPTION_KEYS = ("A", "B", "C")
QUIZ_CAP = 15            # max questions per group, for a friendly quiz length
SEED = 20260611

# Top-level alternates are separated by " / " (spaces); an internal slash with
# NO spaces (e.g. "help/assist") is part of one chunk and must be preserved.
TOP_SEP = " / "

# Manual canonical-form fixes, keyed by clue id, when first-chunk ↔ first-chunk
# misaligns. {"clue-positive-w7": {"fi": "...", "en": "..."}}. Verified by the
# build report below — keep empty unless the report shows a mismatch.
CANON_OVERRIDE = {}


def canon(text):
    """First top-level alternate, e.g. 'a / b / c' -> 'a'. Keeps internal slashes."""
    if not text:
        return text
    return str(text).split(TOP_SEP)[0].strip()

# Sheet name → app group meta. Order here = display order.
GROUP_META = [
    ("Positive Clues", {
        "id": "positive", "short": "Positive", "label": "Positive clue words",
        "tone": "positive", "blurb": "Usually point to the CORRECT answer.",
    }),
    ("Negative Clues", {
        "id": "negative", "short": "Negative", "label": "Negative clue words",
        "tone": "negative", "blurb": "Usually point to a WRONG answer.",
    }),
]

# Verified diacritic repairs for the FI phrase column. NOTE: 'valita' (to choose)
# is deliberately NOT mapped to 'välitä' (to care) — they fold to the same ASCII,
# and the clue phrases mean "choose". Applied to the Finnish column only.
with open(FIXES, encoding="utf-8") as f:
    FI_FIX = json.load(f)

_TOK = re.compile(r"[a-zA-Zäöå]+")


def clean(s):
    if s is None:
        return None
    s = str(s).strip()
    return s or None


def fix_fi(phrase):
    """Repair stripped diacritics token-by-token, preserving separators/case."""
    if not phrase:
        return phrase
    out = []
    for tok in re.split(r"([^a-zA-Zäöå]+)", str(phrase)):
        rep = FI_FIX.get(tok.lower())
        if rep:
            out.append(rep.capitalize() if tok[:1].isupper() else rep)
        else:
            out.append(tok)
    return "".join(out)


def to_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def main():
    rng = random.Random(SEED)
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
    report = ["CLUE BUILD REPORT", "=" * 50]

    # ── Lesson words, grouped, sorted by exam frequency (most common first) ───
    words = []
    for sheet, meta in GROUP_META:
        gid = meta["id"]
        rows = [r for r in wb[sheet].iter_rows(min_row=HEADER_ROW + 1, values_only=True) if r and r[0]]
        entries = []
        for r in rows:
            entries.append({
                "phrase_fi": fix_fi(clean(r[0])),
                "meaning_en": clean(r[1]),
                "effect_en": clean(r[2]),       # general-use context
                "exception_en": clean(r[3]),    # watch-out / exception
                "match_count": to_int(r[6]),
            })
        entries.sort(key=lambda e: (-(e["match_count"] or 0), e["phrase_fi"].lower()))
        total = len(entries)
        for i, e in enumerate(entries, start=1):
            wid = f"clue-{gid}-w{i}"
            ov = CANON_OVERRIDE.get(wid, {})
            words.append({
                "id": wid,
                "group_id": gid,
                "index": i,
                "total_in_group": total,
                "phrase_fi": e["phrase_fi"],
                "meaning_en": e["meaning_en"],
                "effect_en": e["effect_en"],
                "exception_en": e["exception_en"],
                # canonical single forms — used by the quiz, not shown in lessons
                "canon_fi": ov.get("fi") or canon(e["phrase_fi"]),
                "canon_en": ov.get("en") or canon(e["meaning_en"]),
                # match_count drives the sort above but is not shipped (noisy heuristic)
            })

    # ── Generated quiz (canonical single forms, bidirectional) ───────────────
    # Each picked word becomes one question. Direction alternates FI→EN / EN→FI
    # so half test "what does this Finnish word mean" and half "which Finnish
    # word means this". Distractors are canonical forms of OTHER words in the
    # same group — same shape/length as the answer, so nothing leaks visually.
    questions = []
    for _, meta in GROUP_META:
        gid = meta["id"]
        group_words = [w for w in words if w["group_id"] == gid]

        picks = group_words[:]
        rng.shuffle(picks)
        picks = picks[:QUIZ_CAP]

        for qi, w in enumerate(picks, start=1):
            # alternate direction across the (shuffled) picks
            direction = "fi_to_en" if qi % 2 == 1 else "en_to_fi"
            if direction == "fi_to_en":
                prompt, ans_key, dis_key = w["canon_fi"], "canon_en", "canon_en"
            else:
                prompt, ans_key, dis_key = w["canon_en"], "canon_fi", "canon_fi"

            correct = w[ans_key]
            pool = list({o[dis_key] for o in group_words if o[dis_key] and o[dis_key] != correct})
            # Prefer distractors close in length to the answer so the correct
            # option can't be picked by "it's the long/short one". Tie-break is
            # the seeded shuffle, so within a length band the choice is stable.
            rng.shuffle(pool)
            pool.sort(key=lambda m: abs(len(m) - len(correct)))
            opts = [correct] + pool[:2]
            rng.shuffle(opts)
            questions.append({
                "id": f"clue-{gid}-q{qi}",
                "group_id": gid,
                "index": qi,
                "direction": direction,
                "prompt": prompt,
                "options": [{"key": OPTION_KEYS[k], "text": opts[k]} for k in range(len(opts))],
                "correct_option": OPTION_KEYS[opts.index(correct)],
                "correct_answer": correct,
            })

    # ── Group rows ───────────────────────────────────────────────────────────
    groups = []
    for order, (_, meta) in enumerate(GROUP_META, start=1):
        gid = meta["id"]
        groups.append({
            "id": gid,
            "short": meta["short"],
            "label": meta["label"],
            "tone": meta["tone"],
            "blurb": meta["blurb"],
            "order": order,
            "word_count": sum(1 for w in words if w["group_id"] == gid),
            "question_count": sum(1 for q in questions if q["group_id"] == gid),
        })

    # canon_* are build-time only (drive the quiz) — keep them out of the app JSON
    ship_words = [{k: v for k, v in w.items() if k not in ("canon_fi", "canon_en")} for w in words]
    out = {"groups": groups, "words": ship_words, "questions": questions}
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    report.append(f"groups:    {len(groups)}")
    report.append(f"words:     {len(words)}")
    report.append(f"questions: {len(questions)}  (cap {QUIZ_CAP}/group)")
    report.append(f"fi diacritic fixes applied: {len(FI_FIX)} tokens")
    report.append("")
    for g in groups:
        report.append(f"  {g['id']:>9}  {g['word_count']:>2}w / {g['question_count']:>2}q  [{g['tone']}]  {g['label']}")

    # Canonical-pair audit — eyeball each FI↔EN single form for alignment.
    report.append("")
    report.append("CANONICAL QUIZ PAIRS  (first-FI-chunk  ↔  first-EN-chunk)")
    report.append("-" * 50)
    for w in words:
        flag = "  <-- OVERRIDE" if w["id"] in CANON_OVERRIDE else ""
        report.append(f"  {w['canon_fi']:<28} ↔  {w['canon_en']}{flag}")

    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)
    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nwrote {OUT_JSON}")


if __name__ == "__main__":
    main()
