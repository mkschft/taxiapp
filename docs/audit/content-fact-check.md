# Content Fact-Check Audit — Generic Content Pages (Phase 1)

**Date:** 2026-06-29
**Auditor:** content & fact-check pass (Claude)
**Scope (locked):** Generic, non-question content only — Exam Guide, How-to, landing/dashboard copy, clue-word methodology, mock/result copy. **Excluded this pass:** `content/enrichment.json` AI-draft explanations and the 327+80 question bank (deferred to a later phase).
**Decisions (locked):** Unverifiable claims → *flag + propose a hedge* (no invented replacement numbers). Output → *findings doc only, no code edits.*

> ⚠️ This is a findings document. **No content files were changed.**

---

> ## 🛑 CORRECTION (2026-06-29, same day) — F-1, F-2, F-3 RETRACTED
>
> The first draft of this audit (sections below, struck through) **was wrong on all three critical findings.** I verified the app against the regulation PDF that Traficom's own website serves — `…/regulation/Taksinkuljettajan kokeen vaatimukset.pdf` — **without realising that file is the SUPERSEDED 2019 regulation** (TRAFICOM/108893, 2 subject areas, no numeric thresholds).
>
> The **current binding regulation is TRAFICOM/523956/03.04.03.00/2019, issued 16.4.2021, in force 1.5.2021**, which explicitly *revokes* the 2019 version. I extracted its full text from Finlex. It states verbatim:
> - **Four** subject areas with a fixed split and per-area minimums:
>   | Aihepiiri | Questions | Min correct |
>   |---|---|---|
>   | Matkustajien avustamisesta ja turvallisuudesta huolehtiminen | 15 | 12 |
>   | Eri matkustajaryhmien erityistarpeet | 15 | 12 |
>   | Taksipalvelujen asiakaspalvelutilanteet | 10 | 7 |
>   | Kuljetusten ja liikenteen turvallisuuteen vaikuttavat tekijät | 10 | 7 |
>   | **Koko koe** | **50** | **38** |
> - *"Jos oikeiden vastausten lukumäärä alittaa jossakin kokeen aihepiirissä vaaditun määrän, koko koe hylätään."* (Fall below any single area's minimum → whole exam fails.)
> - Max **45 min**; **90 min** oral for dyslexia/medical grounds.
> - Retake: the 2021 binding text contains **no next-day-minimum clause** (that clause existed only in the revoked 2019 version).
>
> **Therefore the app is CORRECT:** "38/50 (76%) + 12/15, 12/15, 7/10, 7/10 + 4 official categories + 45 min + 90 min oral" all match the binding regulation exactly.
>
> This was already established by the prior in-repo audit **`EXAM_ACCURACY_AUDIT.md` (2026-06-19)**, which fixed these very numbers and left a standing warning: *"Traficom's own site still serves a superseded 2-area 2019 PDF — don't 'correct' back to it."* This Phase-1 pass walked straight into that trap. **Lesson logged: the canonical source is the Finlex 2021 text (523956 / media id 541502), not the PDF on traficom.fi.**
>
> **Net result:** F-1, F-2, F-3 and W-3 below are **VOID — do not implement them.** The genuinely-open items are only the time-sensitive ones the prior audit already deferred (fee, group-exam venues, immediate results, regulation currency) — see the **"What actually remains"** section at the very bottom.

---

---

## 1. Verdict summary

| Verdict | Count | Meaning |
|---|---|---|
| ✅ Correct | 11 | Matches an authoritative source |
| ⚠️ Imprecise / outdated / time-sensitive | 6 | Directionally right but needs softening, a date, or a qualifier |
| ❌ Wrong / contradicts source | 3 | Factually incorrect as written |
| ❓ Unverifiable from public sources | 2 | No primary source found; treat with a hedge |

**Headline:** The licensing facts (B-licence, medical, validity, language, receipt, pricing, child restraint) are **solid and well-sourced**. The problems cluster around **two things**: (a) the **exam scoring model** (the precise "38/50 = 76% + 4-area gate" cannot be confirmed and the "4 official categories" framing contradicts the official 2-area regulation), and (b) one outright **retake error**.

---

## 2. Critical findings (fix first) — ❌ VOID, SEE CORRECTION ABOVE

> The three findings in this section (F-1 retake, F-2 "4 official categories", F-3 pass mark) were based on the **superseded** 2019 regulation. The app matches the **current binding 2021 regulation**. **Do not implement F-1/F-2/F-3.** Retained below only for traceability.

### ❌ F-1 — "No mandatory waiting period" for retakes is **wrong**
- **Where:** `src/data/json/guide.json:15` — *"Retakes: You can retake if you fail — no mandatory waiting period"*
- **Source:** Traficom regulation *Taksinkuljettajan kokeen vaatimukset* (TRAFICOM/108893/03.04.03.00/2019), §2: *"Hylätyn kokeen voi suorittaa uudelleen aikaisintaan seuraavana päivänä hylätystä kokeesta."* → A failed exam may be retaken **at the earliest the following day**.
- **Verdict:** ❌ Contradicts the regulation. There *is* a minimum wait (you cannot resit the same day).
- **Proposed edit:** *"You can retake if you fail — at the earliest on the day after a failed attempt."*

### ❌ F-2 — "The 4 exam categories" presented as official structure
- **Where:** `guide.json:35-38` — *"The 4 exam categories … All 50 questions come from exactly these four official categories … the exam is organised around them."* Echoed in `howto.json:6,15,30`, `en/guide.json:8` (`statCategories`), `testHome.json`, `result.json`.
- **Source:** The Traficom regulation defines exactly **two subject areas (aihepiirit)**: (1) *Matkustajan turvallisuus* (passenger safety) and (2) *Matkustajan toimintarajoitukset* (passenger functional limitations / special groups), with **≥3 questions from each**. There is no official 4-category structure.
- **Verdict:** ❌ The app's four categories (Passenger Help & Safety, Special Passenger Needs, Customer Service, Transport & Traffic Safety) are a reasonable **pedagogical regrouping**, but calling them the "four official categories" the exam "is organised around" is inaccurate.
- **Proposed edit:** Reframe as the app's own study grouping, e.g. *"We group the official syllabus into 4 practical study areas. Officially Traficom tests two areas — passenger safety and passenger functional limitations (special groups)."* Keep the 4 as study buckets; stop claiming they are the exam's official structure.

### ❌ F-3 — Pass mark "38/50 (76%) + per-area gate (12/15, 12/15, 7/10, 7/10)" is **unconfirmed and likely invented**
- **Where:** `guide.json:10`; `howto.json:16`; `en/howto.json:16`; `testHome.json:3,9`; `result.json:5,6`; `en/guide.json:4`; `fi/guide.json:4`; `fi/testHome.json:3,9`; mock-test metadata `pass_mark: 76`.
- **Source:** The official regulation requires *"kummastakin aihepiiristä yhteensä riittävän pistemäärän"* (a sufficient score **from each of the two areas**) but does **not publish a 50-question / 76% / four-way split**. Secondary sources conflict badly: 35/50 = 70%, "22 per section," and "only 3 wrong of 15 in special groups" all appear. **No public primary source confirms 38/50, 76%, or the 12/15·12/15·7/10·7/10 split.**
- **Verdict:** ❌/❓ The headline number drives the whole product (mock-exam pass gate, result screen). It is presented with false precision and the four-way gate maps to the non-official 4-category model (see F-2). This is the **single most important item to confirm with a primary Traficom/Ajovarma exam description before relying on it.**
- **Proposed handling (per locked decision — hedge, don't invent):** Until confirmed by a primary source, soften to the *concept* — "you must score sufficiently overall **and** reach a minimum in each subject area; a strong margin (aim well above half) is the safe target" — and stop printing an exact 38/50 / 76% as if it were the published threshold. Flag for the content owner to verify the real figure with Ajovarma/Traficom.

---

## 3. Imprecise / time-sensitive (soften or date)

| ID | Where | Claim | Issue | Proposed handling |
|---|---|---|---|---|
| ⚠️ W-1 | `guide.json:13` | "since Nov 2025 run as centralised group exams in 12 cities" | ❓ Not confirmable from public sources. Time-sensitive. | Hedge: "in selected locations — verify current arrangements with Ajovarma," drop the unverified "12 cities / Nov 2025" specifics or mark as "as of late 2025." |
| ⚠️ W-2 | `guide.json:14` | "~€110 per written attempt (≈€150 oral). Fees rose 1.1.2026" | Time-sensitive; Traficom commercial fees are noted as rising 1 Jul 2025, and the 1.1.2026 figure is unverified. App **already hedges** ("verify before booking"). | Keep the existing hedge; optionally change to "approx." and "recent fee changes — confirm current price with Ajovarma/Traficom." |
| ⚠️ W-3 | `guide.json:9` | "90 minutes for an oral exam" | Oral exam for medical/dyslexia grounds is real (regulation §2); the **90-min** figure is unconfirmed. | Keep the oral-exam allowance; soften the exact minutes or verify. |
| ⚠️ W-4 | `guide.json:62` | child "may use the adult seatbelt if no suitable seat is available" | ✅ Correct rule, but the taxi exception specifically applies to the **back seat**. | Add "in the back seat" for precision. |
| ⚠️ W-5 | `guide.json:6` | exam "delivered by its contracted provider, Ajovarma" | ✅ Booking/venue is Ajovarma. Fine, but providers can change under contract. | Acceptable; low priority. |
| ⚠️ W-6 | `guide.json:88` | taxi-rank "first in, first out is courtesy, not law" | Plausible and consistent with deregulation, but not tied to a cited statute. | Low priority; keep or cite. |

---

## 4. Verified correct (no change needed)

| Where | Claim | Source |
|---|---|---|
| `guide.json:8`, all locale stats | 50 multiple-choice questions, 45 min, one fully correct answer | Traficom taxi-licence page; regulation |
| `guide.json:12` | Exam in **Finnish or Swedish only**, no other-language translation | Regulation §2 (*"kokeen kieli on suomi tai ruotsi"*) |
| `guide.json:25` | B licence (FI or EU/EEA) held **≥1 year** before applying | Traficom taxi driving licence (EN) |
| `guide.json:27` | **Group 2** medical fitness, certificate **≤6 months** old | Traficom (EN): "no more than six months old" |
| `guide.json:28` | Clean criminal / no serious record; (FI page adds 5-yr / 3-yr bars) | Traficom FI taxi-licence page |
| `guide.json:29` | Licence valid **5 years (2 years if 68+)** | Traficom (EN) |
| `guide.json:30` | Passed exam stays valid indefinitely; renew on health + record | Traficom |
| `guide.json:62` | Under-135 cm need restraint; taxi seatbelt exception age 3+; under-3 always restrained | Road Traffic Act 729/2018; Liikenneturva |
| `guide.json:73` | Driver must **offer a receipt every trip** | Act on Transport Services; Taksiliitto customer info; KKV |
| `guide.json:74` | Price / pricing basis must be stated **up front, before the trip** | KKV "Pricing of taxi services"; Act on Transport Services |
| `guide.json:76` | Metered (distance/time) pricing needs the meter on from start; not required for an agreed fixed price | KKV; taximeter rules (Measuring Instruments Act) |

---

## 5. Clue-word data (`src/data/json/clue.json`) — spot check

The clue-word heuristics encode driver obligations as language patterns. Spot-checked against the official syllabus and traffic/transport law — **no factual errors found**; the encoded duties are consistent with Finnish rules:
- Alcohol interlock (*alkolukko*) required in **school/day-care transport** — ✅ correct (it's contextual, and the data says so).
- Wheelchair secured "by frame / four points / brakes on" — ✅ correct best practice; "wheelchair brakes alone not enough" — ✅.
- Guide dog must be carried, not distracted/petted — ✅.
- Seat-belt / receipt duties are mandatory, "voluntary/optional" framings are wrong — ✅.
- Customer request never permits speeding / unsafe acts — ✅.

These are **teaching heuristics, not legal absolutes**, and the data appropriately includes `exception_en` caveats. No change required; revisit only if a question's "correct" answer is later found to contradict one.

---

## 6. Low / no factual content (out of concern)

`dashboard.json`, `studyHome.json`, `categories.json`, `topics.json` — navigation labels and structural metadata. Only inherited issue: category **names** repeat the "official categories" framing of F-2; fixing F-2's wording in the guide/how-to is sufficient.

---

## 7. EN ↔ FI consistency

Checked the bilingual pairs (`guide`, `howto`, `testHome`, `result`). Finnish copy is **consistent with English** — it repeats the same figures (50 / 45 / 38/50 / 76%) and the same source footer (*"Lähde: Traficom … tarkista aina traficom.fi"*). **Consequence:** every fix to F-1/F-2/F-3 must be applied to **both** `en/` and `fi/` to preserve parity (and to avoid the i18n parity gate failing). No mistranslations of legal terms found (*ajolupa*, *toimintarajoitukset*, *läpäisyraja* used correctly).

---

## 8. Authoritative sources

**Tier 1 — Regulator / law**
- Traficom regulation *Taksinkuljettajan kokeen vaatimukset* (PDF): https://www.traficom.fi/sites/default/files/media/regulation/Taksinkuljettajan%20kokeen%20vaatimukset.pdf
- Same on Finlex: https://finlex.fi/en/authorities/regulations/traficom-tieliikenne/2021/46915
- Taxi driving licence — Traficom (EN): https://www.traficom.fi/en/transport/road/professional-drivers/taxi-driving-licence
- Taksinkuljettajan ajolupa — Traficom (FI): https://www.traficom.fi/fi/liikenne/tieliikenne/ammattikuljettajille/taksinkuljettajan-ajolupa
- Road Traffic Act 729/2018 — Finlex (EN): https://www.finlex.fi/en/legislation/2018/729
- Pricing of taxi services — KKV (Consumer Authority, EN): https://www.kkv.fi/en/consumer-affairs/travel-and-accommodation/taxi-services/pricing-of-taxi-services/
- Taxi price monitoring — Traficom: https://tieto.traficom.fi/en/statistics/price-monitoring-taxi-services
- Traficom commercial fee changes (1 Jul 2025): https://www.traficom.fi/en/news/increases-traficoms-commercial-fees-1-july-2025

**Tier 2 — Corroborating**
- Suomi.fi taxi driving licence service card: https://www.suomi.fi/services/taxi-driving-licence-the-finnish-transport-and-communications-agency-traficom/9b302196-e499-43cc-92b4-95f4f0a326b5
- Finnish Taxi Federation — becoming a driver (EN): https://www.taksiliitto.fi/en/becoming-a-taxi-driver/
- Finnish Taxi Federation — info to customers (EN): https://www.taksiliitto.fi/en/information-to-taxi-customers/
- Liikenneturva — child seat: https://www.liikenneturva.fi/en/road-safety/child-seat/
- taksikoe.fi (competitor practice material, scope reference): https://taksikoe.fi/

---

## 9. What actually remains (post-correction)

After retracting F-1/F-2/F-3/W-3, the app's exam-structure and licensing content is **verified correct against the binding 2021 regulation** and the prior `EXAM_ACCURACY_AUDIT.md`. The only genuinely-open items are the **time-sensitive / externally-changing** claims — all of which the app *already hedges* — carried over from that audit's deferred list:

| Item | Where | Status | Action |
|---|---|---|---|
| Written-exam fee ~€110 / €150 oral, "rose 1.1.2026" | `guide.json:14` | Hedged in-app ("verify before booking"). Exact figure unconfirmed (Traficom price page is dynamic). | Confirm against the Ministry maksuasetus / Traficom price schedule, then optionally drop the caveat. **No edit needed meanwhile.** |
| "Centralised group exams in 12 cities since Nov 2025" | `guide.json:13` | Asserted by prior audit; not re-confirmed this pass. | Re-confirm with Ajovarma; otherwise leave (prior audit treated it as current). |
| "Result available quickly" (immediate on-screen) | `guide.json:106` | Already softened by prior audit. | Confirm with Ajovarma whether score shows immediately at group-exam sites. |
| Regulation currency | whole guide | Latest located binding text is 16.4.2021 (523956). | Confirm no 2022–2026 amendment before next release. |
| child seatbelt exception — "in the **back seat**" | `guide.json:62` | ✅ correct; minor precision nit only. | Optional one-word precision add; not required. |

**Bottom line: there is essentially nothing to implement from this Phase-1 pass.** The content is accurate. The remaining work is *external verification* of four soft/time-sensitive facts that are already appropriately hedged — not code or copy changes.

**Phase 2 (the real next pass):** audit `content/enrichment.json` AI-draft explanations (all marked `ai-draft`) and the 327+80 question bank against the binding 2021 regulation + Act on Transport Services. **Use Finlex 523956, not the traficom.fi PDF, as the source of truth.** Prior audit also flagged 6 uncertain MTQ categorizations to spot-check: MTQ-003, 016, 046, 057, 060, 077.

---

# Phase 2 — Question Bank & AI-Explanation Audit

**Date:** 2026-06-29 (same session)
**Scope:** 403 live questions (327 bank − 4 `source-unclear` + 80 model-test). Each checked on 3 axes: keyed-answer correctness, explanation correctness, translation fidelity. Run as 4 parallel category auditors grounded in the binding 2021 regulation + Road Traffic Act 729/2018 + Act on Transport Services 320/2017.
**Method note:** correct answers come from real exam practice material (source sets M/P/Q) and proved reliable; AI-drafted `explanation_en` (313 of 327 still `ai-draft`) was the main risk surface, as expected.

## Data integrity (pre-check) — clean
- The 4 `source-unclear` questions (Q164, Q166, Q171, Q178) are null-content and **correctly excluded** from all user surfaces. ✅
- 3 deliberate answer-key overrides (Q051→B, Q053→B, Q090→A) are **legally sound** — they fix real master-source contradictions (15+ self-responsible for belts; wheelchair all-direction securing). ✅

## Findings — 9 across 403 questions

| ID | Category | Type | Sev | Conf | Issue | Corroboration |
|---|---|---|---|---|---|---|
| **Q314** | traffic_safety | wrong_answer | **high** | **high** | Keys "Traficom" as who revokes a taxi **driver's** licence. Police revoke the `ajolupa`; Traficom only revokes the operator's transport licence. | Contradicts **Q259, Q278** (same bank, correctly key "police") |
| **MTQ-051** | passenger_safety | wrong_answer | **high** | **high** | 15-year-old travelling alone — keys "driver must ensure belt," expl says "regardless of age." Driver duty is **under-15 only**; 15+ are self-responsible. | Contradicts **Q090** (identical scenario, correctly keyed self-responsible) |
| **Q057** | passenger_safety | wrong_answer | **high** | med | Keys "employer's" responsibility to obtain the school/daycare driver's criminal-record extract. The **individual must request their own** extract from the Legal Register Centre. | Contradicts **Q037** (same topic, correctly keys "the driver") |
| Q068 | passenger_safety | imprecise | low | med | Generic "customer refuses belt → must refuse the trip." For 15+ the responsibility is the passenger's; can't blanket-refuse. | Conflicts with **Q023** |
| MTQ-032 | passenger_safety | wrong_explanation | low | med | Expl asserts "driver has a duty to ensure passengers wear belts" for an adult — overstates; 15+ are self-responsible. | Same theme as MTQ-051 |
| Q221 | customer_service | wrong_explanation | low | low | Calls €130 "the **regulated** cleaning surcharge." Pricing is market-based since 2018; soiling fee is per operator's price list. | — |
| Q235 | customer_service | imprecise | low | low | Keys €65 for 25 km/30 min Sun, but Q149/MTQ-064 key €65 for **20 km**/30 min — same fare for different distance suggests a copy error. | Needs the price-list table to confirm |
| Q029 | passenger_safety | imprecise | low | low | Wheelchair occupant "does not need the vehicle's seat belt" — risks teaching no restraint at all; occupant still needs a dedicated harness. | dup of Q053 |
| Q053 | passenger_safety | imprecise | low | low | Exact duplicate of Q029 — same caveat. | dup of Q029 |

## The one systematic theme worth acting on

**Seat-belt responsibility for 15+ passengers** is the recurring misconception, surfacing in **MTQ-051 (wrong answer), Q068, and MTQ-032 (wrong explanations).** The correct rule: the driver is legally responsible only for ensuring **under-15s** are restrained; from age 15 the passenger is responsible for themselves (the content team already knows this — it's why Q049/Q051/Q090 were keyed/overridden correctly). The AI explanations didn't consistently absorb it. A targeted sweep of every belt-related question/explanation for the "regardless of age / driver must ensure" phrasing would catch the whole class.

## Recommended actions (Phase 2)

1. **Fix the 3 high-confidence answer-key errors** — Q314, MTQ-051, Q057. Each is independently corroborated by a contradicting sibling question, so confidence is strong. Use the existing `key_overridden` + `reviewer_notes` mechanism (as with Q051/Q053/Q090) so the change is auditable. These are user-facing wrong answers — highest priority.
2. **Reword the low-severity explanations** — Q068, MTQ-032 (15+ belt), Q221 (market vs "regulated" price). Keep the keyed answers.
3. **Verify Q235** against the source price-list table (not available to this audit) — likely a copy-paste fare error.
4. **Clarify the wheelchair-occupant wording** in Q029/Q053 so it doesn't read as "no restraint needed."
5. **Targeted belt-responsibility sweep** across all belt questions for the age-15 rule (see theme above).
6. **Coverage caveat:** this pass prioritised legal correctness of keyed answers + explanations. It did **not** re-verify every fare-table numeric answer (no price list) nor every EN translation word-for-word. Those remain partially open.

## ✅ Implemented in this PR

Applied with judgment (the 3 key fixes are each corroborated by a contradicting sibling question, so they also remove internal inconsistencies):

| ID | Change | Files |
|---|---|---|
| **Q314** | answer key **C→A** (police revoke the driver's `ajolupa`, not Traficom) + explanation + clue annotations + `key_overridden` | `questions.json`, `content/enrichment/batch_284_327.json` |
| **Q057** | answer key **B→A** (driver obtains own criminal-record extract) + explanation + clues + `key_overridden` | `questions.json`, `content/enrichment/batch_051_075.json` |
| **MTQ-051** | answer key **C→A** (15+ passenger self-responsible for belt) + explanation + `key_overridden` | `model_test_questions.json` |
| **Q221** | explanation only — "regulated" → operator's price-list fee (pricing is market-based) | `questions.json`, `content/enrichment/batch_199_239.json` |
| **MTQ-032** | explanation only — 15+ belt responsibility wording | `model_test_questions.json` |

Each answer-key change uses the existing `key_overridden` + `correct_master` + `reviewer_notes` mechanism (same as Q051/Q053/Q090) so it is auditable. Bank-question fixes were mirrored into the `content/enrichment/batch_*.json` **source** so a future `build_appready.py` rebuild reproduces them.

**Source-sync debt (flagged, not blocking):** the two `MTQ-*` fixes were applied to the generated `model_test_questions.json` only — their durable source is `content/sources/model_test_workbook.xlsx` (binary; Python build deps not available in this environment). The workbook's `New_Questions` sheet must be updated to match for MTQ-051 (`correct_option` C→A) and MTQ-032 (explanation) before the next model-test rebuild.

## Deliberately NOT changed (judgment calls)

- **Q068** — "must refuse the trip if belt refused": ambiguous (no age specified), source-keyed, low confidence. Left for a content editor.
- **Q235** — €65 fare looks copied from the 20 km variant, but verifying needs the source price-list table (unavailable). Did **not** guess a replacement number.
- **Q029 / Q053** — wheelchair-occupant belt wording is imprecise but the keyed answer is defensible; low confidence. Noted for a wording pass.
- The recurring **15+ seatbelt** theme: fixed the two clear instances (MTQ-051, MTQ-032); a fuller sweep of all belt questions is recommended as a follow-up.
