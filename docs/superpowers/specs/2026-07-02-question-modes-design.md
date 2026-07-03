# R-lingo: Question Modes, Validation & Retry Loop — Design

**Date:** 2026-07-02
**Status:** Approved

## Context

R-lingo is a Duolingo-style app for learning R (Spanish, public-health examples). Today all ~90 challenges are authored as multiple-choice; a positional hack (`getChallengeMode`) forces some into "write" or "gap" mode. Three problems motivate this work:

1. **Gap mode is broken.** The UI shows `tamano_muestra <- ____` and asks to fill the blank, but validation compares the input against the *full* answer string. Typing what the blank asks for is always marked wrong.
2. **The typed-answer checker is wrong in both directions.** It lowercases everything (so `true` passes for `TRUE` — R is case-sensitive; this teaches a habit that fails in real RStudio) yet rejects valid spacing variants (`edades <- c(34,45,52)`) and valid R alternatives (`'Santiago'`, `x = 42`).
3. **No real variety.** Mode is a positional accident, gap templates are regex-derived (producing bad blanks like `casos / ____` where the blank is `poblacion * 100000`), and several prompts don't match the form of their answer.

## Goals

- Every question has exactly one defensible answer in the form the prompt asks for.
- Typed input validated by a smart, case-sensitive checker with teaching hints.
- Six interaction modes: choice, write, gap, **token bank**, **matching pairs**, plus **predict-the-output** and **spot-the-error** as new content using existing modes.
- Duolingo-style retry loop: wrong answers re-queue; a unit completes only when everything is answered correctly.
- Modularize: content, validation, queue, and mode components leave `App.tsx`.

## Non-goals

- No backend, accounts, or server-side anything. localStorage persistence stays.
- No new units/curriculum beyond the new question types per existing unit.
- No spaced repetition across sessions (only the in-lesson retry loop).
- No XP rebalancing (flat +20 per first-time-correct stays).

## 1. Content model — `src/data/lessons.ts`

All lesson content (`lessons`, `lessonSupport`, `extraChallenges`) moves out of `App.tsx` into `src/data/lessons.ts`. The `Challenge` type gains optional **authored** fields:

```ts
type Challenge = {
  prompt: string
  context: string
  code?: string                // snippet rendered above answers (predict-output / spot-error)
  choices: string[]            // always present — choice is the universal fallback mode
  answer: string
  acceptedAnswers?: string[]   // valid R alternatives, e.g. single quotes, x = 42, 42 -> x
  gap?: { template: string; blank: string; acceptedBlanks?: string[] }
  tokens?: { parts: string[]; distractors: string[] }
  explain: string
  concept: string
}
```

- `gap.template` contains exactly one `____`; `template` with `blank` substituted must equal `answer`.
- `tokens.parts` in order joins (with spaces normalized) to `answer`; `distractors` are 2–3 plausible wrong blocks.
- **Derived supported modes:** `choice` always; `gap` iff `gap` authored; `tokens` iff `tokens` authored; `write` iff `gap` or `tokens` exist (i.e., it is a code question).
- Each lesson gains `matchPairs: { left: string; right: string }[]` (≥6 pairs, function ↔ purpose) for the closing matching exercise; an exercise samples 4 pairs.
- The regex hacks `isCodeAnswer`, `getChallengeMode`, `getGapTemplate` are **deleted**.

### New content per unit

- 1–2 **predict-the-output** questions: `code` shows a short snippet, prompt asks "¿Qué imprime/devuelve R?", answered via choices (or write where unambiguous).
- 1–2 **spot-the-error** questions: `code` shows buggy R, prompt asks "¿Dónde está el error?", choices name the bug.

### Content audit (all ~90 existing questions)

- Reword prompts so the answer matches the asked form (e.g. "¿Qué operador sirve para buscar varias comunas?" must be answerable with `%in%`, not a full expression — or the prompt changes to ask for the expression).
- Every distractor must be plausible but definitively wrong; no distractor may be arguably correct (e.g. `42 -> tamano_muestra()` stays wrong because of the `()`, but plain `42 -> tamano_muestra` may not appear as a distractor since it is valid R — it becomes an `acceptedAnswers` entry instead).
- Author `gap`, `tokens`, and `acceptedAnswers` for every code question. Questions whose answer is prose (e.g. "El script usado para generar la salida") stay choice-only.

## 2. Validation — `src/lib/checkAnswer.ts`

Pure module. `checkTypedAnswer(input: string, expected: string[]): { correct: boolean; hint?: string }`.

