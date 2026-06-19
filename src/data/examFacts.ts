// ── Single source of truth for official Traficom exam facts ─────────────────
// Every screen / data file that states an exam fact should import it from here
// rather than hard-coding a string, so a number can never drift between the
// guide copy, the model-test data, and the grading logic.
//
// VERIFIED facts were cross-checked against primary Traficom / Finlex sources
// (regulation TRAFICOM/523956/03.04.03.00/2019, in force 1.5.2021) and the
// Act on Transport Services (320/2017). See EXAM_ACCURACY_AUDIT.md for the
// full provenance trail. DEFERRED facts below are NOT verified — do not promote
// any of them to a confident claim without a cited source.
//
// Structural numbers (totals, per-category counts/minimums) live in
// ./examStructure and are re-exported here so callers have one import.

export {
  EXAM_TOTAL,          // 50 questions
  EXAM_OVERALL_MIN,    // 38 correct overall (76%)
  EXAM_STRUCTURE,      // per-category { count, min } — 15/12, 15/12, 10/7, 10/7
  EXAM_CATEGORY_ORDER,
  CATEGORY_LABEL,
  gradeExam,
} from './examStructure';
import { EXAM_TOTAL, EXAM_OVERALL_MIN } from './examStructure';

/** Maximum time allowed for the written exam (oral exam on documented medical
 *  grounds gets 90). Source: regulation §… "enimmäissuoritusaika 45 minuuttia". */
export const EXAM_TIME_MINUTES = 45;

/** Overall pass percentage, derived from the official 38/50. Kept as an explicit
 *  constant (not just computed) so the model-test data can be asserted against
 *  it; the integrity check verifies it equals EXAM_OVERALL_MIN / EXAM_TOTAL. */
export const EXAM_PASS_PERCENT = 76;

/** Languages the exam is offered in — no translation into any other language. */
export const EXAM_LANGUAGES = ['Finnish', 'Swedish'] as const;

/** Who actually delivers the exam. Traficom is the regulator/issuer only. */
export const EXAM_PROVIDER = 'Ajovarma';

/** One-line, launch-safe summary built from the verified facts above. */
export const EXAM_SUMMARY =
  `${EXAM_TOTAL} questions · ${EXAM_TIME_MINUTES} min · ` +
  `${EXAM_OVERALL_MIN}/${EXAM_TOTAL} to pass`;

// ── Deferred / UNVERIFIED registry ──────────────────────────────────────────
// Mirrors EXAM_ACCURACY_AUDIT.md → "Deferred — unverified / handle later".
// Anything here must keep its caveat in user copy until a primary source closes
// it. Treat `status: 'unverified'` as "do not state as fact".
export type DeferredFact = {
  id: string;
  claim: string;
  status: 'unverified' | 'needs-editor';
  note: string;
};

export const DEFERRED_FACTS: DeferredFact[] = [
  { id: 'D1', claim: 'Written-exam fee ≈ €110 (≈€150 oral)', status: 'unverified',
    note: 'Traficom price page loads dynamically; prices changed 1.1.2026. Keep the "verify before booking" caveat.' },
  { id: 'D2', claim: 'Number of answer options per question', status: 'unverified',
    note: 'No official source states a count. App data uses 3 options. Keep copy count-agnostic ("one correct answer").' },
  { id: 'D5', claim: 'Score shown immediately on screen', status: 'unverified',
    note: 'Not confirmed after the Nov 2025 group-exam change. Keep softened wording.' },
  { id: 'D6', claim: '"Roadworthy before every shift" exact wording', status: 'unverified',
    note: 'Plausible but exact statutory "per shift" wording not located.' },
  { id: 'D7', claim: 'Retake waiting period', status: 'unverified',
    note: 'Only a 6-month cheating ban is documented; the "two weeks" claim has no official basis.' },
  { id: 'D8', claim: 'Regulation currency (no 2022–2026 amendment)', status: 'unverified',
    note: 'Latest located version is 16.4.2021. Traficom still serves a superseded 2-area 2019 PDF — do not "correct" back to it.' },
  { id: 'MTQ', claim: '6 model-test question category placements', status: 'needs-editor',
    note: 'MTQ-003, 016, 046, 057, 060, 077 await a content-editor decision — see MTQ_CATEGORY_REVIEW.md.' },
];

/** Sanity self-check used by scripts/check-data-integrity.mjs and tests. */
export const EXAM_PASS_PERCENT_MATCHES =
  EXAM_PASS_PERCENT === Math.round((EXAM_OVERALL_MIN / EXAM_TOTAL) * 100);
