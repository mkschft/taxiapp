#!/usr/bin/env node
// ── export-sheet-csv.mjs (P1) ────────────────────────────────────────────────
// Seed the editor's spreadsheet from the source of truth.
// Reads src/data/json/questions.json and writes content/sheet/questions-seed.csv
// — the 24-column contract (docs/content/spreadsheet-template.md), one row per
// question. The editor imports this CSV into Google Sheets to start from real data.
//
//   node scripts/export-sheet-csv.mjs
//
// Round-trips losslessly with scripts/sync-sheet.mjs (see npm run sheet:verify).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COLUMNS, questionToRow, toCsv } from './content-sheet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'content/sheet/questions-seed.csv';

const questions = JSON.parse(readFileSync(join(ROOT, 'src/data/json/questions.json'), 'utf8'));
const rows = questions.map(questionToRow);
mkdirSync(join(ROOT, 'content/sheet'), { recursive: true });
writeFileSync(join(ROOT, OUT), toCsv(COLUMNS, rows));
console.log(`✓ exported ${rows.length} questions → ${OUT}`);
