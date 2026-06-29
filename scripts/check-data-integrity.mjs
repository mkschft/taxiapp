#!/usr/bin/env node
// ── Content validation gate (P0) ────────────────────────────────────────────
// Validates the SHIPPED content JSON — the single source of truth (see
// docs/plans/content-pipeline-plan.md). Runs in CI on every PR and locally
// (`npm run check:data`). This is the linchpin that lets a non-developer
// content editor contribute safely: no broken content reaches master or the app.
//
// Checks (fail the build on any violation):
//   A. Per-question schema — FI+EN present, exactly one correct option,
//      category ∈ taxonomy, correct ∈ {A,B,C}, difficulty/status ∈ allowed set.
//   B. No NEW contradictory twins — near-identical question text with a
//      different correct answer. Existing debt is frozen in a baseline
//      (scripts/content-twins-baseline.json); only NEW contradictions fail.
//      (This is the check that catches the Q029/Q053 & Q090/MTQ-051 bug class.)
//   C. Model-test integrity — 50 unique resolvable ids, split 15/15/10/10,
//      time 45, pass 76 — and no model test references an unusable question.
//   D. Exam-fact constants — EXAM_TOTAL/OVERALL_MIN/TIME/PASS match the regulation.
//   E. i18n parity — every en/<ns>.json and fi/<ns>.json have identical key sets.
//
// Regenerate the twin baseline after an intentional content change:
//   node scripts/check-data-integrity.mjs --update-baseline
//
// Exits non-zero on any failure so the build stops.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const TS = (p) => readFileSync(join(ROOT, p), 'utf8');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

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

// The 4-category taxonomy — the only valid category ids (see categories.json).
const TAXONOMY = new Set(Object.keys(OFFICIAL_SPLIT));
// Allowed enum values for the schema check. `status` covers the values present
// today plus the review states that P3 introduces (ai-draft → approved/needs-fix),
// so the gate stays green as the review workflow lands.
const ALLOWED_STATUS = new Set([
  'ai-draft', 'Ready', 'source-unclear', 'model-test', 'approved', 'needs-fix',
]);
const ALLOWED_DIFFICULTY = new Set(['Easy', 'Medium', 'Hard']);
const OPTION_KEYS = ['A', 'B', 'C'];
const TWIN_BASELINE = 'scripts/content-twins-baseline.json';

const failures = [];
const fail = (msg) => failures.push(msg);

// Normalize free text for twin detection: lowercase, strip punctuation, collapse
// whitespace. Compares meaning-bearing words only, ignoring formatting noise.
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

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

// ── A. Per-question schema ───────────────────────────────────────────────────
// `bank` carries difficulty; model-test questions (mtq) intentionally don't.
const schemaCheck = (q, { requireDifficulty }) => {
  const where = `question ${q.id}`;
  const unclear = q.status === 'source-unclear';

  if (!TAXONOMY.has(q.category_id))
    fail(`${where}: category_id ${q.category_id ?? 'missing'} not in taxonomy`);
  if (!ALLOWED_STATUS.has(q.status))
    fail(`${where}: status ${q.status ?? 'missing'} not in allowed set`);

  const keys = (q.options ?? []).map((o) => o.key);
  if (keys.length !== 3 || OPTION_KEYS.some((k, i) => keys[i] !== k))
    fail(`${where}: options must be exactly [A,B,C], got [${keys.join(',')}]`);

  // source-unclear questions are deliberately incomplete and excluded from every
  // user surface (enforced above), so they are exempt from the content fields.
  if (unclear) return;

  if (!q.question?.fi) fail(`${where}: missing FI question text`);
  if (!q.question?.en) fail(`${where}: missing EN question text`);
  for (const o of q.options ?? []) {
    if (!o.fi) fail(`${where}: option ${o.key} missing FI text`);
    if (!o.en) fail(`${where}: option ${o.key} missing EN text`);
  }
  if (!OPTION_KEYS.includes(q.correct_option))
    fail(`${where}: correct_option ${q.correct_option ?? 'missing'} not in {A,B,C}`);
  if (requireDifficulty && !ALLOWED_DIFFICULTY.has(q.difficulty))
    fail(`${where}: difficulty ${q.difficulty ?? 'missing'} not in {Easy,Medium,Hard}`);
};
for (const q of bank) schemaCheck(q, { requireDifficulty: true });
for (const q of mtq) schemaCheck(q, { requireDifficulty: false });

