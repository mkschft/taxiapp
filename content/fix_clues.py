#!/usr/bin/env python3
"""
fix_clues.py — auto-fix clue-word mismatches in content_workbook.xlsx.

For each [WARN] in _report.txt:
  1. Finds the mismatched clue phrase in the workbook cell.
  2. Searches the actual FI question/option text for the best verbatim match.
  3. Replaces the clue with the verbatim text if confident.
  4. Flags ambiguous ones for manual review.

Also marks Q164/Q166/Q171/Q178 as source-unclear.

Run from project root:  python3 content/fix_clues.py
"""

import json
import os
import re
import difflib
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORKBOOK = os.path.join(HERE, "content_workbook.xlsx")
REPORT = os.path.join(HERE, "output", "_report.txt")
QUESTIONS_JSON = os.path.join(ROOT, "src", "data", "json", "questions.json")

CLUE_TYPE_TO_COL = {
    "fw":  ("Focus words (FI)",      "Focus words (EN)"),
    "pcw": ("Positive clues (FI)",   "Positive clues (EN)"),
    "ncw": ("Negative clues (FI)",   "Negative clues (EN)"),
}

PLACEHOLDER_IDS = {"Q164", "Q166", "Q171", "Q178"}


def split_clues(v):
    if not v:
        return []
    return [p.strip() for p in str(v).split(";") if p.strip()]


def join_clues(items):
    return "; ".join(items)


