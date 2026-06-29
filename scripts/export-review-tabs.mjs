#!/usr/bin/env node
// ── export-review-tabs.mjs ───────────────────────────────────────────────────
// Generates a per-tab review workbook (one CSV per tab) so the content editor
// can read each module separately instead of one 327-row wall:
//   • 4 question tabs, one per category (Category column dropped — the tab IS
//     the category), reusing the question column contract.
//   • Vocabulary tab (the 84 lesson words, with their forms).
//   • Clue Words tab (the 55 clue phrases).
// Model-test questions and the auto-generated vocab/clue quizzes are excluded.
//
//   node scripts/export-review-tabs.mjs   →   content/sheet/tabs/*.csv
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COLUMNS, CATEGORY_LABEL, questionToRow, toCsv } from './content-sheet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const OUT = join(ROOT, 'content/sheet/tabs');
mkdirSync(OUT, { recursive: true });
const write = (name, headers, rows) => {
  writeFileSync(join(OUT, name), toCsv(headers, rows));
  console.log(`  ${name.padEnd(34)} ${rows.length} rows`);
};

// ── Question tabs (one per category, Category column dropped) ─────────────────
const Q_COLS = COLUMNS.filter((c) => c !== 'Category');
const questions = J('src/data/json/questions.json');
const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL); // canonical 4-category order
const fileSafe = (s) => s.replace(/[\\/:*?"<>|&]/g, '').replace(/\s+/g, ' ').trim();

console.log('question tabs:');
CATEGORY_ORDER.forEach((catId, i) => {
  const rows = questions
    .filter((q) => q.category_id === catId)
    .map((q) => { const r = questionToRow(q); delete r['Category']; return r; });
  write(`${String(i + 1).padStart(2, '0')} Q - ${fileSafe(CATEGORY_LABEL[catId])}.csv`, Q_COLS, rows);
});

// ── Vocabulary tab (lesson words) ────────────────────────────────────────────
const vocab = J('src/data/json/vocab.json');
const setName = Object.fromEntries(vocab.sets.map((s) => [s.id, s.name]));
const VOCAB_COLS = ['Word ID', 'Set', 'Word (FI)', 'Meaning (EN)', 'Word forms (FI)', 'Word forms (EN)', 'Exam use (EN)'];
const vocabRows = vocab.words.map((w) => ({
  'Word ID': w.id,
  'Set': setName[w.set_id] ?? w.set_id,
  'Word (FI)': w.word_fi,
  'Meaning (EN)': w.meaning_en,
  'Word forms (FI)': (w.forms_fi ?? []).map((f) => f.fi).join('; ') || null,
  'Word forms (EN)': (w.forms_fi ?? []).map((f) => f.en).join('; ') || null,
  'Exam use (EN)': w.exam_use_en,
}));
console.log('content tabs:');
write('05 Vocabulary.csv', VOCAB_COLS, vocabRows);

// ── Clue Words tab ───────────────────────────────────────────────────────────
const clue = J('src/data/json/clue.json');
const groupLabel = Object.fromEntries(clue.groups.map((g) => [g.id, g.label ?? g.short ?? g.id]));
const CLUE_COLS = ['Clue ID', 'Group', 'Phrase (FI)', 'Meaning (EN)', 'Effect (EN)', 'Exception (EN)'];
const clueRows = clue.words.map((w) => ({
  'Clue ID': w.id,
  'Group': groupLabel[w.group_id] ?? w.group_id,
  'Phrase (FI)': w.phrase_fi,
  'Meaning (EN)': w.meaning_en,
  'Effect (EN)': w.effect_en,
  'Exception (EN)': w.exception_en,
}));
write('06 Clue Words.csv', CLUE_COLS, clueRows);

console.log('\n✓ review workbook tabs written → content/sheet/tabs/');
