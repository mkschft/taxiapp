#!/usr/bin/env python3
"""
build_appready.py — compile the content workbook into the app's question data.

This is the DAILY-DRIVER build. Run it after editing content_workbook.xlsx.

Inputs:
  content/content_workbook.xlsx   the content editor's working file (SOURCE OF TRUTH)
  content/sources/master.xlsx     original FI source — supplies category / ref / topic
                                  and the original answer key (for change detection)

  (If the workbook is absent, falls back to template_appready.xlsx + JSON batches.)

Outputs:
  src/data/json/questions.json    app-ready questions (with clue_annotations) — the app reads this
  content/output/_report.txt      build + validation report (TODO / WARN / KEY lines)

Run from the project root:  python3 content/build_appready.py
"""

import json
import os
import re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MASTER = os.path.join(HERE, "sources", "master.xlsx")
TEMPLATE = os.path.join(HERE, "sources", "template_appready.xlsx")
ENRICH = os.path.join(HERE, "enrichment.json")
# The content editor's working file — the single source of truth when present
WORKBOOK = os.path.join(HERE, "content_workbook.xlsx")
# JSON output goes straight into the app data folder
OUT_JSON = os.path.join(ROOT, "src", "data", "json")
# Report goes into content/output
OUT_REVIEW = os.path.join(HERE, "output")
OPTION_KEYS = ["A", "B", "C"]

# Map master CAT IDs → taxiapp category IDs
CAT_ID_MAP = {
    "CAT1": "passenger_safety",
    "CAT2": "special_needs",
    "CAT3": "customer_service",
    "CAT4": "traffic_safety",
}

# content_workbook.xlsx uses friendly headers; map them to internal keys.
# (Must stay in sync with COLS in build_workbook.py.)
WORKBOOK_LABEL_TO_KEY = {
    "Question ID": "question_id", "Category": "section", "Topic": "lesson", "Ref #": "ref_no",
    "Question (FI)": "question_fi", "Question (EN)": "question_en",
    "Option A (FI)": "option_a_fi", "Option A (EN)": "option_a_en",
    "Option B (FI)": "option_b_fi", "Option B (EN)": "option_b_en",
    "Option C (FI)": "option_c_fi", "Option C (EN)": "option_c_en",
    "Correct (A/B/C)": "correct_option",
    "Focus words (FI)": "fw_words", "Focus words (EN)": "fw_meanings",
    "Positive clues (FI)": "pcw_words", "Positive clues (EN)": "pcw_meanings",
    "Negative clues (FI)": "ncw_words", "Negative clues (EN)": "ncw_meanings",
    "Explanation (EN)": "explanation_en", "Difficulty": "difficulty", "Tags": "tags",
    "Status": "status", "Reviewer notes": "reviewer_notes",
}


def clean(v):
    return None if v is None or str(v).strip() == "" else str(v).strip()


def split_list(v):
    return [] if not v else [p.strip() for p in str(v).split(";") if p.strip()]


# Author shorthand leaks into explanations (cross-refs like "Mirrors Q14." and
# "NOTE FOR REVIEWER: ..."). Strip those so explanations are self-contained.
EXPLANATION_OVERRIDE = {
    "Q314": "The police revoke a taxi driver's licence (taksinkuljettajan ajolupa) under the Act on Transport Services (A). Traficom grants the ajolupa and may revoke a taxi operator's transport licence — a different permit — but does not revoke the driver's licence. Consistent with Q259 and Q278.",
}


def clean_explanation(e, qid=None):
    if qid in EXPLANATION_OVERRIDE:
        return EXPLANATION_OVERRIDE[qid]
    if not e:
        return e
    e = re.sub(r"\s*NOTE(?:\s+FOR\s+REVIEWER)?:.*$", "", e, flags=re.I | re.S)
    e = re.sub(r"\s*\([^)]*\bQ\d+[^)]*\)", "", e)
    e = re.sub(
        r"\s*(?:This\s+)?(?:Mirrors?|Duplicate of|Near-duplicate of|Consistent with|Same as)\b[^.]*?\bQ\d+[^.]*\.?",
        "", e, flags=re.I,
    )
    return re.sub(r"\s+", " ", e).strip()


def records(path, sheet, key):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = list(wb[sheet].iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows)
              if r and any(str(c).strip() == key for c in r if c is not None))
    hdr = [str(c).strip() if c is not None else "" for c in rows[hi]]
    return [dict(zip(hdr, r)) for r in rows[hi + 1:] if any(c is not None for c in r)]