def best_verbatim_match(clue: str, fi_texts: list[str]) -> str | None:
    """
    Try to find a verbatim substring of any fi_text that best matches the clue.

    Strategy (in order of confidence):
      1. Exact case-insensitive match → return original-case span.
      2. All words of the clue appear in order in the text → extract that span.
      3. difflib best subsequence match → accept if ratio > 0.7.
    Returns the verbatim replacement string, or None if no confident match.
    """
    clue_lower = clue.lower()
    clue_words = re.findall(r'\w+', clue_lower)
    if not clue_words:
        return None

    for text in fi_texts:
        if not text:
            continue
        text_lower = text.lower()

        # 1. Exact substring (case-insensitive)
        idx = text_lower.find(clue_lower)
        if idx != -1:
            return text[idx: idx + len(clue)]

        # 2. All words present in order → extract minimal span
        # Find positions of each clue word in text
        positions = []
        search_from = 0
        found_all = True
        for word in clue_words:
            pat = re.search(r'\b' + re.escape(word) + r'\b', text_lower[search_from:])
            if pat is None:
                # Try without word boundary (handles Finnish compound words)
                pat = re.search(re.escape(word), text_lower[search_from:])
            if pat is None:
                found_all = False
                break
            abs_start = search_from + pat.start()
            abs_end = search_from + pat.end()
            positions.append((abs_start, abs_end))
            search_from = abs_start + 1

        if found_all and positions:
            span_start = positions[0][0]
            span_end = positions[-1][1]
            candidate = text[span_start:span_end].strip()
            # Reject if the span is unreasonably long (>3x the clue)
            if len(candidate) <= len(clue) * 3:
                return candidate

        # 3. Difflib: find best matching substring of similar length
        best_ratio = 0.0
        best_candidate = None
        clen = len(clue)
        # slide a window ±50% of clue length
        for wlen in range(max(3, clen - clen // 2), clen + clen // 2 + 1):
            for start in range(0, len(text) - wlen + 1):
                sub = text[start:start + wlen]
                ratio = difflib.SequenceMatcher(None, clue_lower, sub.lower()).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_candidate = sub

        if best_ratio >= 0.75 and best_candidate:
            return best_candidate.strip()

    return None


def parse_warns(report_path):
    """Return list of (qid, clue_type, clue_text)."""
    warns = []
    pattern = re.compile(r'^\[WARN\] (Q\d+): (\w+) clue not found verbatim in FI text: (.+)$')
    with open(report_path, encoding="utf-8") as f:
        for line in f:
            m = pattern.match(line.strip())
            if m:
                qid, ctype, raw = m.group(1), m.group(2), m.group(3)
                clue_text = raw.strip("'\"")
                warns.append((qid, ctype, clue_text))
    return warns


def main():
    # Load questions for FI text lookup
    with open(QUESTIONS_JSON, encoding="utf-8") as f:
        qs = {q["id"]: q for q in json.load(f)}

    # Load workbook
    wb = openpyxl.load_workbook(WORKBOOK)
    ws = wb["Questions"]
    rows = list(ws.iter_rows())
    hdr_row = rows[0]
    hdr = {cell.value: cell.column for cell in hdr_row if cell.value}

    # Build qid → row index map
    qid_col = hdr["Question ID"]
    qid_to_row = {}
    for row in rows[1:]:
        val = row[qid_col - 1].value
        if val and str(val).strip().startswith("Q"):
            qid_to_row[str(val).strip()] = row

    # --- Step 1: Mark placeholder questions ---
    status_col = hdr["Status"]
    for qid in PLACEHOLDER_IDS:
        if qid in qid_to_row:
            row = qid_to_row[qid]
            row[status_col - 1].value = "source-unclear"
    print(f"Marked {len(PLACEHOLDER_IDS)} placeholder questions as source-unclear.")

    # --- Step 2: Auto-fix clue mismatches ---
    warns = parse_warns(REPORT)
    print(f"\nProcessing {len(warns)} clue warnings...\n")

    fixed = 0
    skipped = 0
    manual = []

    # Group warns by (qid, ctype) so we update each cell once
    from collections import defaultdict
    warn_map = defaultdict(list)  # (qid, ctype) → [clue_text, ...]
    for qid, ctype, clue_text in warns:
        warn_map[(qid, ctype)].append(clue_text)

    for (qid, ctype), bad_clues in warn_map.items():
        q = qs.get(qid)
        if not q:
            skipped += len(bad_clues)
            continue

        # Collect all FI texts for this question
        fi_texts = [
            q["question"].get("fi"),
            *[o.get("fi") for o in q["options"]],
        ]

        fi_col_name, en_col_name = CLUE_TYPE_TO_COL[ctype]
        fi_col = hdr.get(fi_col_name)
        en_col = hdr.get(en_col_name)
        if not fi_col:
            skipped += len(bad_clues)
            continue

        row = qid_to_row.get(qid)
        if not row:
            skipped += len(bad_clues)
            continue

        fi_cell = row[fi_col - 1]
        en_cell = row[en_col - 1] if en_col else None

        current_fi = fi_cell.value or ""
        current_en = en_cell.value if en_cell else ""

        fi_items = split_clues(current_fi)
        en_items = split_clues(current_en) if current_en else []

        changed = False
        for bad in bad_clues:
            # Find this bad clue in the fi_items list
            idx = next((i for i, item in enumerate(fi_items)
                        if item.lower() == bad.lower()), None)
            if idx is None:
                # Try partial match
                idx = next((i for i, item in enumerate(fi_items)
                            if bad.lower() in item.lower() or item.lower() in bad.lower()), None)

            fix = best_verbatim_match(bad, fi_texts)

            if fix and fix.lower() != bad.lower():
                if idx is not None:
                    old = fi_items[idx]
                    fi_items[idx] = fix
                    print(f"  FIXED  {qid} {ctype}: '{old}' → '{fix}'")
                    changed = True
                    fixed += 1
                else:
                    # Clue not found in list at all — append corrected version
                    fi_items.append(fix)
                    print(f"  ADDED  {qid} {ctype}: new verbatim '{fix}'")
                    changed = True
                    fixed += 1
            elif fix and fix.lower() == bad.lower():
                # Already correct — this shouldn't happen but skip gracefully
                skipped += 1
            else:
                # No confident match found
                manual.append((qid, ctype, bad, [t[:60] if t else '' for t in fi_texts if t]))
                if idx is not None:
                    print(f"  MANUAL {qid} {ctype}: '{bad}' — no verbatim match found")
                skipped += 1

        if changed:
            fi_cell.value = join_clues(fi_items)

    wb.save(WORKBOOK)

    print(f"\n{'='*50}")
    print(f"Fixed:        {fixed}")
    print(f"Need manual:  {len(manual)}")
    print(f"Skipped:      {skipped}")
    print(f"{'='*50}")

    if manual:
        print("\n--- MANUAL REVIEW NEEDED ---")
        for qid, ctype, clue, texts in manual:
            print(f"\n  {qid} [{ctype}] clue: '{clue}'")
            for t in texts[:2]:
                print(f"    FI text: {t}...")

    print(f"\n✓ Workbook saved → {WORKBOOK}")
    print("→ Now run: python3 content/build_appready.py")


if __name__ == "__main__":
    main()
