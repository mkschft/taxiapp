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
workbook. There is no authored MCQ quiz, so the quiz is GENERATED: prompt = the
Finnish clue, correct = its English meaning, two distractors = other meanings
from the SAME group. A fixed RNG seed keeps the generated JSON stable.

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
            words.append({
                "id": f"clue-{gid}-w{i}",
                "group_id": gid,
                "index": i,
                "total_in_group": total,
                "phrase_fi": e["phrase_fi"],
                "meaning_en": e["meaning_en"],
                "effect_en": e["effect_en"],
                "exception_en": e["exception_en"],
                "match_count": e["match_count"],
            })

    # ── Generated quiz ───────────────────────────────────────────────────────
    questions = []
    for _, meta in GROUP_META:
        gid = meta["id"]
        group_words = [w for w in words if w["group_id"] == gid]
        meanings = list({w["meaning_en"] for w in group_words if w["meaning_en"]})
        picks = group_words[:]
        rng.shuffle(picks)
        picks = picks[:QUIZ_CAP]
        for qi, w in enumerate(picks, start=1):
            correct = w["meaning_en"]
            pool = [m for m in meanings if m != correct]
            rng.shuffle(pool)
            opts = [correct] + pool[:2]
            rng.shuffle(opts)
            questions.append({
                "id": f"clue-{gid}-q{qi}",
                "group_id": gid,
                "index": qi,
                "prompt_fi": w["phrase_fi"],
                "options": [{"key": OPTION_KEYS[k], "en": opts[k]} for k in range(len(opts))],
                "correct_option": OPTION_KEYS[opts.index(correct)],
                "correct_meaning_en": correct,
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

    out = {"groups": groups, "words": words, "questions": questions}
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

    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)
    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nwrote {OUT_JSON}")


if __name__ == "__main__":
    main()
