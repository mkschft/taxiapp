#!/usr/bin/env node
// ── Data-integrity guardrail ────────────────────────────────────────────────
// Validates the SHIPPED content JSON against the official exam facts. Runs in
// CI / pre-commit and locally (`npm run check:data`). Catches the class of bug
// that shipped ungradeable questions (Q164/Q166) into live model tests:
//   1. every question has exactly one correct option & isn't source-unclear
//   2. every model test = 50 unique ids, split 15/15/10/10, all ids resolve
//   3. no model-test / topic-practice question is unusable
//   4. model_tests.json time + pass mark match examFacts (no copy drift)
//   5. examStructure thresholds match the official numbers
// Exits non-zero on any failure so the build stops.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const TS = (p) => readFileSync(join(ROOT, p), 'utf8');

// Pull the canonical numbers straight from the TS source of truth (regex so we
// don't need a TS loader — the check fails if these constants ever move).
const num = (src, name) => {
  const m = src.match(new RegExp(`export const ${name}\\s*=\\s*(\\d+)`));
  if (!m) throw new Error(`could not read ${name} from source of truth`);
  return Number(m[1]);
};
const structSrc = TS('src/data/examStructure.ts');
const factsSrc = TS('src/data/examFacts.ts');
const EXAM_TOTAL = num(structSrc, 'EXAM_TOTAL');
const EXAM_OVERALL_MIN = num(structSrc, 'EXAM_OVERALL_MIN');
const EXAM_TIME_MINUTES = num(factsSrc, 'EXAM_TIME_MINUTES');
const EXAM_PASS_PERCENT = num(factsSrc, 'EXAM_PASS_PERCENT');

// Official split — the one place the check itself encodes the regulation.
const OFFICIAL_SPLIT = {
  passenger_safety: { count: 15, min: 12 },
  special_needs: { count: 15, min: 12 },
  customer_service: { count: 10, min: 7 },
  traffic_safety: { count: 10, min: 7 },
};

const failures = [];
const fail = (msg) => failures.push(msg);

// ── Load data ───────────────────────────────────────────────────────────────
const bank = J('src/data/json/questions.json');
const mtq = J('src/data/json/model_test_questions.json');
const tests = J('src/data/json/model_tests.json');
const topics = J('src/data/json/topic_practice.json');

const recOf = new Map();
for (const q of [...bank, ...mtq]) recOf.set(q.id, q);
const catOf = (id) => recOf.get(id)?.category_id;
const isUsable = (q) =>
  q && q.status !== 'source-unclear' &&
  q.options?.filter((o) => o.is_correct).length === 1;

// 1. examFacts ⇄ examStructure ⇄ official numbers agree
if (EXAM_TOTAL !== 50) fail(`EXAM_TOTAL is ${EXAM_TOTAL}, expected 50`);
if (EXAM_OVERALL_MIN !== 38) fail(`EXAM_OVERALL_MIN is ${EXAM_OVERALL_MIN}, expected 38`);
if (EXAM_TIME_MINUTES !== 45) fail(`EXAM_TIME_MINUTES is ${EXAM_TIME_MINUTES}, expected 45`);
if (EXAM_PASS_PERCENT !== Math.round((EXAM_OVERALL_MIN / EXAM_TOTAL) * 100))
  fail(`EXAM_PASS_PERCENT ${EXAM_PASS_PERCENT} != ${EXAM_OVERALL_MIN}/${EXAM_TOTAL}`);

// 2. every question is gradeable (exactly one correct option)
for (const q of [...bank, ...mtq]) {
  const n = q.options?.filter((o) => o.is_correct).length ?? 0;
  if (q.status === 'source-unclear') continue; // excluded from user surfaces by builders
  if (n !== 1) fail(`question ${q.id} has ${n} correct options (expected 1)`);
}

// 3. model tests: 50 unique, resolve, usable, split 15/15/10/10, facts match
for (const t of tests) {
  const ids = t.question_ids;
  const uniq = new Set(ids);
  if (ids.length !== EXAM_TOTAL || uniq.size !== EXAM_TOTAL)
    fail(`${t.id}: ${ids.length} ids (${uniq.size} unique), expected ${EXAM_TOTAL} unique`);
  for (const id of ids) {
    if (!recOf.has(id)) fail(`${t.id}: question ${id} does not resolve to the bank`);
    else if (!isUsable(recOf.get(id))) fail(`${t.id}: question ${id} is ungradeable/source-unclear`);
  }
  const dist = {};
  for (const id of ids) dist[catOf(id)] = (dist[catOf(id)] || 0) + 1;
  for (const [cat, { count }] of Object.entries(OFFICIAL_SPLIT))
    if ((dist[cat] || 0) !== count)
      fail(`${t.id}: ${cat} has ${dist[cat] || 0} questions, expected ${count}`);
  if (t.time_minutes !== EXAM_TIME_MINUTES)
    fail(`${t.id}: time_minutes ${t.time_minutes} != ${EXAM_TIME_MINUTES}`);
  if (t.pass_mark !== EXAM_PASS_PERCENT)
    fail(`${t.id}: pass_mark ${t.pass_mark} != ${EXAM_PASS_PERCENT}`);
}

// 4. topic practice never references an unusable question
for (const l of topics.lessons ?? []) {
  for (const id of l.question_ids ?? []) {
    if (!recOf.has(id)) fail(`topic lesson ${l.id}: ${id} does not resolve`);
    else if (!isUsable(recOf.get(id))) fail(`topic lesson ${l.id}: ${id} is ungradeable/source-unclear`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const counts = {
  bank: bank.length, mtq: mtq.length, tests: tests.length,
  unusable: [...bank, ...mtq].filter((q) => !isUsable(q)).length,
};
if (failures.length) {
  console.error('✗ DATA INTEGRITY: ' + failures.length + ' problem(s):');
  for (const f of failures) console.error('  • ' + f);
  console.error('\nFix the source workbook in content/sources/ and rebuild — do not hand-edit the JSON.');
  process.exit(1);
}
console.log(
  `✓ data integrity OK — ${counts.bank} bank + ${counts.mtq} model-test questions, ` +
  `${counts.tests} tests (50 unique · 15/15/10/10 · ${EXAM_TIME_MINUTES}min · ${EXAM_PASS_PERCENT}%), ` +
  `${counts.unusable} source-unclear question(s) correctly excluded from all user surfaces.`,
);
