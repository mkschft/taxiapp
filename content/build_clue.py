#!/usr/bin/env python3
"""
build_clue.py — compile the Clue Words section from the master workbook.

Flow (mirrors vocabulary):
    Clue Words  →  group buttons (Positive / Negative / WH / Conjunction)
               →  each group has a Lesson (clue cards) + a Quiz

Input:
  content/sources/master.xlsx  →  sheet "Clue_Words"  (the answer-logic engine)
    Header on row 3; data from row 4.
    Cols: Clue ID | Group | Finnish word/phrase | English meaning |
          Effect in a question | Exception / note | Sample Qs | Count | Bangla

Output:
  src/data/json/clue.json       { groups, words, questions } — the app reads this
  content/output/_clue_report.txt

The lesson cards come straight from the dictionary. There is no authored MCQ
quiz, so the quiz is GENERATED here: prompt = the Finnish clue, correct =
its English meaning, two distractors = other meanings from the SAME group.
A fixed RNG seed keeps the generated JSON stable across rebuilds.

Run from the project root:  python3 content/build_clue.py
"""

import json
import os
import random

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MASTER = os.path.join(HERE, "sources", "master.xlsx")
OUT_JSON = os.path.join(ROOT, "src", "data", "json", "clue.json")
OUT_REPORT = os.path.join(HERE, "output", "_clue_report.txt")

SHEET = "Clue_Words"
HEADER_ROW = 3
# Groups intentionally NOT in Clue Words (they live in Vocabulary sets 10–11).
IGNORE_GROUPS = {"WH-word", "Conjunction"}
OPTION_KEYS = ("A", "B", "C")
QUIZ_CAP = 15            # max questions per group, for a friendly quiz length
SEED = 20260611

# Excel "Group" label → app group meta. Order here = display order.
# WH-words and Conjunctions now live in Vocabulary (sets 10–11), so Clue Words
# is just Positive + Negative.
GROUP_META = [
    ("Positive", {
        "id": "positive", "short": "Positive", "label": "Positive clue words",
        "tone": "positive", "blurb": "Usually point to the CORRECT answer.",
    }),
    ("Negative", {
        "id": "negative", "short": "Negative", "label": "Negative clue words",
        "tone": "negative", "blurb": "Usually point to a WRONG answer.",
    }),
]
EXCEL_TO_META = {k: v for k, v in GROUP_META}

# The source "Exception / note" cells are the author's shorthand (they cite
# question numbers like "Q83"). Rewrite the cited ones into self-contained,
# learner-facing notes. Keyed by Clue ID.
EXCEPTION_OVERRIDE = {
    "CL002": "When several options all sound 'safe', look deeper — the exam often favours arranging proper help (e.g. through dispatch) over a vaguely safe-sounding action.",
    "CL005": "Exception: with an extremely intoxicated passenger, politely refusing the ride can be the expected answer rather than automatically calling the police.",
    "CL017": "Exception: sometimes the deciding factor is an employer's or Kela's entitlement to arrange the transport, not simply the presence of a parent or guardian.",
    "CL018": "Exception: who is responsible for the seat belt can depend on the passenger's age and how the question is framed.",
    "CL023": "Watch out: when this phrase appears in the question itself (not in an answer option), don't rule an option out just because it contains it.",
    "CL025": "Not always wrong: 'enintään' (at most) sets a legitimate limit, and a passenger choosing the topic of conversation can be the correct, allowed option.",
    "CL027": "Exception: a passenger's right to act independently — such as choosing the topic of conversation — is sometimes the correct answer, not a wrong one.",
    "CL028": "Exception: a parent or guardian is responsible for their own child's restraint, so 'not the driver's responsibility' can be correct in that case.",
    "CL031": "Exception: when the passenger actually asks for help (for example with comfort or positioning), giving it is the correct action.",
    "CL037": "Note: if no child restraint is available, the correct action is still to use the back seat with the seat belt — not to skip safety entirely.",
}


def clean(s):
    if s is None:
        return None
    s = str(s).strip()
    return s or None


def main():
    rng = random.Random(SEED)
    wb = openpyxl.load_workbook(MASTER, data_only=True)
    ws = wb[SHEET]
    rows = [r for r in ws.iter_rows(min_row=HEADER_ROW + 1, values_only=True) if r and r[0]]

    report = ["CLUE BUILD REPORT", "=" * 50]

    # ── Lesson words, grouped ────────────────────────────────────────────────
    by_group = {meta["id"]: [] for _, meta in GROUP_META}
    for r in rows:
        clue_id, group_label = clean(r[0]), clean(r[1])
        meta = EXCEL_TO_META.get(group_label)
        if not meta:
            if group_label not in IGNORE_GROUPS:
                report.append(f"[WARN] {clue_id}: unknown group {group_label!r} — skipped")
            continue
        by_group[meta["id"]].append({
            "phrase_fi": clean(r[2]),
            "meaning_en": clean(r[3]),
            "effect_en": clean(r[4]),
            "exception_en": EXCEPTION_OVERRIDE.get(clue_id, clean(r[5])),
        })

    words = []
    for _, meta in GROUP_META:
        gid = meta["id"]
        entries = by_group[gid]
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
            })

    # ── Generated quiz ───────────────────────────────────────────────────────
    questions = []
    for _, meta in GROUP_META:
        gid = meta["id"]
        group_words = [w for w in words if w["group_id"] == gid]
        # distinct meanings in this group, for distractor pools
        meanings = list({w["meaning_en"] for w in group_words if w["meaning_en"]})

        # sample up to QUIZ_CAP words for the quiz (seeded, stable)
        picks = group_words[:]
        rng.shuffle(picks)
        picks = picks[:QUIZ_CAP]

        for qi, w in enumerate(picks, start=1):
            correct = w["meaning_en"]
            pool = [m for m in meanings if m != correct]
            rng.shuffle(pool)
            distractors = pool[:2]
            opts = [correct] + distractors
            rng.shuffle(opts)
            correct_key = OPTION_KEYS[opts.index(correct)]
            questions.append({
                "id": f"clue-{gid}-q{qi}",
                "group_id": gid,
                "index": qi,
                "prompt_fi": w["phrase_fi"],
                "options": [{"key": OPTION_KEYS[k], "en": opts[k]} for k in range(len(opts))],
                "correct_option": correct_key,
                "correct_meaning_en": correct,
            })

    # ── Group rows (with derived counts) ─────────────────────────────────────
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
    report.append("")
    for g in groups:
        report.append(f"  {g['id']:>12}  {g['word_count']:>2}w / {g['question_count']:>2}q  [{g['tone']}]  {g['label']}")

    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)
    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nwrote {OUT_JSON}")


if __name__ == "__main__":
    main()
