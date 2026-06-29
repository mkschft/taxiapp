#!/usr/bin/env node
// ── verify-sheet-roundtrip.mjs ───────────────────────────────────────────────
// Guards that the Sheet column contract is lossless: every question, taken
// through questionToRow → CSV text → parseCsv → rowToQuestion (with itself as
// base), must come back byte-identical. Runs in CI so a change to content-sheet.mjs
// can't silently corrupt content on the next sync.
//
//   npm run sheet:verify
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COLUMNS, questionToRow, rowToQuestion, toCsv, parseCsv } from './content-sheet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const questions = JSON.parse(readFileSync(join(ROOT, 'src/data/json/questions.json'), 'utf8'));

// full pass through actual CSV text (catches quoting/escaping bugs too)
const csv = toCsv(COLUMNS, questions.map(questionToRow));
const rows = parseCsv(csv);
const byId = new Map(questions.map((q) => [q.id, q]));
const rebuilt = rows.map((r) => rowToQuestion(r, byId.get((r['Question ID'] ?? '').trim())));

const before = JSON.stringify(questions, null, 2);
const after = JSON.stringify(rebuilt, null, 2);
if (before === after) {
  console.log(`✓ sheet round-trip lossless — ${questions.length} questions survive export→sync byte-identical`);
  process.exit(0);
}

// Report the first few differing questions to make a contract regression obvious.
console.error('✗ sheet round-trip is LOSSY — content-sheet.mjs mapping drifted:');
let shown = 0;
for (let i = 0; i < questions.length && shown < 5; i++) {
  const a = JSON.stringify(questions[i], null, 2);
  const b = JSON.stringify(rebuilt[i], null, 2);
  if (a !== b) { console.error(`  • ${questions[i].id} changes through round-trip`); shown++; }
}
process.exit(1);
