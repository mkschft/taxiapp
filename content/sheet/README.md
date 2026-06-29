# Question Sheet — seed & sync

This folder holds the **seed export** of the question bank for the Google Sheet
authoring lane (P1/P2 of `docs/plans/content-pipeline-plan.md`). The column
contract is documented for editors in `docs/content/spreadsheet-template.md`.

- **`questions-seed.csv`** — all current questions, one row each, in the 24-column
  contract. Regenerate from the source of truth with `npm run sheet:export`.

## For the editor — start the Sheet from real data (one time)

1. Create a Google Sheet.
2. **File → Import → Upload** → `questions-seed.csv` → *Replace current sheet*.
3. Set dropdowns (Data → Data validation) on **Category**, **Correct**,
   **Difficulty**, **Status** so they can't be mistyped.
4. Edit / add questions (leave **Question ID** blank for new ones — the sync
   assigns the next `Q###`).

## Publishing changes back

1. **File → Share → Publish to web →** the question tab **→ CSV**, copy the URL.
2. A developer runs the **“Content sync (Sheet → PR)”** GitHub Action with that
   URL. It validates the content and opens a pull request for review.

## For developers

```bash
npm run sheet:export                       # questions.json → questions-seed.csv
npm run sheet:sync -- --file <csv>          # merge a CSV into questions.json
npm run sheet:sync -- --url <published-csv>  # …from a published Sheet URL
npm run sheet:sync -- --file <csv> --dry-run # report only, write nothing
npm run sheet:verify                        # assert the round-trip is lossless
npm run check:data                          # the validation gate (run after a sync)
```

`questions.json` is the single source of truth; the Sheet is a disposable,
regenerable authoring surface. Never hand-edit the JSON to win an argument with
the Sheet — fix the Sheet and re-sync, or edit the JSON and let the gate check it.
