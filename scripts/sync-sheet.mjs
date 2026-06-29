#!/usr/bin/env node
// ── sync-sheet.mjs (P2) ──────────────────────────────────────────────────────
// Turn the editor's Sheet back into the source of truth.
// Reads a CSV (the Sheet's published export) and merges its editable columns onto
// src/data/json/questions.json — preserving provenance fields the editor never
// sees (fi_raw, correct_master, source_set) and re-deriving the computed ones
// (category_en, clue found_in, fi_edited, key_overridden, enriched).
//
//   node scripts/sync-sheet.mjs --file content/sheet/questions-seed.csv
//   node scripts/sync-sheet.mjs --url  "https://docs.google.com/.../pub?output=csv"
//   node scripts/sync-sheet.mjs --file in.csv --dry-run   # report, write nothing
//
// The Sheet is authoritative for the whole question set: output is exactly the
// rows present, in Sheet order. A blank Question ID gets the next free Q### id.
// After writing, run `npm run check:data` — the validation gate is what makes
// this safe; sync never ships content on its own.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv, rowToQuestion } from './content-sheet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUESTIONS = join(ROOT, 'src/data/json/questions.json');

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const filePath = arg('--file');
const url = arg('--url');
const dryRun = process.argv.includes('--dry-run');

async function getCsv() {
  if (filePath) return readFileSync(filePath, 'utf8');
  if (url) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
    return res.text();
  }
  throw new Error('provide --file <path> or --url <published-csv-url>');
}

const csv = await getCsv();
const rows = parseCsv(csv);
if (!rows.length) throw new Error('CSV has no data rows — refusing to wipe questions.json');

const current = JSON.parse(readFileSync(QUESTIONS, 'utf8'));
const baseById = new Map(current.map((q) => [q.id, q]));

// next free Q### for rows the editor left blank
let nextNum = Math.max(0, ...current
  .map((q) => /^Q(\d+)$/.exec(q.id ?? ''))
  .filter(Boolean)
  .map((m) => Number(m[1])));
const assignId = () => `Q${String(++nextNum).padStart(3, '0')}`;

const seen = new Set();
const out = [];
let added = 0;
for (const row of rows) {
  let id = (row['Question ID'] ?? '').trim();
  if (!id) { id = assignId(); added++; }
  if (seen.has(id)) throw new Error(`duplicate Question ID in Sheet: ${id}`);
  seen.add(id);
  out.push(rowToQuestion({ ...row, 'Question ID': id }, baseById.get(id)));
}

const removed = current.filter((q) => !seen.has(q.id)).map((q) => q.id);
const serialized = JSON.stringify(out, null, 2); // matches the file's existing formatting
const changed = serialized !== JSON.stringify(current, null, 2);

console.log(
  `sync: ${rows.length} rows → ${out.length} questions ` +
  `(${added} new, ${removed.length} removed${removed.length ? `: ${removed.join(', ')}` : ''})`,
);
if (dryRun) {
  console.log(changed ? '✎ would change questions.json (dry-run, not written)' : '✓ no change');
} else if (changed) {
  writeFileSync(QUESTIONS, serialized);
  console.log('✎ wrote src/data/json/questions.json — now run: npm run check:data');
} else {
  console.log('✓ questions.json already up to date');
}