def pairs(words, meanings):
    w, m = split_list(words), split_list(meanings)
    return [{"fi": x, "en": m[i] if i < len(m) else None} for i, x in enumerate(w)]


def workbook_row(r):
    """Turn one row of content_workbook.xlsx into an enrichment dict."""
    opt_fi = {k: clean(r.get(f"option_{k.lower()}_fi")) for k in OPTION_KEYS}
    return {
        "question_fi": clean(r.get("question_fi")),
        "options_fi": {k: v for k, v in opt_fi.items() if v},
        "question_en": clean(r.get("question_en")),
        "options_en": {k: clean(r.get(f"option_{k.lower()}_en")) for k in OPTION_KEYS},
        "fw": pairs(r.get("fw_words"), r.get("fw_meanings")),
        "pcw": pairs(r.get("pcw_words"), r.get("pcw_meanings")),
        "ncw": pairs(r.get("ncw_words"), r.get("ncw_meanings")),
        "explanation_en": clean(r.get("explanation_en")),
        "difficulty": clean(r.get("difficulty")),
        "tags": split_list(r.get("tags")),
        "correct_override": clean(r.get("correct_option")),
        "notes": clean(r.get("reviewer_notes")),
        "status": clean(r.get("status")) or "ai-draft",
    }


def load_enrichment():
    """Return {qid: enrichment-dict}.

    If content_workbook.xlsx exists it is the SINGLE source of truth (the
    content editor's surface). Otherwise fall back to template + JSON batches.
    """
    if os.path.exists(WORKBOOK):
        enr = {}
        for raw in records(WORKBOOK, "Questions", "Question ID"):
            r = {WORKBOOK_LABEL_TO_KEY.get(k, k): v for k, v in raw.items()}
            qid = clean(r.get("question_id"))
            if qid:
                enr[qid] = workbook_row(r)
        return enr

    # ----- legacy path: template (gold) + JSON enrichment batches -----
    enr = {}
    # human gold from the First10 template
    for r in records(TEMPLATE, "Questions", "question_id"):
        qid = clean(r.get("question_id"))
        if not qid:
            continue
        enr[qid] = {
            "question_en": clean(r.get("question_en")),
            "options_en": {k: clean(r.get(f"option_{k.lower()}_en")) for k in OPTION_KEYS},
            "fw": pairs(r.get("fw_words"), r.get("fw_meanings")),
            "pcw": pairs(r.get("pcw_words"), r.get("pcw_meanings")),
            "ncw": pairs(r.get("ncw_words"), r.get("ncw_meanings")),
            "explanation_en": clean(r.get("explanation_en")),
            "difficulty": clean(r.get("difficulty")),
            "tags": split_list(r.get("tags")) or [t.strip() for t in str(r.get("tags") or "").split(",") if t.strip()],
            "status": clean(r.get("status")) or "expert-authored",
        }
    # ai-draft enrichment: enrichment.json (pilot) + every content/enrichment/*.json batch
    sources = []
    if os.path.exists(ENRICH):
        sources.append(ENRICH)
    batch_dir = os.path.join(HERE, "enrichment")
    if os.path.isdir(batch_dir):
        sources += sorted(os.path.join(batch_dir, f)
                          for f in os.listdir(batch_dir) if f.endswith(".json"))
    for path in sources:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for qid, e in data.items():
            if qid.startswith("_") or qid in enr:
                continue
            e = dict(e)
            e.setdefault("status", "ai-draft")
            enr[qid] = e
    return enr


def derive_found_in(text_fi, texts):
    low = text_fi.lower()
    return [area for area, t in texts.items() if t and low in str(t).lower()]


