#!/usr/bin/env python3
"""
build_model_tests.py — compile the 5 Model Tests.

Input (SOURCE OF TRUTH):
  content/sources/model_test_workbook.xlsx   clean, ID-keyed
    'Tests'           test_id | title_fi | title_en | time_minutes | pass_mark | order
    'Test_Questions'  test_id | slot | question_id   (bank Qid or MTQ-### id)
    'New_Questions'   id | correct_option | question_fi | question_en |
                      option_*_fi | option_*_en | explanation_en
  src/data/json/questions.json   the shipped bilingual bank (referenced by id)

Provenance: this workbook was frozen from a validated join of the content
editor's raw model-test sheets to the bank, plus translations of the ~80 new
questions that aren't in the bank (see _migrate_model_test_workbook.py). It is
now keyed by stable question_id, so this build is deterministic — to edit a
test, change a cell. The editor's mangled English is never used.

Output:
  src/data/json/model_tests.json           5 tests (id, title, time, pass, question_ids[])
  src/data/json/model_test_questions.json  the NEW questions, Question-shaped,
                                           so getQuestionById resolves them
  content/output/_model_test_report.txt     build summary + integrity warnings

Run from the project root:  python3 content/build_model_tests.py
"""

import json
import os

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORKBOOK = os.path.join(HERE, "sources", "model_test_workbook.xlsx")
QUESTIONS = os.path.join(ROOT, "src", "data", "json", "questions.json")
OUT_TESTS = os.path.join(ROOT, "src", "data", "json", "model_tests.json")
OUT_QS = os.path.join(ROOT, "src", "data", "json", "model_test_questions.json")
OUT_REPORT = os.path.join(HERE, "output", "_model_test_report.txt")

KEYS = ("A", "B", "C")


def rows(ws):
    head = [c.value for c in ws[1]]
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] is None:
            continue
        yield dict(zip(head, r))


def main():
    bank_ids = {q["id"] for q in json.load(open(QUESTIONS, encoding="utf-8"))}
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
    warnings = []

    # ── New questions (Question-shaped) ──────────────────────────────────────
    new_questions = []
    new_ids = set()
    for r in rows(wb["New_Questions"]):
        new_ids.add(r["id"])
        new_questions.append({
            "id": r["id"], "category_id": None, "category_en": None,
            "source_topic_fi": None, "ref_no": None, "source_set": "model-test",
            "question": {"fi": r["question_fi"], "en": r["question_en"], "fi_raw": None},
            "options": [
                {"key": k, "fi": r[f"option_{k.lower()}_fi"], "fi_raw": None,
                 "en": r[f"option_{k.lower()}_en"], "is_correct": k == r["correct_option"]}
                for k in KEYS
            ],
            "correct_option": r["correct_option"], "correct_master": r["correct_option"],
            "key_overridden": False, "clue_annotations": [],
            "explanation_en": r["explanation_en"], "difficulty": None,
            "tags": ["model-test"], "status": "model-test",
            "fi_edited": False, "reviewer_notes": None, "enriched": False,
        })
    resolvable = bank_ids | new_ids

    # ── Tests + their question lists ─────────────────────────────────────────
    meta = {r["test_id"]: r for r in rows(wb["Tests"])}
    by_test = {tid: [] for tid in meta}
    for r in sorted(rows(wb["Test_Questions"]), key=lambda r: (r["test_id"], r["slot"])):
        qid = r["question_id"]
        if qid not in resolvable:
            warnings.append(f"{r['test_id']} slot {r['slot']}: question_id {qid} not resolvable — skipped")
            continue
        by_test[r["test_id"]].append(qid)

    tests = []
    for tid, m in sorted(meta.items(), key=lambda kv: kv[1]["order"]):
        tests.append({
            "id": tid, "title_fi": m["title_fi"], "title_en": m["title_en"],
            "question_ids": by_test[tid],
            "time_minutes": m["time_minutes"], "pass_mark": m["pass_mark"],
        })

    with open(OUT_TESTS, "w", encoding="utf-8") as f:
        json.dump(tests, f, ensure_ascii=False, indent=2)
    with open(OUT_QS, "w", encoding="utf-8") as f:
        json.dump(new_questions, f, ensure_ascii=False, indent=2)

    report = ["MODEL TESTS BUILD", "=" * 60,
              f"tests: {len(tests)}  new questions: {len(new_questions)}", ""]
    if warnings:
        report += ["WARNINGS:"] + [f"  ! {w}" for w in warnings] + [""]
    for t in tests:
        nnew = sum(1 for q in t["question_ids"] if q.startswith("MTQ-"))
        report.append(f"  {t['id']}: {len(t['question_ids'])} qs  "
                      f"({len(t['question_ids'])-nnew} bank / {nnew} new)  "
                      f"{t['time_minutes']}min · pass {t['pass_mark']}%")

    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)
    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nwrote {OUT_TESTS}\nwrote {OUT_QS}")


if __name__ == "__main__":
    main()
