// ── content-sheet.mjs ────────────────────────────────────────────────────────
// Shared library for the Sheet ⇄ questions.json bridge (P1 export, P2 sync).
//
// One column contract, used by both directions, so the Sheet and the builder
// can never drift (the risk called out in docs/plans/content-pipeline-plan.md).
// The headers match docs/content/spreadsheet-template.md exactly.
//
// Design note: this is a Node port of the field derivations that used to live in
// content/build_appready.py. The Python build env is gone (a root cause of the
// original drift); keeping the whole pipeline in Node means it runs in CI with
// zero setup, and JSON — not a binary workbook — stays the single source of truth.

export const OPTION_KEYS = ['A', 'B', 'C'];
export const FOUND_IN_AREAS = ['question', 'option_a', 'option_b', 'option_c'];

// The 24 columns, in order. This array IS the contract.
export const COLUMNS = [
  'Question ID', 'Category', 'Topic', 'Ref #',
  'Question (FI)', 'Question (EN)',
  'Option A (FI)', 'Option A (EN)',
  'Option B (FI)', 'Option B (EN)',
  'Option C (FI)', 'Option C (EN)',
  'Correct (A/B/C)',
  'Focus words (FI)', 'Focus words (EN)',
  'Positive clues (FI)', 'Positive clues (EN)',
  'Negative clues (FI)', 'Negative clues (EN)',
  'Explanation (EN)', 'Difficulty', 'Tags', 'Status', 'Reviewer notes',
];

// category_id → canonical human label shown in the Sheet's Category dropdown.
export const CATEGORY_LABEL = {
  passenger_safety: 'Passenger Help & Safety',
  special_needs: 'Special Passenger Needs',
  customer_service: 'Customer Service',
  traffic_safety: 'Transport & Traffic Safety',
};
// Reverse map, normalized so legacy variants ("Passenger Help + Safety") and
// case/spacing differences all resolve to the right id.
const normLabel = (s) =>
  (s || '').toLowerCase().replace(/[+&]/g, 'and').replace(/[^a-z0-9]+/g, '');
const LABEL_TO_ID = Object.fromEntries(
  Object.entries(CATEGORY_LABEL).map(([id, label]) => [normLabel(label), id]),
);
export const labelToCategoryId = (label) => LABEL_TO_ID[normLabel(label)] ?? label;

// ── tiny RFC-4180 CSV (no dependency) ────────────────────────────────────────
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export const toCsv = (headers, rows) => {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(','));
  return lines.join('\r\n') + '\r\n';
};
export const parseCsv = (text) => {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  const s = text.replace(/^﻿/, ''); // strip BOM
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
};

// ── helpers ──────────────────────────────────────────────────────────────────
const clean = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
const splitList = (v) => (!v ? [] : String(v).split(';').map((p) => p.trim()).filter(Boolean));
const joinList = (arr) => (arr && arr.length ? arr.join('; ') : null);

// found_in: which texts contain the clue phrase (mirrors build_appready.derive_found_in).
const deriveFoundIn = (fi, texts) => {
  const low = (fi || '').toLowerCase();
  return FOUND_IN_AREAS.filter((a) => (texts[a] || '').toLowerCase().includes(low));
};

const CLUE_TYPES = [
  ['fw', 'Focus words (FI)', 'Focus words (EN)'],
  ['pcw', 'Positive clues (FI)', 'Positive clues (EN)'],
  ['ncw', 'Negative clues (FI)', 'Negative clues (EN)'],
];

// ── question → Sheet row ─────────────────────────────────────────────────────
export const questionToRow = (q) => {
  const opt = Object.fromEntries((q.options ?? []).map((o) => [o.key, o]));
  const clues = { fw: [], pcw: [], ncw: [] };
  for (const a of q.clue_annotations ?? []) (clues[a.clue_type] ?? []).push(a);
  const row = {
    'Question ID': q.id,
    'Category': CATEGORY_LABEL[q.category_id] ?? q.category_en ?? q.category_id,
    'Topic': q.source_topic_fi,
    'Ref #': q.ref_no,
    'Question (FI)': q.question?.fi,
    'Question (EN)': q.question?.en,
    'Correct (A/B/C)': q.correct_option,
    'Explanation (EN)': q.explanation_en,
    'Difficulty': q.difficulty,
    'Tags': joinList(q.tags),
    'Status': q.status,
    'Reviewer notes': q.reviewer_notes,
  };
  for (const k of OPTION_KEYS) {
    row[`Option ${k} (FI)`] = opt[k]?.fi ?? null;
    row[`Option ${k} (EN)`] = opt[k]?.en ?? null;
  }
  for (const [type, fiCol, enCol] of CLUE_TYPES) {
    row[fiCol] = joinList(clues[type].map((a) => a.text_fi));
    // keep EN aligned by position; a missing meaning stays an empty slot
    row[enCol] = clues[type].length
      ? clues[type].map((a) => a.meaning_en ?? '').join('; ')
      : null;
  }
  return row;
};