def main():
    os.makedirs(OUT_JSON, exist_ok=True)
    os.makedirs(OUT_REVIEW, exist_ok=True)
    enrich = load_enrichment()
    master = records(MASTER, "Questions", "Q ID")
    report = []

    questions = []
    enriched_n = 0

    for row in master:
        qid = clean(row.get("Q ID"))
        if not qid:
            continue
        correct_master = (clean(row.get("Correct")) or "").upper()
        e = enrich.get(qid)
        # "enriched" = has an English question translation (the app needs it)
        has_en = bool((e or {}).get("question_en"))
        if has_en:
            enriched_n += 1
        if e and not has_en:
            report.append(f"[TODO] {qid}: English translation missing")

        # answer-key override (logged): only used where I judged the master key wrong
        override = (e or {}).get("correct_override")
        correct = (override or correct_master).upper()
        key_changed = bool(override) and override.upper() != correct_master
        if key_changed:
            report.append(f"[KEY] {qid}: answer key overridden {correct_master!r} -> {correct!r}")

        # corrected FI from enrichment (linguistic edit), else raw master FI
        raw_q = clean(row.get("Question (FI)"))
        raw_opt = {k: clean(row.get(f"Option {k} (FI)")) for k in OPTION_KEYS}
        e_opt_fi = (e or {}).get("options_fi", {})
        q_fi = (e or {}).get("question_fi") or raw_q
        opt_fi = {k: e_opt_fi.get(k) or raw_opt[k] for k in OPTION_KEYS}
        # FI is "edited" if the shown text differs from the raw master text
        fi_edited = (q_fi != raw_q) or any(opt_fi[k] != raw_opt[k] for k in OPTION_KEYS)

        # derive clue positions against the CORRECTED FI (what the app shows)
        texts = {"question": q_fi, "option_a": opt_fi["A"],
                 "option_b": opt_fi["B"], "option_c": opt_fi["C"]}

        # build clue annotations from enrichment, deriving found_in against FI text
        annotations = []
        if e:
            for ctype in ("fw", "pcw", "ncw"):
                for item in e.get(ctype, []):
                    fi = item.get("fi")
                    if not fi:
                        continue
                    found = derive_found_in(fi, texts)
                    if not found:
                        report.append(f"[WARN] {qid}: {ctype} clue not found verbatim in FI text: {fi!r}")
                    annotations.append({
                        "text_fi": fi, "meaning_en": item.get("en"),
                        "clue_type": ctype, "found_in": found,
                    })

        opt_en = (e or {}).get("options_en", {})
        notes = (e or {}).get("notes")
        raw_cat_id = clean(row.get("Cat ID"))
        cat_id = CAT_ID_MAP.get(raw_cat_id, raw_cat_id)
        questions.append({
            "id": qid,
            "category_id": cat_id,
            "category_en": clean(row.get("Category (EN)")),
            "source_topic_fi": clean(row.get("Source Topic (FI)")),
            "ref_no": clean(row.get("Ref No")),
            "source_set": clean(row.get("Source Set")),
            "question": {"fi": q_fi, "en": (e or {}).get("question_en"), "fi_raw": raw_q},
            "options": [{
                "key": k, "fi": opt_fi[k], "fi_raw": raw_opt[k],
                "en": opt_en.get(k), "is_correct": k == correct,
            } for k in OPTION_KEYS],
            "correct_option": correct if correct in OPTION_KEYS else None,
            "correct_master": correct_master,
            "key_overridden": key_changed,
            "clue_annotations": annotations,
            "explanation_en": clean_explanation((e or {}).get("explanation_en"), qid),
            "difficulty": (e or {}).get("difficulty"),
            "tags": (e or {}).get("tags", []),
            "status": (e or {}).get("status", "needs-enrichment"),
            "fi_edited": fi_edited,
            "reviewer_notes": notes,
            "enriched": has_en,
        })

    # write enriched questions.json → straight into app data folder
    questions_out = os.path.join(OUT_JSON, "questions.json")
    with open(questions_out, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    total = len(questions)
    src = "content_workbook.xlsx" if os.path.exists(WORKBOOK) else "template + JSON batches"
    n_todo = sum(1 for l in report if l.startswith("[TODO]"))
    n_warn = sum(1 for l in report if l.startswith("[WARN]"))
    n_key = sum(1 for l in report if l.startswith("[KEY]"))
    summary = [
        "CONTENT BUILD REPORT", "=" * 46,
        f"source:                {src}",
        f"questions total:       {total}",
        f"with English:          {enriched_n}  ({enriched_n*100//total}%)",
        f"missing English [TODO]:{total - enriched_n}",
        f"FI text edited:        {sum(1 for q in questions if q['fi_edited'])}",
        f"answer-key changes:    {n_key}",
        f"clue-match warnings:   {n_warn}",
        "=" * 46,
        "[TODO] = needs English   [WARN] = clue word not found in FI text",
        "[KEY]  = answer differs from the original master answer key",
        "=" * 46, "",
    ]
    report_out = os.path.join(OUT_REVIEW, "_report.txt")
    with open(report_out, "w", encoding="utf-8") as f:
        f.write("\n".join(summary + report) + "\n")
    print("\n".join(summary))
    for l in report:
        print(l)
    print(f"\n✓ Wrote questions.json → {questions_out}")
    print(f"✓ Full report          → {report_out}")


if __name__ == "__main__":
    main()
