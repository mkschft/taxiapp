# Content pipeline (developer notes)

**Excel is the source of truth for all content.** This folder compiles it into
the JSON the app ships. No server in this loop — it's a build step.

```
content/content_workbook.xlsx  ──python build_appready.py──▶  src/data/json/questions.json  ──▶  app
        (content editor)                                       (generated, app reads this)
```

> **Non-developer?** Read `CONTENT_GUIDE.md` instead — it covers the whole
> edit → build loop without any of the internals below.

## The files

| File | Role |
|---|---|
| `content_workbook.xlsx` | **Source of truth.** The content editor's working file (327 questions, all fields). |
| `build_appready.py` | **Daily-driver build.** Reads the workbook → writes `src/data/json/questions.json` + a report. |
| `build_workbook.py` | **Bootstrap/reset only.** Regenerates `content_workbook.xlsx` from `questions.json`. ⚠️ Overwrites the workbook — don't run it unless you mean to reset. |
| `build_content.py` | Builds the vocab JSON (`vocab_*.json`) from `sources/vocab.xlsx`. |
| `build.command` | Double-clickable wrapper around `build_appready.py` for the content editor. |
| `sources/master.xlsx` | Original FI source. Supplies category / topic / ref + the original answer key (for `[KEY]` change detection). |
| `sources/vocab.xlsx` | Vocabulary source. |
| `enrichment.json`, `enrichment/*.json` | **Legacy.** The original AI authoring batches. Kept as a fallback: if the workbook is missing, the build reconstructs from these + `sources/template_appready.xlsx`. |
| `output/_report.txt` | Latest build + validation report. |

## Daily build

```bash
pip3 install -r content/requirements.txt   # first time only
python3 content/build_appready.py          # reads the workbook, writes questions.json
```

The build prints (and saves to `output/_report.txt`):

- `[TODO]` — question missing an English translation
- `[WARN]` — a clue word wasn't found verbatim in the FI text (won't highlight)
- `[KEY]`  — the workbook's answer differs from the original master answer key

`source:` in the summary tells you whether it read the workbook or fell back to
the legacy JSON. If you see the fallback unexpectedly, the workbook is missing.

## The clue model

Each question carries a `clue_annotations` array, derived from the workbook's
`fw/pcw/ncw` columns:

```json
{ "text_fi": "keskustelet", "meaning_en": "discuss",
  "clue_type": "pcw", "found_in": ["option_a"] }
```

- `clue_type`: `fw` = focus word (yellow), `pcw` = positive clue, `ncw` = negative clue
- `found_in`: which text(s) the phrase appears in — `question`, `option_a/b/c`.
  Derived at build time, so the app's highlighter needs **no runtime text matching**.

## Output schema

`src/data/json/questions.json` — see `src/data/types.ts` (`Question` type) for the
exact shape. Category IDs are mapped from the master's `CAT1..4` to the app's
`passenger_safety` / `special_needs` / `customer_service` / `traffic_safety`
(see `CAT_ID_MAP` in `build_appready.py`).

## Next layers (not built yet)

The JSON shape is designed so a `SupabaseAdapter` could later seed a database
from the same file — content stays Excel-authored either way. User data
(progress, auth, payments) is a separate concern, deferred until login/sync/
payments are actually needed.
