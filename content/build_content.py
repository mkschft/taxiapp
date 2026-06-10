#!/usr/bin/env python3
"""
build_content.py — the Taxi Exam content pipeline.

SOURCE OF TRUTH: content/sources/master.xlsx (Taxi_Exam_MASTER_Content.xlsx).
This script parses it into validated JSON in data/, which the app ships.

Run:  python3 content/build_content.py
Out:  data/*.json  +  data/_report.txt (validation + completeness report)

There is no server in this loop. Excel is the content backend; this is the
build step. The JSON shapes are designed so a Supabase seeder can later import
the same files unchanged.
"""

import json
import os
from collections import Counter, defaultdict

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MASTER = os.path.join(HERE, "sources", "master.xlsx")
OUT = os.path.join(ROOT, "data")

OPTION_KEYS = ["A", "B", "C"]
report_lines = []


def report(level, msg):
    report_lines.append(f"[{level}] {msg}")


def blank(v):
    return v is None or str(v).strip() == ""


def clean(v):
    return None if blank(v) else str(v).strip()


def split_list(value, seps=(";",)):
    if blank(value):
        return []
    parts = [str(value)]
    for sep in seps:
        parts = [p for chunk in parts for p in chunk.split(sep)]
    return [p.strip() for p in parts if p.strip()]


def sheet_records(wb, sheet, key_col):
    """Return dict-per-row, auto-detecting the header row by locating key_col."""
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    header_idx = None
    for i, r in enumerate(rows):
        if r and any(str(c).strip() == key_col for c in r if c is not None):
            header_idx = i
            break
    if header_idx is None:
        report("ERROR", f"{sheet}: could not find header column {key_col!r}")
        return []
    header = [str(c).strip() if c is not None else "" for c in rows[header_idx]]
    out = []
    for r in rows[header_idx + 1:]:
        if all(c is None for c in r):
            continue
        out.append(dict(zip(header, r)))
    return out


# ------------------------------------------------------------------- questions
def build_questions(wb):
    recs = sheet_records(wb, "Questions", "Q ID")
    questions, seen = [], set()
    sections = defaultdict(lambda: defaultdict(list))  # category -> topic -> [qid]

    for row in recs:
        qid = clean(row.get("Q ID"))
        if not qid:
            continue
        if qid in seen:
            report("ERROR", f"Duplicate Q ID: {qid}")
        seen.add(qid)

        correct = (clean(row.get("Correct")) or "").upper()
        opts_present = all(not blank(row.get(f"Option {k} (FI)")) for k in OPTION_KEYS)
        if not opts_present:
            report("ERROR", f"{qid}: missing one or more options — skipped from playable set")
        if correct not in OPTION_KEYS:
            report("ERROR", f"{qid}: Correct is {correct!r}, expected A/B/C")

        texts = {
            "question": row.get("Question (FI)"),
            "option_a": row.get("Option A (FI)"),
            "option_b": row.get("Option B (FI)"),
            "option_c": row.get("Option C (FI)"),
        }
        options = [
            {
                "key": k,
                "fi": clean(row.get(f"Option {k} (FI)")),
                "en": None,  # master has no option EN yet
                "is_correct": k == correct,
            }
            for k in OPTION_KEYS
        ]

        # per-question clue annotations (auto-draft: positive / negative only, no meanings)
        annotations = []
        for col, ctype in [("Positive clue words (auto-draft)", "pcw"),
                           ("Negative clue words (auto-draft)", "ncw")]:
            for word in split_list(row.get(col)):
                low = word.lower()
                found_in = [a for a, t in texts.items() if t and low in str(t).lower()]
                annotations.append(
                    {"text_fi": word, "meaning_en": None, "clue_type": ctype,
                     "found_in": found_in, "source": "auto-draft"}
                )

        cat = clean(row.get("Category (EN)")) or "Uncategorised"
        topic = clean(row.get("Source Topic (FI)")) or "General"
        if opts_present and correct in OPTION_KEYS:
            sections[cat][topic].append(qid)

        questions.append(
            {
                "id": qid,
                "category_id": clean(row.get("Cat ID")),
                "category_en": cat,
                "source_topic_fi": topic,
                "ref_no": clean(row.get("Ref No")),
                "source_set": clean(row.get("Source Set")),
                "question": {"fi": clean(row.get("Question (FI)")),
                             "en": clean(row.get("Question (EN) — to fill"))},
                "options": options,
                "correct_option": correct if correct in OPTION_KEYS else None,
                "correct_answer_fi": clean(row.get("Correct Answer Text (FI)")),
                "clue_annotations": annotations,
                "explanation_en": clean(row.get("Explanation (EN) — to fill")),
                "bangla": clean(row.get("Bangla (BN) — to fill")),
                "review_status": clean(row.get("Review Status")),
                "reviewer_notes": clean(row.get("Reviewer Notes")),
                "completeness": {
                    "has_en": not blank(row.get("Question (EN) — to fill")),
                    "has_explanation": not blank(row.get("Explanation (EN) — to fill")),
                    "has_clues": len(annotations) > 0,
                    "playable": opts_present and correct in OPTION_KEYS,
                },
            }
        )

    sections_json = [
        {"category": cat,
         "topics": [{"topic": t, "question_ids": q} for t, q in topics.items()],
         "question_count": sum(len(q) for q in topics.values())}
        for cat, topics in sections.items()
    ]
    return questions, sections_json