**Normalization (applied to both sides):**
- Trim; collapse internal whitespace to single spaces.
- Normalize spacing around operators and punctuation: `<-`, `->`, `==`, `>=`, `<=`, `!=`, `=`, `&`, `|`, `+`, `-`, `*`, `/`, `%in%`, `,`, `(`, `)` → canonical single-space form (`a<-b` ≡ `a <- b`; `c(34,45)` ≡ `c(34, 45)`).
- Unify quotes: `'` → `"`.
- **No case folding.** Comparison is case-sensitive.

**Decision path:**
1. Normalized input equals any of `expected` (answer + acceptedAnswers, or blank + acceptedBlanks for gap) → correct.
2. Case-insensitive comparison matches → wrong, hint: `R distingue mayúsculas: es \`X\`, no \`Y\`` (quoting the differing token).
3. Unbalanced parentheses → wrong, hint about the missing/extra paren.
4. Expected contains a quoted string and input has the same word unquoted → wrong, hint that text needs quotes.
5. Otherwise → wrong, generic feedback (see retry loop for what gets revealed when).

Gap mode validates the typed blank against `gap.blank` + `gap.acceptedBlanks` — never the full line. This fixes bug (1).

## 3. Session queue & retry loop

- Entering practice for a lesson builds a session queue of its incomplete challenge indices (order preserved).
- **Correct:** +20 XP if first completion (existing `completedCorrect` logic), streak++, celebration, next item.
- **Wrong:** −1 heart, streak reset, feedback shows the *hint* and `explain` but **not** the literal expected answer; the challenge is re-queued at the back flagged `retry`.
- **Retry presentation:** shown in a different supported mode than the one failed (see §4). Wrong again → full expected answer revealed; the item re-queues again until answered correctly.
- Unit completes only when the queue is empty. Then the **matching exercise** runs as a closing "repaso": two columns, tap-to-pair, matched pairs lock green; mismatches shake with no heart loss; +20 XP on completion. After it, the unit celebration fires.
- The queue is session state only — on reload it is rebuilt from `completedCorrect`. localStorage format (`r-lingo-progress-v2`) is unchanged.
- Hearts at 0: unchanged from current behavior (cosmetic counter; no lockout). Not in scope to change.

## 4. Mode selection — `src/lib/pickMode.ts`

`pickMode(challenge, seed, excludeMode?)`:
- Deterministic seeded pick among the challenge's supported modes (seed = challenge key + attempt count), so a session naturally mixes modes and the same challenge can vary between sessions/attempts.
- `excludeMode` (the mode just failed) removes that mode from the pool when alternatives exist.
- Prose-only questions always render as choice.

## 5. Components & App shell

New `src/components/`:

| Component | Responsibility |
|---|---|
| `ChoiceList` | Existing choice UI, extracted; renders `code` snippet support |
| `WriteCard` | Write + gap input, hint display, uses `checkAnswer` |
| `TokenBank` | Shuffled blocks (parts + distractors); tap to append to the answer line, tap a placed block to remove; built line validated by joining parts |
| `MatchBoard` | 4-pair matching board for the lesson repaso |
| `FeedbackCard` | Correct/wrong/hint/reveal states + "repasar concepto" link |

`App.tsx` keeps: layout, topbar/stats, progress strips, theory card, lesson path, celebrations, and orchestration of the queue. `code` snippets render as a `<pre><code>` block above the answer area. New styles follow the existing `App.css` design system (same palette, radii, shadows).

## 6. Testing

The project has no test setup. Add **vitest** (dev dependency, `npm test` script):

- `checkAnswer.test.ts` — table-driven: spacing variants, quote unification, case-sensitivity hints, paren hints, gap blanks, acceptedAnswers.
- `pickMode.test.ts` — supported-mode derivation, exclusion on retry, determinism.
- Queue logic tests — re-queue on wrong, completion condition, rebuild from `completedCorrect`.
- A content-integrity test over `lessons.ts`: every `gap.template` contains exactly one `____` and reconstructs `answer`; every `tokens.parts` joins to `answer`; every `answer` is in `choices`; no duplicate choices.

UI verified via `npm run build` + running the app.

## Error handling

- Malformed authored content is caught by the content-integrity test at dev time, not at runtime.
- `readStoredProgress` clamping logic stays; out-of-range indices from older stored versions resolve to the first incomplete challenge (existing behavior).

## Risks

- **Content volume:** auditing ~90 questions + authoring gaps/tokens/acceptedAnswers + ~27 new questions is the bulk of the effort; it is data work, reviewable in isolation.
- **Normalizer edge cases:** mitigated by table-driven tests; the normalizer only needs to handle R syntax actually present in the course content.
