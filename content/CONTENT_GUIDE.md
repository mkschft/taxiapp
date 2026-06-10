# Content Guide — how to update the app's questions

You maintain **one file**:

```
content/content_workbook.xlsx
```

Everything the app shows — Finnish questions, English translations, clue words,
explanations — lives in this spreadsheet. You edit it like any normal Excel file.
When you're done, you run the **build** (one double-click) and the app picks up
your changes.

There is **no database to log into** and **no code to touch.** Excel in, app out.

---

## The 4-step loop

```
   ┌──────────────────────────────────────────────────────┐
   │  1. Open    content/content_workbook.xlsx            │
   │  2. Edit    the cells you want to change, then SAVE  │
   │  3. Build   double-click  content/build.command      │
   │  4. Check   read the summary — fix any TODO / WARN   │
   └──────────────────────────────────────────────────────┘
```

That's the whole job. Repeat whenever content needs changing.

---

## First time only — one setup step

The build needs Python (already on every Mac) plus one small library.
The `build.command` installs it automatically the first time, so usually you
don't have to do anything. If a Mac blocks the double-click the first time:

- Right-click `build.command` → **Open** → **Open** (this approves it once).

After that, a normal double-click works forever.

---

## The spreadsheet, column by column

Open the **Questions** sheet. Each row is one exam question. The columns are
colour-coded so you can see at a glance what each one is for.

| Colour | Columns | What it is |
|---|---|---|
| ⬜ **Grey** | Question ID, Category, Topic, Ref # | **Reference only — do NOT edit.** Helps you find the question. |
| 🟦 **Blue** | Question (FI), Option A/B/C (FI) | The **Finnish** text shown in the app. |
| 🟩 **Green** | Question (EN), Option A/B/C (EN) | The **English** translation (shown when the user taps *Translate*). |
| 🟨 **Gold** | Correct (A/B/C) | Which option is the **right answer** — a single letter. |
| 🟨 **Gold** | Focus words (FI/EN) | Key Finnish words to **highlight yellow** in the question. |
| 🟩 **Green** | Positive clues (FI/EN) | Words in the **correct** option that signal it's right. |
| 🟥 **Red** | Negative clues (FI/EN) | Words in a **wrong** option that signal it's wrong. |
| ⬜ **Grey** | Explanation (EN), Difficulty, Tags, Status, Reviewer notes | Extra info — see below. |

- **Difficulty** — pick from the dropdown: `Easy`, `Medium`, `Hard`.
- **Status** — your own label, e.g. `ai-draft`, `reviewed`, `final`.
- **Reviewer notes** — anything you want to flag for yourself or the developer.
  This never shows in the app.

---

## How clue words work (the important part)

Clue words are what make this app special — they teach drivers to "read the
language" even with weak Finnish. There are **three kinds**:

- **Focus words** — the key Finnish words in the *question* (highlighted yellow).
- **Positive clues** — words in the *correct answer* that point toward it.
- **Negative clues** — words in a *wrong answer* that point away from it.

### The 3 rules

1. **Separate multiple words with a semicolon `;`**

   > `avustaa; auttaa sisään; tiedustelee`

2. **A Finnish clue word must appear EXACTLY as written in the Finnish text.**

   The app highlights a clue by finding it letter-for-letter in the FI text. If
   you write `auttaa` but the text says `auttamaan`, it won't highlight, and the
   build will warn you. Copy the word straight from the FI cell to be safe.

3. **The English meanings line up by position with the Finnish words.**

   > Focus words (FI): `avustaa; tiedustelee`
   > Focus words (EN): `to assist; asks/inquires`

   (1st EN = 1st FI, 2nd EN = 2nd FI, and so on.)

---

## Golden rules (don't break these)

- ❌ **Never change a Question ID.** It's how the app and your progress data find
  the question. (Category / Topic / Ref # are also reference-only.)
- ✅ **Correct (A/B/C)** must be a single letter: `A`, `B`, or `C`.
- ✅ **Difficulty** must be `Easy`, `Medium`, or `Hard`.
- ✅ Always **Save** before building.
- ✅ Don't rename the column headers or the **Questions** sheet.

---

## Reading the build summary

After you build, you'll see something like:

```
CONTENT BUILD REPORT
==============================================
source:                content_workbook.xlsx
questions total:       327
with English:          323  (98%)
missing English [TODO]: 4
answer-key changes:     3
clue-match warnings:    98
```

Then a list of lines. Here's what each tag means:

| Tag | Meaning | What to do |
|---|---|---|
| `[TODO]` | A question has **no English** yet. | Write the English translation when ready. |
| `[WARN]` | A **clue word wasn't found** in the FI text (so it won't highlight). | Fix the spelling so it matches the FI text exactly. |
| `[KEY]` | The answer you set **differs** from the original master answer key. | Fine if intentional — it's just letting you know. |

The full list is always saved to `content/output/_report.txt` so you can read it
later.

> **Warnings are not errors.** The app still builds and works. They're a to-do
> list of polish items. A clue that doesn't match just won't be highlighted.

---

## Common tasks

**Fix a typo in a Finnish question**
→ Edit the **Question (FI)** cell, save, build. Done.

**Add the English for a question that's missing it**
→ Fill in **Question (EN)** and the three **Option … (EN)** cells, save, build.
The `[TODO]` for that question disappears.

**Change which answer is correct**
→ Change the **Correct (A/B/C)** cell, save, build. (You'll see a `[KEY]` note
confirming it differs from the original — that's expected.)

**Add a clue word**
→ Add it to the right clue column (semicolon-separated), add its English meaning
in the same position in the matching EN column, save, build. Make sure the
Finnish word matches the text exactly.

---

## What to hand the developer

After building, the app data file is updated automatically at
`src/data/json/questions.json`. Just let the developer know you've made changes
(or commit the workbook + that file if you use git). They handle shipping the
update to the app.

---

## If something looks broken

1. Re-open the workbook and check the row mentioned in the report.
2. Make sure you didn't rename a header or the sheet.
3. Send the developer the messages from the build window — they can sort it out.

You can't permanently break anything: the build only **reads** your workbook and
**writes** the app data file. Your spreadsheet is never overwritten.