# ------------------------------------------------------------------ ref sheets
def build_categories(wb):
    return [
        {"id": clean(r.get("Category ID")), "name_en": clean(r.get("Category (EN)")),
         "official_fi": clean(r.get("Official Category (FI)")),
         "question_count": r.get("# Questions"),
         "keywords": clean(r.get("Key Finnish keywords / what to revise"))}
        for r in sheet_records(wb, "Categories", "Category ID") if clean(r.get("Category ID"))
    ]


def build_clue_words(wb):
    return [
        {"id": clean(r.get("Clue ID")), "group": clean(r.get("Group")),
         "phrase_fi": clean(r.get("Finnish word / phrase")),
         "meaning_en": clean(r.get("English meaning")),
         "effect": clean(r.get("Effect in a question")),
         "exception": clean(r.get("Exception / note")),
         "sample_questions": clean(r.get("Sample question Nos")),
         "count": r.get("Count")}
        for r in sheet_records(wb, "Clue_Words", "Clue ID") if clean(r.get("Clue ID"))
    ]


def build_vocabulary(wb):
    return [
        {"id": clean(r.get("Vocab ID")), "letter": clean(r.get("Letter")),
         "base_word_fi": clean(r.get("Base word (FI)")),
         "meaning_en": clean(r.get("English meaning")),
         "forms": clean(r.get("Forms / suffix variations")),
         "appears_in": split_list(r.get("Appears in (Ref No)"), seps=(",", ";")),
         "page_no": clean(r.get("Page No — to fill"))}
        for r in sheet_records(wb, "Vocabulary", "Vocab ID") if clean(r.get("Vocab ID"))
    ]


def build_lessons(wb):
    return [
        {"id": clean(r.get("Lesson ID")), "category_id": clean(r.get("Cat ID")),
         "title": clean(r.get("Topic Title")), "rule_fi": clean(r.get("Rule summary (FI)")),
         "explanation_en": clean(r.get("Easy English explanation")),
         "common_trap": clean(r.get("Common trap")), "key_clues": clean(r.get("Key clue words")),
         "mini_example": clean(r.get("Mini example")), "source_url": clean(r.get("Public source URL")),
         "review_status": clean(r.get("Review Status"))}
        for r in sheet_records(wb, "Topic_Lessons", "Lesson ID") if clean(r.get("Lesson ID"))
    ]


# ------------------------------------------------------------------------ main
def write_json(name, data):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    os.makedirs(OUT, exist_ok=True)
    wb = openpyxl.load_workbook(MASTER, data_only=True)

    questions, sections = build_questions(wb)
    categories = build_categories(wb)
    clue_words = build_clue_words(wb)
    vocabulary = build_vocabulary(wb)
    lessons = build_lessons(wb)

    write_json("questions.json", questions)
    write_json("sections.json", sections)
    write_json("categories.json", categories)
    write_json("clue_words.json", clue_words)
    write_json("vocabulary.json", vocabulary)
    write_json("topic_lessons.json", lessons)

    n = len(questions)
    playable = sum(1 for q in questions if q["completeness"]["playable"])
    has_en = sum(1 for q in questions if q["completeness"]["has_en"])
    has_exp = sum(1 for q in questions if q["completeness"]["has_explanation"])
    has_clue = sum(1 for q in questions if q["completeness"]["has_clues"])
    errors = sum(1 for l in report_lines if l.startswith("[ERROR]"))

    summary = [
        "TAXI MASTER CONTENT BUILD REPORT",
        "=" * 46,
        f"questions:          {n}   (playable: {playable})",
        f"  with EN text:     {has_en}/{n}",
        f"  with explanation: {has_exp}/{n}",
        f"  with clue words:  {has_clue}/{n}",
        f"categories:         {len(categories)}",
        f"clue dictionary:    {len(clue_words)}",
        f"vocabulary:         {len(vocabulary)}",
        f"topic lessons:      {len(lessons)}",
        "",
        f"ERRORS: {errors}",
        "=" * 46,
        "",
    ]
    with open(os.path.join(OUT, "_report.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(summary + report_lines) + "\n")
    print("\n".join(summary))
    for l in report_lines[:20]:
        print(l)
    if len(report_lines) > 20:
        print(f"... +{len(report_lines)-20} more in data/_report.txt")
    print(f"\nWrote JSON + _report.txt to {OUT}")


if __name__ == "__main__":
    main()