// ── Sheet row → question (merged onto an existing record, if any) ─────────────
// `base` is the current questions.json record for this id (or undefined for a new
// question). Provenance fields the editor never sees (fi_raw, correct_master,
// source_set) are preserved from `base`; everything else is re-derived.
export const rowToQuestion = (row, base) => {
  const categoryId = labelToCategoryId(clean(row['Category']));
  const qFi = clean(row['Question (FI)']);
  const qEn = clean(row['Question (EN)']);
  const optFi = Object.fromEntries(OPTION_KEYS.map((k) => [k, clean(row[`Option ${k} (FI)`])]));
  const optEn = Object.fromEntries(OPTION_KEYS.map((k) => [k, clean(row[`Option ${k} (EN)`])]));
  const correct = (clean(row['Correct (A/B/C)']) ?? '').toUpperCase();
  const correctOption = OPTION_KEYS.includes(correct) ? correct : null;

  // Provenance is preserved EXACTLY from the existing record (including legacy
  // nulls); only a genuinely new question derives these from the row.
  const baseOpt = Object.fromEntries((base?.options ?? []).map((o) => [o.key, o]));
  const optFiRaw = Object.fromEntries(
    OPTION_KEYS.map((k) => [k, base ? (baseOpt[k]?.fi_raw ?? null) : optFi[k]]),
  );
  const qFiRaw = base ? (base.question?.fi_raw ?? null) : qFi;
  const correctMaster = base ? (base.correct_master ?? null) : correct;

  const texts = { question: qFi, option_a: optFi.A, option_b: optFi.B, option_c: optFi.C };
  const annotations = [];
  for (const [type, fiCol, enCol] of CLUE_TYPES) {
    const fis = splitList(row[fiCol]);
    // EN split keeps positions (don't drop blanks) so meanings stay aligned
    const ens = (row[enCol] ? String(row[enCol]).split(';').map((p) => p.trim()) : []);
    fis.forEach((fi, i) => {
      annotations.push({
        text_fi: fi,
        meaning_en: ens[i] ? ens[i] : null,
        clue_type: type,
        found_in: deriveFoundIn(fi, texts),
      });
    });
  }

  const fiEdited = qFi !== qFiRaw || OPTION_KEYS.some((k) => optFi[k] !== optFiRaw[k]);
  // category_en is preserved when the category is unchanged (keeps legacy labels
  // stable); a genuine category change adopts the canonical label.
  const categoryEn = base && base.category_id === categoryId && base.category_en
    ? base.category_en
    : (CATEGORY_LABEL[categoryId] ?? null);

  return {
    id: clean(row['Question ID']),
    category_id: categoryId,
    category_en: categoryEn,
    source_topic_fi: clean(row['Topic']),
    ref_no: clean(row['Ref #']),
    source_set: base?.source_set ?? null,
    question: { fi: qFi, en: qEn, fi_raw: qFiRaw },
    options: OPTION_KEYS.map((k) => ({
      key: k, fi: optFi[k], fi_raw: optFiRaw[k], en: optEn[k], is_correct: k === correctOption,
    })),
    correct_option: correctOption,
    correct_master: correctMaster,
    key_overridden: !!correctOption && correctOption !== (correctMaster || '').toUpperCase(),
    clue_annotations: annotations,
    explanation_en: clean(row['Explanation (EN)']),
    difficulty: clean(row['Difficulty']),
    tags: splitList(row['Tags']),
    status: clean(row['Status']) ?? 'ai-draft',
    fi_edited: fiEdited,
    reviewer_notes: clean(row['Reviewer notes']),
    enriched: !!qEn,
  };
};