// ── B. No NEW contradictory twins ────────────────────────────────────────────
// Two questions whose normalized FI text matches but whose CORRECT answer text
// differs teach a contradiction (the Q029/Q053 & Q090/MTQ-051 bug class). The
// answer is compared by option *text*, so a reshuffled A/B/C is not a false hit.
// Existing groups are frozen in the baseline; only new ones fail the build.
const correctText = (q) => {
  const o = (q.options ?? []).find((x) => x.is_correct);
  return o ? norm(o.fi) : null;
};
const byText = new Map();
for (const q of [...bank, ...mtq]) {
  if (q.status === 'source-unclear') continue;
  const k = norm(q.question?.fi);
  if (!k) continue;
  if (!byText.has(k)) byText.set(k, []);
  byText.get(k).push(q);
}
const contradictions = [];
for (const qs of byText.values()) {
  if (qs.length < 2) continue;
  if (new Set(qs.map(correctText)).size > 1)
    contradictions.push(qs.map((q) => q.id).sort());
}
const groupKey = (ids) => [...ids].sort().join('|');
const currentKeys = contradictions.map(groupKey);

if (UPDATE_BASELINE) {
  const out = {
    _README:
      'KNOWN contradictory-twin groups, frozen so CI can ratchet: NEW contradictions ' +
      'fail the build, these existing ones are tracked debt pending expert review (P3). ' +
      'Some are genuine answer-key conflicts (e.g. Q090/MTQ-051); some are false ' +
      'positives from minor wording (e.g. Q066/Q245). Regenerate only after an ' +
      'intentional content change: node scripts/check-data-integrity.mjs --update-baseline',
    groups: contradictions.sort((a, b) => groupKey(a).localeCompare(groupKey(b))),
  };
  writeFileSync(join(ROOT, TWIN_BASELINE), JSON.stringify(out, null, 2) + '\n');
  console.log(`✓ wrote ${contradictions.length} known twin group(s) → ${TWIN_BASELINE}`);
  process.exit(0);
}

const baseline = existsSync(join(ROOT, TWIN_BASELINE))
  ? new Set((J(TWIN_BASELINE).groups ?? []).map(groupKey))
  : new Set();
const newContradictions = contradictions.filter((g) => !baseline.has(groupKey(g)));
for (const g of newContradictions)
  fail(`NEW contradictory twins (same question, different correct answer): ${g.join(', ')}`);
// Surface frozen debt without failing — keeps it visible for expert review.
const knownTwins = currentKeys.filter((k) => baseline.has(k)).length;

// ── E. i18n parity — en/<ns>.json and fi/<ns>.json must have identical keys ───
const flatten = (obj, prefix = '') => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
};
const enDir = join(ROOT, 'src/i18n/locales/en');
const fiDir = join(ROOT, 'src/i18n/locales/fi');
if (existsSync(enDir) && existsSync(fiDir)) {
  const ns = (d) => new Set(readdirSync(d).filter((f) => f.endsWith('.json')));
  const enNs = ns(enDir);
  const fiNs = ns(fiDir);
  for (const f of enNs) if (!fiNs.has(f)) fail(`i18n: en/${f} has no fi counterpart`);
  for (const f of fiNs) if (!enNs.has(f)) fail(`i18n: fi/${f} has no en counterpart`);
  for (const f of [...enNs].filter((f) => fiNs.has(f))) {
    const en = new Set(flatten(J(`src/i18n/locales/en/${f}`)));
    const fi = new Set(flatten(J(`src/i18n/locales/fi/${f}`)));
    for (const k of en) if (!fi.has(k)) fail(`i18n parity: ${f} key '${k}' missing in fi`);
    for (const k of fi) if (!en.has(k)) fail(`i18n parity: ${f} key '${k}' missing in en`);
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
  console.error(
    '\nsrc/data/json/*.json is the source of truth (docs/plans/content-pipeline-plan.md).' +
    '\nFix the content above. If a new contradictory twin is intentional, resolve the answer' +
    '\nconflict — do not just re-baseline. To refresh the frozen debt list after an intentional' +
    '\ncontent change: node scripts/check-data-integrity.mjs --update-baseline',
  );
  process.exit(1);
}
console.log(
  `✓ content gate OK — ${counts.bank} bank + ${counts.mtq} model-test questions, ` +
  `${counts.tests} tests (50 unique · 15/15/10/10 · ${EXAM_TIME_MINUTES}min · ${EXAM_PASS_PERCENT}%), ` +
  `${counts.unusable} source-unclear excluded; ` +
  `0 new contradictory twins (${knownTwins} known, frozen for expert review).`,
);
