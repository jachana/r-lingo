# R-lingo Question Modes, Validation & Retry Loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken gap validation, add a smart case-sensitive answer checker with teaching hints, add token-bank and matching-pairs modes plus predict-output/spot-error content, and a Duolingo-style retry queue — per the approved spec `docs/superpowers/specs/2026-07-02-question-modes-design.md`.

**Architecture:** Lesson content moves from `App.tsx` to `src/data/lessons.ts` with authored per-question assets (`gap`, `tokens`, `acceptedAnswers`, `code`). Pure logic lives in `src/lib/` (checker, mode picker, session queue), interaction modes in `src/components/`. `App.tsx` keeps layout/stats/theory and orchestrates a session queue that re-queues wrong answers.

**Tech Stack:** React 19 + TypeScript + Vite 8. Tests: vitest (new dev dependency). Lint: oxlint. All UI copy is **Spanish**; code identifiers English.

## Global Constraints

- All user-facing copy in Spanish, matching the existing tone (informal "tú", public-health framing).
- Comparison of typed R is **case-sensitive**; spacing and quote style are normalized (spec §2).
- localStorage key and `StoredProgress` shape stay unchanged: `r-lingo-progress-v2`, `{ lessonIndex, challengeIndex, hearts, streak, completedCorrect, xp }`.
- XP stays flat +20 per first-time-correct challenge and +20 per matching repaso.
- CSS follows the existing design system in `src/App.css`: 2px solid borders `#dce7df`, 8px radii, hard drop shadows (`box-shadow: 0 6px 0 #e0e9e4`), greens `#278f52`/`#2ca65f`, wrong-red `#d95b4f`, monospace stack `'SFMono-Regular', Consolas, 'Liberation Mono', monospace`.
- After each task: `npm test`, `npm run lint`, and `npm run build` must pass.
- Commit messages end with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01VLNXfMtgRZ2P6kRCtj8X28`

---

### Task 1: Vitest setup + extract lesson data to `src/data/lessons.ts`

**Files:**
- Modify: `package.json` (add vitest + test script)
- Create: `src/data/lessons.ts`
- Create: `src/data/lessons.test.ts`
- Modify: `src/App.tsx` (delete moved code, import from data module)

**Interfaces:**
- Consumes: nothing (first task).
- Produces (later tasks import these from `../data/lessons`):
  - `type Challenge = { prompt: string; context: string; choices: string[]; answer: string; explain: string; concept: string }` (extended in Task 3)
  - `type Lesson = { title: string; tag: string; goal: string; theory: {...}; icon: 'play' | 'flask' | 'chart'; challenges: Challenge[] }`
  - `type LessonSupport = { keyIdeas: string[]; script: string; tips: string[] }`
  - `const lessons: Lesson[]`, `const lessonSupport: Record<string, LessonSupport>`, `const extraChallenges: Record<string, Challenge[]>`
  - `function getLessonChallenges(lesson: Lesson): Challenge[]`
  - `function getChallengeKey(lessonPosition: number, challengePosition: number): string`

- [ ] **Step 1: Install vitest and add the test script**

```bash
npm install --save-dev vitest
```

In `package.json` scripts, add:

```json
"test": "vitest run"
```

- [ ] **Step 2: Create `src/data/lessons.ts`**

Move — **verbatim, no content edits in this task** — from `src/App.tsx` into `src/data/lessons.ts`:
- the `Challenge` and `Lesson` type definitions (`src/App.tsx:20-47`)
- the whole `lessons` array (`src/App.tsx:49-608`)
- the `LessonSupport` type and `lessonSupport` record (`src/App.tsx:616-782`)
- the `extraChallenges` record (`src/App.tsx:784-1235`)
- `getLessonChallenges` (`src/App.tsx:1237-1239`)
- `getChallengeKey` (`src/App.tsx:1317-1319`)

Export all of them (`export type Challenge`, `export const lessons`, etc.). Do NOT move `ChallengeMode`, `isCodeAnswer`, `getChallengeMode`, `getGapTemplate` — those stay in `App.tsx` for now (deleted in Task 8).

- [ ] **Step 3: Update `src/App.tsx` to import from the data module**

Delete the moved code and add:

```ts
import {
  type Challenge,
  type Lesson,
  extraChallenges,
  getChallengeKey,
  getLessonChallenges,
  lessons,
  lessonSupport,
} from './data/lessons'
```

Note: `Lesson` and `extraChallenges` may end up unused in App.tsx — drop them from the import if oxlint complains. `ChallengeMode` stays defined locally in App.tsx for now.

- [ ] **Step 4: Write the content-integrity test v1**

Create `src/data/lessons.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { extraChallenges, getLessonChallenges, lessons } from './lessons'

const allChallenges = lessons.flatMap((lesson) =>
  getLessonChallenges(lesson).map((challenge, index) => ({
    id: `${lesson.title} #${index}`,
    challenge,
  })),
)

describe('content integrity', () => {
  it('every extraChallenges key matches a lesson title', () => {
    const titles = new Set(lessons.map((lesson) => lesson.title))
    for (const key of Object.keys(extraChallenges)) {
      expect(titles.has(key), `extraChallenges key sin unidad: ${key}`).toBe(true)
    }
  })

  it.each(allChallenges)('$id: answer is one of the choices', ({ challenge }) => {
    expect(challenge.choices).toContain(challenge.answer)
  })

  it.each(allChallenges)('$id: choices are unique and non-empty', ({ challenge }) => {
    expect(new Set(challenge.choices).size).toBe(challenge.choices.length)
    for (const choice of challenge.choices) expect(choice.trim().length).toBeGreaterThan(0)
  })

  it.each(allChallenges)('$id: prompt, explain and concept are non-empty', ({ challenge }) => {
    expect(challenge.prompt.trim().length).toBeGreaterThan(0)
    expect(challenge.explain.trim().length).toBeGreaterThan(0)
    expect(challenge.concept.trim().length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Run tests, lint, build**

```bash
npm test && npm run lint && npm run build
```

Expected: all tests PASS (if an `answer is one of the choices` case fails, the data was mis-moved — fix the move, not the data). Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/data/lessons.ts src/data/lessons.test.ts src/App.tsx
git commit -m "refactor: extract lesson data to src/data/lessons.ts, add vitest + content integrity tests"
```

---

### Task 2: Answer checker — `src/lib/checkAnswer.ts` (TDD)

**Files:**
- Create: `src/lib/checkAnswer.ts`
- Create: `src/lib/checkAnswer.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type CheckResult = { correct: boolean; hint?: string }`
  - `function normalizeCode(value: string): string`
  - `function checkTypedAnswer(input: string, expected: string[]): CheckResult` — `expected[0]` is the canonical answer (used for hint heuristics); the rest are accepted alternatives.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/checkAnswer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { checkTypedAnswer, normalizeCode } from './checkAnswer'

describe('normalizeCode', () => {
  it.each([
    ['edades<-c(34,45,52)', 'edades <- c(34, 45, 52)'],
    ['edades  <-   c( 34 ,45, 52 )', 'edades <- c(34, 45, 52)'],
    ["filter(comuna == 'Santiago')", 'filter(comuna == "Santiago")'],
    ['mean(edad,na.rm=TRUE)', 'mean(edad, na.rm = TRUE)'],
    ['casos/poblacion*100000', 'casos / poblacion * 100000'],
    ['comuna%in%c("Santiago")', 'comuna %in% c("Santiago")'],
    ['edad>=18', 'edad >= 18'],
    ['42->tamano_muestra', '42 -> tamano_muestra'],
    ['#  excluir   registros', '# excluir registros'],
  ])('normalizes %s and %s to the same string', (a, b) => {
    expect(normalizeCode(a)).toBe(normalizeCode(b))
  })

  it('does NOT fold case', () => {
    expect(normalizeCode('TRUE')).not.toBe(normalizeCode('true'))
  })
})

describe('checkTypedAnswer', () => {
  const expected = ['mean(edad, na.rm = TRUE)']

  it('accepts spacing variants', () => {
    expect(checkTypedAnswer('mean(edad,na.rm=TRUE)', expected).correct).toBe(true)
  })

  it('accepts any entry of the expected list', () => {
    const result = checkTypedAnswer('tamano_muestra = 42', [
      'tamano_muestra <- 42',
      'tamano_muestra = 42',
      '42 -> tamano_muestra',
    ])
    expect(result.correct).toBe(true)
  })

  it('accepts single quotes where double quotes are expected', () => {
    expect(checkTypedAnswer("filter(comuna == 'Santiago')", ['filter(comuna == "Santiago")']).correct).toBe(true)
  })

  it('rejects case differences with a specific hint', () => {
    const result = checkTypedAnswer('mean(edad, na.rm = true)', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('mayúsculas')
    expect(result.hint).toContain('TRUE')
    expect(result.hint).toContain('true')
  })

  it('hints about unbalanced parentheses', () => {
    const result = checkTypedAnswer('mean(edad, na.rm = TRUE', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('paréntesis')
  })

  it('hints about missing quotes around a string literal', () => {
    const result = checkTypedAnswer('filter(comuna == Santiago)', ['filter(comuna == "Santiago")'])
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('comillas')
  })

  it('plain wrong answers get no hint', () => {
    const result = checkTypedAnswer('median(edad)', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toBeUndefined()
  })

  it('empty input is wrong without hint', () => {
    expect(checkTypedAnswer('   ', expected)).toEqual({ correct: false })
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/lib/checkAnswer.test.ts
```

Expected: FAIL — cannot resolve `./checkAnswer`.

- [ ] **Step 3: Implement `src/lib/checkAnswer.ts`**

```ts
export type CheckResult = { correct: boolean; hint?: string }

// Multi-char operators are protected with placeholder chars so the
// single-char pass can't split them (e.g. `<-` must not become `< -`).
const operatorPlaceholders: [string, string][] = [
  ['%in%', '\u0001'],
  ['<-', '\u0002'],
  ['->', '\u0003'],
  ['==', '\u0004'],
  ['>=', '\u0005'],
  ['<=', '\u0006'],
  ['!=', '\u0007'],
]

export function normalizeCode(value: string): string {
  let out = value.trim().replace(/'/g, '"')
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(op).join(placeholder)
  out = out.replace(/([\u0001-\u0007=+\-*/&|<>,()])/g, ' $1 ')
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(placeholder).join(op)
  return out
    .replace(/\s+/g, ' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
    .replace(/ ,/g, ',')
    .trim()
}

function findCaseMismatch(input: string, candidate: string): { want: string; got: string } | undefined {
  const inputTokens = input.split(' ')
  const candidateTokens = candidate.split(' ')
  for (let index = 0; index < candidateTokens.length; index += 1) {
    if (candidateTokens[index] !== inputTokens[index]) {
      return { want: candidateTokens[index], got: inputTokens[index] ?? '' }
    }
  }
  return undefined
}

export function checkTypedAnswer(input: string, expected: string[]): CheckResult {
  const normalizedInput = normalizeCode(input)
  if (!normalizedInput) return { correct: false }
  const normalizedExpected = expected.map(normalizeCode)

  if (normalizedExpected.includes(normalizedInput)) return { correct: true }

  const caseMatch = normalizedExpected.find(
    (candidate) => candidate.toLowerCase() === normalizedInput.toLowerCase(),
  )
  if (caseMatch) {
    const mismatch = findCaseMismatch(normalizedInput, caseMatch)
    if (mismatch) {
      return {
        correct: false,
        hint: `Casi — R distingue mayúsculas: es \`${mismatch.want}\`, no \`${mismatch.got}\`.`,
      }
    }
  }

  const opens = (normalizedInput.match(/\(/g) ?? []).length
  const closes = (normalizedInput.match(/\)/g) ?? []).length
  if (opens !== closes) {
    return {
      correct: false,
      hint:
        opens > closes
          ? 'Te falta cerrar un paréntesis `)`.'
          : 'Hay un paréntesis `)` de más o falta abrir `(`.',
    }
  }

  const primary = normalizedExpected[0]
  const quotedLiteral = primary.match(/"([^"]+)"/)?.[1]
  if (
    quotedLiteral &&
    !normalizedInput.includes('"') &&
    normalizedInput.toLowerCase().includes(quotedLiteral.toLowerCase())
  ) {
    return { correct: false, hint: `El texto va entre comillas: \`"${quotedLiteral}"\`.` }
  }

  return { correct: false }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/checkAnswer.test.ts
```

Expected: all PASS. If the `#` comment case fails, check that `#` is not in the spacing character class (it must not be — comments only need whitespace collapsing).

- [ ] **Step 5: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/lib/checkAnswer.ts src/lib/checkAnswer.test.ts
git commit -m "feat: smart case-sensitive answer checker with teaching hints"
```

---

### Task 3: Challenge type extension + `src/lib/pickMode.ts` (TDD)

**Files:**
- Modify: `src/data/lessons.ts` (extend `Challenge`, add `MatchPair`)
- Create: `src/lib/pickMode.ts`
- Create: `src/lib/pickMode.test.ts`
- Modify: `src/data/lessons.test.ts` (add invariants for the new fields)

**Interfaces:**
- Consumes: `Challenge` from `../data/lessons`.
- Produces:
  - Extended `Challenge` (new optional fields): `code?: string`, `acceptedAnswers?: string[]`, `gap?: { template: string; blank: string; acceptedBlanks?: string[] }`, `tokens?: { parts: string[]; distractors: string[] }`
  - `export type MatchPair = { left: string; right: string }`; `Lesson` gains `matchPairs?: MatchPair[]` (made required in Task 7)
  - `export type ChallengeMode = 'choice' | 'write' | 'gap' | 'tokens'` (in `pickMode.ts`)
  - `function supportedModes(challenge: Challenge): ChallengeMode[]`
  - `function pickMode(challenge: Challenge, seed: string, excludeMode?: ChallengeMode): ChallengeMode`

- [ ] **Step 1: Extend the types in `src/data/lessons.ts`**

```ts
export type MatchPair = { left: string; right: string }

export type Challenge = {
  prompt: string
  context: string
  code?: string
  choices: string[]
  answer: string
  acceptedAnswers?: string[]
  gap?: { template: string; blank: string; acceptedBlanks?: string[] }
  tokens?: { parts: string[]; distractors: string[] }
  explain: string
  concept: string
}
```

And add `matchPairs?: MatchPair[]` to `Lesson`.

- [ ] **Step 2: Write failing tests for pickMode**

Create `src/lib/pickMode.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Challenge } from '../data/lessons'
import { pickMode, supportedModes } from './pickMode'

const base: Challenge = {
  prompt: 'p',
  context: 'c',
  choices: ['a', 'b'],
  answer: 'a',
  explain: 'e',
  concept: 'k',
}

const gap = { template: 'x <- ____', blank: '42' }
const tokens = { parts: ['x', '<-', '42'], distractors: ['=='] }

describe('supportedModes', () => {
  it('prose question: choice only', () => {
    expect(supportedModes(base)).toEqual(['choice'])
  })
  it('gap authored: choice + gap + write', () => {
    expect(supportedModes({ ...base, gap })).toEqual(['choice', 'gap', 'write'])
  })
  it('tokens authored: choice + tokens + write', () => {
    expect(supportedModes({ ...base, tokens })).toEqual(['choice', 'tokens', 'write'])
  })
  it('both authored: all four', () => {
    expect(supportedModes({ ...base, gap, tokens })).toEqual(['choice', 'gap', 'tokens', 'write'])
  })
})

describe('pickMode', () => {
  const full = { ...base, gap, tokens }

  it('is deterministic for the same seed', () => {
    expect(pickMode(full, 'seed-1')).toBe(pickMode(full, 'seed-1'))
  })

  it('returns a supported mode', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(supportedModes(full)).toContain(pickMode(full, seed))
    }
  })

  it('varies across seeds', () => {
    const picks = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].map((seed) => pickMode(full, seed)))
    expect(picks.size).toBeGreaterThan(1)
  })

  it('excludes the failed mode when alternatives exist', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(pickMode(full, seed, 'choice')).not.toBe('choice')
    }
  })

  it('ignores exclusion when it is the only mode', () => {
    expect(pickMode(base, 'any', 'choice')).toBe('choice')
  })
})
```

- [ ] **Step 3: Run to verify failure**

```bash
npx vitest run src/lib/pickMode.test.ts
```

Expected: FAIL — cannot resolve `./pickMode`.

- [ ] **Step 4: Implement `src/lib/pickMode.ts`**

```ts
import type { Challenge } from '../data/lessons'

export type ChallengeMode = 'choice' | 'write' | 'gap' | 'tokens'

export function supportedModes(challenge: Challenge): ChallengeMode[] {
  const modes: ChallengeMode[] = ['choice']
  if (challenge.gap) modes.push('gap')
  if (challenge.tokens) modes.push('tokens')
  if (challenge.gap || challenge.tokens) modes.push('write')
  return modes
}

function hashSeed(seed: string): number {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

export function pickMode(challenge: Challenge, seed: string, excludeMode?: ChallengeMode): ChallengeMode {
  let modes = supportedModes(challenge)
  if (excludeMode && modes.length > 1) modes = modes.filter((mode) => mode !== excludeMode)
  return modes[hashSeed(seed) % modes.length]
}
```

- [ ] **Step 5: Extend the content-integrity tests**

Append to `src/data/lessons.test.ts` (inside the `content integrity` describe; reuse the existing `allChallenges`). These pass vacuously until content is authored in Tasks 5–7, then they police it:

```ts
import { normalizeCode } from '../lib/checkAnswer'

it.each(allChallenges)('$id: gap template reconstructs the answer', ({ challenge }) => {
  if (!challenge.gap) return
  expect(challenge.gap.template.split('____').length, 'template debe tener exactamente un ____').toBe(2)
  const rebuilt = challenge.gap.template.replace('____', challenge.gap.blank)
  expect(normalizeCode(rebuilt)).toBe(normalizeCode(challenge.answer))
})

it.each(allChallenges)('$id: token parts join to the answer', ({ challenge }) => {
  if (!challenge.tokens) return
  expect(normalizeCode(challenge.tokens.parts.join(' '))).toBe(normalizeCode(challenge.answer))
  expect(challenge.tokens.distractors.length).toBeGreaterThanOrEqual(2)
  // A distractor identical to a part would create two "correct" chips.
  for (const distractor of challenge.tokens.distractors) {
    expect(challenge.tokens.parts).not.toContain(distractor)
  }
})

it.each(allChallenges)('$id: acceptedAnswers do not duplicate the answer', ({ challenge }) => {
  for (const accepted of challenge.acceptedAnswers ?? []) {
    expect(normalizeCode(accepted)).not.toBe(normalizeCode(challenge.answer))
  }
})
```

- [ ] **Step 6: Run everything, commit**

```bash
npm test && npm run lint && npm run build
git add src/data/lessons.ts src/data/lessons.test.ts src/lib/pickMode.ts src/lib/pickMode.test.ts
git commit -m "feat: authored challenge assets (gap/tokens/acceptedAnswers/code) + seeded mode picker"
```

---

### Task 4: Session queue — `src/lib/sessionQueue.ts` (TDD)

**Files:**
- Create: `src/lib/sessionQueue.ts`
- Create: `src/lib/sessionQueue.test.ts`

**Interfaces:**
- Consumes: `getChallengeKey` from `../data/lessons`; `ChallengeMode` from `./pickMode`.
- Produces:
  - `type QueueItem = { challengeIndex: number; attempts: number; failedModes: ChallengeMode[] }`
  - `function buildQueue(lessonIndex: number, challengeCount: number, completedCorrect: string[]): QueueItem[]`
  - `function advanceQueue(queue: QueueItem[]): QueueItem[]` — call after a correct answer; drops the head.
  - `function requeueFailed(queue: QueueItem[], failedMode: ChallengeMode): QueueItem[]` — call after a wrong answer; moves the head to the back with `attempts + 1` and the mode appended to `failedModes`.
  - `function shouldReveal(item: QueueItem): boolean` — true when the item has already been failed before (so a wrong answer NOW reveals the expected answer).

- [ ] **Step 1: Write failing tests**

Create `src/lib/sessionQueue.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getChallengeKey } from '../data/lessons'
import { advanceQueue, buildQueue, requeueFailed, shouldReveal } from './sessionQueue'

describe('buildQueue', () => {
  it('contains all challenges when nothing is complete', () => {
    expect(buildQueue(0, 3, []).map((item) => item.challengeIndex)).toEqual([0, 1, 2])
  })

  it('skips completed challenges', () => {
    const completed = [getChallengeKey(0, 1)]
    expect(buildQueue(0, 3, completed).map((item) => item.challengeIndex)).toEqual([0, 2])
  })

  it('only skips completions of the same lesson', () => {
    const completed = [getChallengeKey(1, 0)]
    expect(buildQueue(0, 2, completed).map((item) => item.challengeIndex)).toEqual([0, 1])
  })

  it('items start with zero attempts and no failed modes', () => {
    expect(buildQueue(0, 1, [])[0]).toEqual({ challengeIndex: 0, attempts: 0, failedModes: [] })
  })
})

describe('advanceQueue / requeueFailed', () => {
  it('advance drops the head', () => {
    const queue = buildQueue(0, 3, [])
    expect(advanceQueue(queue).map((item) => item.challengeIndex)).toEqual([1, 2])
  })

  it('requeue moves the head to the back with attempt + failed mode recorded', () => {
    const queue = buildQueue(0, 3, [])
    const next = requeueFailed(queue, 'choice')
    expect(next.map((item) => item.challengeIndex)).toEqual([1, 2, 0])
    expect(next[2]).toEqual({ challengeIndex: 0, attempts: 1, failedModes: ['choice'] })
  })

  it('requeue on a single-item queue keeps the item as head', () => {
    const queue = buildQueue(0, 1, [])
    const next = requeueFailed(queue, 'write')
    expect(next).toHaveLength(1)
    expect(next[0].attempts).toBe(1)
  })

  it('does not mutate the input queue', () => {
    const queue = buildQueue(0, 2, [])
    requeueFailed(queue, 'choice')
    advanceQueue(queue)
    expect(queue[0]).toEqual({ challengeIndex: 0, attempts: 0, failedModes: [] })
    expect(queue).toHaveLength(2)
  })
})

describe('shouldReveal', () => {
  it('false on first attempt, true once the item was failed before', () => {
    const queue = buildQueue(0, 1, [])
    expect(shouldReveal(queue[0])).toBe(false)
    const retried = requeueFailed(queue, 'choice')
    expect(shouldReveal(retried[0])).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/lib/sessionQueue.test.ts
```

Expected: FAIL — cannot resolve `./sessionQueue`.

- [ ] **Step 3: Implement `src/lib/sessionQueue.ts`**

```ts
import { getChallengeKey } from '../data/lessons'
import type { ChallengeMode } from './pickMode'

export type QueueItem = {
  challengeIndex: number
  attempts: number
  failedModes: ChallengeMode[]
}

export function buildQueue(lessonIndex: number, challengeCount: number, completedCorrect: string[]): QueueItem[] {
  return Array.from({ length: challengeCount }, (_, index) => index)
    .filter((index) => !completedCorrect.includes(getChallengeKey(lessonIndex, index)))
    .map((challengeIndex) => ({ challengeIndex, attempts: 0, failedModes: [] }))
}

export function advanceQueue(queue: QueueItem[]): QueueItem[] {
  return queue.slice(1)
}

export function requeueFailed(queue: QueueItem[], failedMode: ChallengeMode): QueueItem[] {
  const [head, ...rest] = queue
  return [...rest, { ...head, attempts: head.attempts + 1, failedModes: [...head.failedModes, failedMode] }]
}

export function shouldReveal(item: QueueItem): boolean {
  return item.attempts >= 1
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npm test && npm run lint && npm run build
git add src/lib/sessionQueue.ts src/lib/sessionQueue.test.ts
git commit -m "feat: session queue with retry re-queueing and reveal rule"
```

---

### Task 5: Content authoring — units 1–5 (audit + gap/tokens/acceptedAnswers)

**Files:**
- Modify: `src/data/lessons.ts` (data only)

**Interfaces:**
- Consumes: the extended `Challenge` type (Task 3). The integrity tests (Tasks 1+3) are the acceptance gate.
- Produces: authored `gap`, `tokens`, `acceptedAnswers` on the code questions of units 1–5, and audited prompts/distractors.

**Authoring rules (apply to every question touched):**
1. `gap.template` has exactly one `____`; substituting `blank` reconstructs `answer` (integrity-tested). Blank the *concept-bearing* part (the function name, the operator, or the value — whichever the question teaches), never a trivial fragment.
2. `tokens.parts`: 3–8 blocks that join (space-separated) to `answer` (integrity-tested; `normalizeCode` forgives spacing). Split at natural R boundaries: `['edades', '<-', 'c(', '34,', '45,', '52', ')']`. `distractors`: 2–3 plausible but wrong blocks (a wrong operator, a wrong function, an extra paren) — never a block that could substitute into a valid alternative answer.
3. `acceptedAnswers`: every genuinely valid R alternative a beginner might type (`=` assignment, `->` reversed assignment, single quotes are already normalized away). If an alternative is valid R, it must NOT appear as a distractor in `choices`.
4. Only author `gap`/`tokens` for answers with ≥3 meaningful tokens. Bare function names (`select()`, `ggplot()`) and prose answers stay choice-only.
5. Prompt audit: the answer must be in the exact form the prompt requests (operator ↔ operator, expression ↔ expression, variable ↔ variable).

**Mandatory audit fixes in this task:**
- Unit 5 (`Filtrar casos`), base challenge 4: prompt `'Qué operador sirve para buscar varias comunas posibles?'` has a full *expression* as answer. Change prompt to `'Qué expresión mantiene solo las comunas Santiago, Maipú y Puente Alto?'` (answer unchanged).
- Unit 1, base challenge 1 (`tamano_muestra <- 42`): add `acceptedAnswers: ['tamano_muestra = 42', '42 -> tamano_muestra']`. The existing distractor `'42 -> tamano_muestra()'` stays (the `()` makes it invalid).
- Scan every distractor in units 1–5 against rule 3; replace any that is valid R answering the prompt.

**Questions to author (units 1–5).** "G" = author gap, "T" = author tokens, "A" = acceptedAnswers where listed:

| Unit | Question (by answer) | Author |
|---|---|---|
| 1 base | `tamano_muestra <- 42` | G T A (above) |
| 1 base | `casos / poblacion * 100000` | G T |
| 1 extra | `poblacion <- 125000` | G T A: `['poblacion = 125000', '125000 -> poblacion']` |
| 1 extra | `casos / poblacion * 100000` (incidencia) | G T |
| 2 base | `edades <- c(34, 45, 52)` | G T A: `['edades = c(34, 45, 52)']` |
| 2 base | `class(edad)` | G T |
| 2 extra | `comunas <- c("Santiago", "Maipu")` | G T A: `['comunas = c("Santiago", "Maipu")']` |
| 2 extra | `class(resultado_pcr)` | G |
| 2 extra | `casos <- c(12, 18, 25)` | G T A: `['casos = c(12, 18, 25)']` |
| 3 base | `vigilancia <- read.csv("vigilancia_respiratoria.csv")` | G T A: `['vigilancia = read.csv("vigilancia_respiratoria.csv")']` |
| 3 base | `head(vigilancia)` | G |
| 3 base | `names(casos)` | G |
| 3 base | `summary(encuesta)` | G |
| 3 extra | `str(vigilancia)` | G |
| 3 extra | `names(vigilancia)` | G |
| 4 base | `sum(is.na(edad))` | G T |
| 4 extra | `select(comuna, edad)` | G T |
| 4 extra | `mutate(mayor_60 = edad >= 60)` | G T |
| 4 extra | `select(comuna, edad, resultado_pcr)` | T |
| 5 base | `filter(edad >= 18)` | G T |
| 5 base | `resultado == "confirmado"` | G T |
| 5 base | `comuna %in% c("Santiago", "Maipú", "Puente Alto")` | T |
| 5 extra | `filter(resultado == "confirmado")` | G T |
| 5 extra | `edad >= 60` | G |
| 5 extra | `filter(resultado == "confirmado" & edad >= 18)` | T |
| 5 extra | `semana_epi >= 20` | G |
| 5 extra | `filter(comuna == "Santiago")` | G T |

**Worked examples (copy the pattern exactly):**

```ts
{
  prompt: 'Guarda el valor 42 en un objeto llamado tamano_muestra.',
  context: 'En investigación conviene guardar números clave para reutilizarlos sin copiarlos a mano.',
  choices: ['tamano_muestra <- 42', '42 -> tamano_muestra()', 'tamano_muestra == 42'],
  answer: 'tamano_muestra <- 42',
  acceptedAnswers: ['tamano_muestra = 42', '42 -> tamano_muestra'],
  gap: { template: 'tamano_muestra ____ 42', blank: '<-' },
  tokens: { parts: ['tamano_muestra', '<-', '42'], distractors: ['==', 'c('] },
  explain: 'El operador `<-` asigna un valor a un objeto.',
  concept: 'asignación y objetos',
},
{
  prompt: 'Crea un vector con tres edades: 34, 45 y 52.',
  context: 'Los vectores son la base de muchas columnas en R.',
  choices: ['edades <- c(34, 45, 52)', 'edades <- list[34, 45, 52]', 'edades <- 34 + 45 + 52'],
  answer: 'edades <- c(34, 45, 52)',
  acceptedAnswers: ['edades = c(34, 45, 52)'],
  gap: { template: 'edades <- ____(34, 45, 52)', blank: 'c' },
  tokens: { parts: ['edades', '<-', 'c(', '34,', '45,', '52', ')'], distractors: ['list(', 'sum('] },
  explain: '`c()` combina valores en un vector.',
  concept: 'vectores con c()',
},
{
  prompt: 'Con dplyr cargado, qué expresión mantiene solo edad de 18 o más?',
  context: 'Filtrar por edad es común al definir poblaciones de estudio.',
  choices: ['filter(edad >= 18)', 'select(edad >= 18)', 'mutate(edad >= 18)'],
  answer: 'filter(edad >= 18)',
  gap: { template: '____(edad >= 18)', blank: 'filter' },
  tokens: { parts: ['filter(', 'edad', '>=', '18', ')'], distractors: ['select(', '<='] },
  explain: '`filter()` conserva filas que cumplen una condición.',
  concept: 'filtrar filas',
},
```

Note the gap-template style: `'edades <- ____(34, 45, 52)'` — the blank replaces only the concept token; `template.replace('____', blank)` must normalize-equal the `answer` (the integrity test enforces this — run it constantly while authoring).

- [ ] **Step 1: Author units 1–3** per the table, running `npx vitest run src/data/lessons.test.ts` after each unit.
- [ ] **Step 2: Author units 4–5** per the table, same check.
- [ ] **Step 3: Apply the mandatory audit fixes and the distractor scan for units 1–5.**
- [ ] **Step 4: Full check**

```bash
npm test && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/data/lessons.ts
git commit -m "content: author gap/tokens/acceptedAnswers and audit prompts for units 1-5"
```

---

### Task 6: Content authoring — units 6–9 (audit + gap/tokens/acceptedAnswers)

**Files:**
- Modify: `src/data/lessons.ts` (data only)

**Interfaces:** identical rules to Task 5.

**Mandatory audit fixes in this task:**
- Unit 7 (`Visualizar datos`), base challenge 4: prompt `'Qué estética suele ir en el eje x de una curva epidémica?'` — the choices are variable names, not aesthetics. Change prompt to `'Qué variable suele ir en el eje x de una curva epidémica?'`.
- Scan every distractor in units 6–9 against rule 3 of Task 5.

**Questions to author (units 6–9):**

| Unit | Question (by answer) | Author |
|---|---|---|
| 6 base | `group_by(comuna)` | G |
| 6 base | `count(comuna)` | G |
| 6 base | `positivos / total * 100` | G T |
| 6 base | `mean(edad, na.rm = TRUE)` | G T |
| 6 extra | `count(semana_epi)` | G |
| 7 base | `ggplot()`, `geom_point()`, `geom_col()` | choice-only (rule 4) |
| 8 base | `ymd("2026-07-02")` | G |
| 8 base | `fecha_consulta - fecha_inicio` | G T |
| 8 extra | (bare function answers) | choice-only |
| 9 base | `write.csv(resumen, "resumen.csv")` | G T |
| 9 base | `ggsave("curva.png")` | G |
| 9 extra | `row.names = FALSE` | G |

**Worked example for this task's hardest case:**

```ts
{
  prompt: 'Qué función calcula el promedio de edad ignorando NA?',
  context: 'Los faltantes no deberían romper un resumen si se decide excluirlos.',
  choices: ['mean(edad, na.rm = TRUE)', 'average(edad, remove_na)', 'mean(edad, missing = no)'],
  answer: 'mean(edad, na.rm = TRUE)',
  gap: { template: 'mean(edad, na.rm = ____)', blank: 'TRUE' },
  tokens: { parts: ['mean(', 'edad,', 'na.rm', '=', 'TRUE', ')'], distractors: ['FALSE', 'median('] },
  explain: '`na.rm = TRUE` le pide a `mean()` ignorar valores faltantes.',
  concept: 'promedios con NA',
},
```

- [ ] **Step 1: Author units 6–9** per the table; run `npx vitest run src/data/lessons.test.ts` per unit.
- [ ] **Step 2: Apply audit fixes + distractor scan for units 6–9.**
- [ ] **Step 3: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/data/lessons.ts
git commit -m "content: author gap/tokens/acceptedAnswers and audit prompts for units 6-9"
```

---

### Task 7: New content — predict-output, spot-error, matchPairs (all 9 units)

**Files:**
- Modify: `src/data/lessons.ts` (data only)
- Modify: `src/data/lessons.test.ts` (new invariants)

**Interfaces:**
- Produces: every lesson has `matchPairs: MatchPair[]` (≥6 pairs) — flip the field from optional to **required** on `Lesson` in this task. Every unit gains ≥1 predict-output and ≥1 spot-error challenge (appended to `extraChallenges[unitTitle]`), each with `code` set.

**Authoring rules:**
- **Predict-output**: `prompt` is `'¿Qué devuelve R?'` (or a specific variant), `code` is a 1–3 line runnable snippet using only functions taught in that unit or earlier, choices include the true output, one off-by-reasoning value, and one error/`NA` distractor. Choice-only (no gap/tokens).
- **Spot-error**: `prompt` is `'Este código falla. ¿Dónde está el error?'`, `code` shows the buggy line, choices name candidate bugs in Spanish; exactly one is the real bug. Choice-only.
- **matchPairs**: 6+ pairs per unit; `left` = R token/function, `right` = short Spanish purpose. Derive from the unit's `lessonSupport.keyIdeas` and challenge concepts. No duplicate lefts or rights within a unit.

**Worked examples:**

```ts
// Unit 2 predict-output
{
  prompt: '¿Qué devuelve R?',
  context: 'Leer código y anticipar el resultado entrena el ojo analítico.',
  code: 'edades <- c(34, 45, 52)\nlength(edades)',
  choices: ['3', '131', 'Error: objeto no encontrado'],
  answer: '3',
  explain: '`length()` cuenta cuántos elementos tiene el vector, no los suma.',
  concept: 'vectores con c()',
},
// Unit 5 spot-error
{
  prompt: 'Este código falla. ¿Dónde está el error?',
  context: 'Detectar errores comunes ahorra horas frente a RStudio.',
  code: 'filter(casos, comuna == Santiago)',
  choices: ['Santiago necesita comillas', 'filter() no acepta dos argumentos', 'El operador == no existe en R'],
  answer: 'Santiago necesita comillas',
  explain: 'Sin comillas, R busca un objeto llamado Santiago en vez de comparar texto.',
  concept: 'filtrar filas',
},
```

```ts
// Unit 1 matchPairs (complete)
matchPairs: [
  { left: '<-', right: 'asigna un valor a un objeto' },
  { left: '#', right: 'inicia un comentario' },
  { left: 'casos / poblacion * 100000', right: 'incidencia por 100.000' },
  { left: 'casos_confirmados', right: 'nombre de objeto claro' },
  { left: 'x1', right: 'nombre de objeto poco claro' },
  { left: 'script', right: 'receta reproducible del análisis' },
],
// Unit 5 matchPairs (complete)
matchPairs: [
  { left: 'filter()', right: 'conserva filas que cumplen condiciones' },
  { left: '==', right: 'compara igualdad' },
  { left: '&', right: 'exige ambas condiciones' },
  { left: '|', right: 'basta una condición' },
  { left: '%in%', right: 'pertenece a un conjunto' },
  { left: '>=', right: 'mayor o igual' },
],
```

- [ ] **Step 1: Add new integrity tests first** (they will fail until content lands):

```ts
it.each(lessons.map((lesson) => ({ id: lesson.title, lesson })))(
  '$id: has at least 6 match pairs without duplicates',
  ({ lesson }) => {
    expect(lesson.matchPairs.length).toBeGreaterThanOrEqual(6)
    expect(new Set(lesson.matchPairs.map((pair) => pair.left)).size).toBe(lesson.matchPairs.length)
    expect(new Set(lesson.matchPairs.map((pair) => pair.right)).size).toBe(lesson.matchPairs.length)
  },
)

it.each(lessons.map((lesson) => ({ id: lesson.title, lesson })))(
  '$id: has at least 2 code-snippet questions (predict-output / spot-error)',
  ({ lesson }) => {
    const withCode = getLessonChallenges(lesson).filter((challenge) => challenge.code)
    expect(withCode.length).toBeGreaterThanOrEqual(2)
  },
)
```

- [ ] **Step 2: Run to verify the new tests fail** (`npx vitest run src/data/lessons.test.ts` — 18 failures expected: 9 matchPairs + 9 code-count).
- [ ] **Step 3: Author matchPairs for all 9 units**, flip `matchPairs` to required on `Lesson`.
- [ ] **Step 4: Author ≥1 predict-output + ≥1 spot-error per unit** (aim for 2+2 in units 1–5), appended to each unit's `extraChallenges` entry.
- [ ] **Step 5: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/data/lessons.ts src/data/lessons.test.ts
git commit -m "content: predict-output and spot-error questions plus matchPairs for every unit"
```

---

### Task 8: Components (ChoiceList, WriteCard, FeedbackCard) + App uses pickMode/checkAnswer

**Files:**
- Create: `src/lib/shuffle.ts`
- Create: `src/components/ChoiceList.tsx`
- Create: `src/components/WriteCard.tsx`
- Create: `src/components/FeedbackCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css` (code-snippet block)

**Interfaces:**
- Consumes: `checkTypedAnswer`/`CheckResult` (Task 2), `pickMode`/`ChallengeMode` (Task 3), challenge fields (Tasks 3/5–7).
- Produces (used by Tasks 9–11):
  - `function seededShuffle<T>(items: T[], seed: string): T[]` in `src/lib/shuffle.ts`
  - `<ChoiceList choices selected answer checked disabled onSelect />`
  - `<WriteCard mode value gapTemplate checked correct hint revealedAnswer disabled onChange />`
  - `<FeedbackCard correct explain hint revealedAnswer concept onReviewConcept />`
  - App-level helper `getExpectedAnswers(challenge, mode): string[]`

- [ ] **Step 1: Create `src/lib/shuffle.ts`** — move the body of `shuffleChoices` (`src/App.tsx`, currently named `shuffleChoices`) here, generic:

```ts
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let hash = 0
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return [...items]
    .map((item) => {
      hash = (hash * 1664525 + 1013904223) >>> 0
      return { item, order: hash }
    })
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item)
}
```

- [ ] **Step 2: Create `src/components/ChoiceList.tsx`** (ported from the inline block at `src/App.tsx:1660-1680`; exact string comparison replaces `normalizeAnswer` — the integrity test guarantees `answer ∈ choices` verbatim):

```tsx
type ChoiceListProps = {
  choices: string[]
  selected: string
  answer: string
  checked: boolean
  disabled: boolean
  onSelect: (choice: string) => void
}

export function ChoiceList({ choices, selected, answer, checked, disabled, onSelect }: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map((choice) => {
        const chosen = selected === choice
        const revealCorrect = checked && choice === answer
        const revealWrong = checked && chosen && choice !== answer
        return (
          <button
            className={`choice ${chosen ? 'chosen' : ''} ${revealCorrect ? 'correct' : ''} ${revealWrong ? 'wrong' : ''}`}
            disabled={disabled}
            key={choice}
            onClick={() => onSelect(choice)}
            type="button"
          >
            <code>{choice}</code>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/WriteCard.tsx`**:

```tsx
type WriteCardProps = {
  mode: 'write' | 'gap'
  gapTemplate?: string
  value: string
  checked: boolean
  correct: boolean
  hint?: string
  revealedAnswer?: string
  disabled: boolean
  onChange: (value: string) => void
}

export function WriteCard({ mode, gapTemplate, value, checked, correct, hint, revealedAnswer, disabled, onChange }: WriteCardProps) {
  return (
    <div className={`write-card ${checked ? (correct ? 'correct' : 'wrong') : ''}`}>
      <label htmlFor="written-answer">{mode === 'gap' ? 'Rellena el espacio' : 'Escribe la respuesta'}</label>
      {mode === 'gap' && gapTemplate && (
        <div className="gap-line" aria-hidden="true">
          <code>{gapTemplate}</code>
        </div>
      )}
      <input
        autoComplete="off"
        disabled={disabled}
        id="written-answer"
        onChange={(event) => onChange(event.target.value)}
        placeholder={mode === 'gap' ? 'Completa solo el espacio ____' : 'Escribe tu respuesta aquí'}
        type="text"
        value={value}
      />
      {!checked && <small>Tip: R distingue mayúsculas. El espaciado no importa.</small>}
      {checked && !correct && hint && <small>{hint}</small>}
      {checked && !correct && revealedAnswer && (
        <small>
          Respuesta esperada: <code>{revealedAnswer}</code>
        </small>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/FeedbackCard.tsx`** (ported from `src/App.tsx:1719-1734`, plus hint/reveal):

```tsx
import { BookOpen } from 'lucide-react'

type FeedbackCardProps = {
  correct: boolean
  explain: string
  hint?: string
  revealedAnswer?: string
  concept: string
  onReviewConcept: () => void
}

export function FeedbackCard({ correct, explain, hint, revealedAnswer, concept, onReviewConcept }: FeedbackCardProps) {
  return (
    <div className={`feedback ${correct ? 'good' : 'try-again'}`}>
      <strong>{correct ? 'Bien ahí. Tu racha de análisis sigue viva.' : 'Casi, pero no es esta. La verás de nuevo al final.'}</strong>
      {!correct && hint && <span className="feedback-hint">{hint}</span>}
      <span>{explain}</span>
      {!correct && revealedAnswer && (
        <span>
          Respuesta esperada: <code>{revealedAnswer}</code>
        </span>
      )}
      <button className="concept-link" onClick={onReviewConcept} type="button">
        <BookOpen size={16} aria-hidden="true" />
        Repasar {concept} en esta unidad
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Rewire `src/App.tsx`**

Delete: `isCodeAnswer`, `getChallengeMode`, `getGapTemplate`, `normalizeAnswer`, `shuffleChoices`, the local `ChallengeMode` type, and the inline choice/write/gap/feedback JSX. Add imports:

```ts
import { checkTypedAnswer, type CheckResult } from './lib/checkAnswer'
import { pickMode, type ChallengeMode } from './lib/pickMode'
import { seededShuffle } from './lib/shuffle'
import { ChoiceList } from './components/ChoiceList'
import { WriteCard } from './components/WriteCard'
import { FeedbackCard } from './components/FeedbackCard'
```

New derivations and check logic (linear flow stays for now — queue arrives in Task 10):

```ts
const challengeMode = pickMode(challenge, `${challengeKey}-a0`)
const shuffledChoices = useMemo(
  () => seededShuffle(challenge.choices, `${challengeKey}-${challenge.answer}`),
  [challenge.choices, challenge.answer, challengeKey],
)

function getExpectedAnswers(target: Challenge, mode: ChallengeMode): string[] {
  if (mode === 'gap' && target.gap) return [target.gap.blank, ...(target.gap.acceptedBlanks ?? [])]
  return [target.answer, ...(target.acceptedAnswers ?? [])]
}
```

Replace the `isCorrect` derivation with checked-time state — add `const [checkResult, setCheckResult] = useState<CheckResult>({ correct: false })` and inside `checkAnswer()`:

```ts
const result =
  challengeMode === 'choice'
    ? { correct: selected === challenge.answer }
    : checkTypedAnswer(selected, getExpectedAnswers(challenge, challengeMode))
setCheckResult(result)
```

then branch the existing XP/streak/hearts logic on `result.correct` instead of the old `isCorrect`. For this task, `revealedAnswer` passed to WriteCard/FeedbackCard on wrong = `challengeMode === 'gap' ? challenge.gap!.blank : challenge.answer` (the reveal-gating rule lands with the queue in Task 10). Render `challenge.code` when present, above the answer area:

```tsx
{challenge.code && (
  <pre className="challenge-code">
    <code>{challenge.code}</code>
  </pre>
)}
```

Render `<ChoiceList/>` for choice mode, `<WriteCard/>` for write/gap (tokens mode falls back to WriteCard until Task 9 — temporary line: `const effectiveMode = challengeMode === 'tokens' ? 'write' : challengeMode`), `<FeedbackCard/>` for feedback. The `isAlreadyCompleted` display logic stays as-is in this task.

- [ ] **Step 6: Add the code-snippet style to `src/App.css`**

```css
.challenge-code {
  margin-top: 18px;
  padding: 14px 16px;
  border: 2px solid #1d3327;
  border-radius: 8px;
  background: #0f1f16;
  box-shadow: 0 6px 0 #cfe0d5;
  overflow-x: auto;
}

.challenge-code code {
  color: #d7f5e2;
  white-space: pre;
}

.feedback-hint {
  font-weight: 800;
}
```

- [ ] **Step 7: Verify in the browser**

```bash
npm test && npm run lint && npm run build
npm run dev
```

Manually: answer a choice question, a write question (`edades<-c(34,45,52)` compact spacing must pass), a gap question (typing ONLY the blank must pass — this is the bug fix), a case-wrong answer (`true` → mayúsculas hint). Kill the dev server after.

- [ ] **Step 8: Commit**

```bash
git add src/lib/shuffle.ts src/components/ChoiceList.tsx src/components/WriteCard.tsx src/components/FeedbackCard.tsx src/App.tsx src/App.css
git commit -m "feat: mode components wired to smart checker; gap validates the blank (bug fix)"
```

---

### Task 9: TokenBank component

**Files:**
- Create: `src/components/TokenBank.tsx`
- Modify: `src/App.tsx` (render tokens mode)
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `seededShuffle` (Task 8), `tokens` field (Task 3).
- Produces: `<TokenBank parts distractors seed checked correct disabled onChange />` — `onChange` receives the space-joined built line; App validates it with `checkTypedAnswer(built, [challenge.answer])`.

- [ ] **Step 1: Create `src/components/TokenBank.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { seededShuffle } from '../lib/shuffle'

type TokenBankProps = {
  parts: string[]
  distractors: string[]
  seed: string
  checked: boolean
  correct: boolean
  disabled: boolean
  onChange: (built: string) => void
}

type Chip = { id: number; label: string }

export function TokenBank({ parts, distractors, seed, checked, correct, disabled, onChange }: TokenBankProps) {
  const pool = useMemo<Chip[]>(
    () => seededShuffle([...parts, ...distractors], seed).map((label, id) => ({ id, label })),
    [parts, distractors, seed],
  )
  const [placedIds, setPlacedIds] = useState<number[]>([])

  function emit(nextPlaced: number[]) {
    setPlacedIds(nextPlaced)
    onChange(nextPlaced.map((id) => pool.find((chip) => chip.id === id)!.label).join(' '))
  }

  const placedChips = placedIds.map((id) => pool.find((chip) => chip.id === id)!)

  return (
    <div className={`token-bank ${checked ? (correct ? 'correct' : 'wrong') : ''}`}>
      <span className="token-label">Arma el comando tocando los bloques</span>
      <div className="token-line" aria-live="polite">
        {placedChips.length === 0 && <span className="token-placeholder">Toca bloques para armar tu respuesta</span>}
        {placedChips.map((chip) => (
          <button
            className="token-chip placed"
            disabled={disabled}
            key={chip.id}
            onClick={() => emit(placedIds.filter((id) => id !== chip.id))}
            type="button"
          >
            <code>{chip.label}</code>
          </button>
        ))}
      </div>
      <div className="token-pool">
        {pool.map((chip) => {
          const used = placedIds.includes(chip.id)
          return (
            <button
              className={`token-chip ${used ? 'used' : ''}`}
              disabled={disabled || used}
              key={chip.id}
              onClick={() => emit([...placedIds, chip.id])}
              type="button"
            >
              <code>{chip.label}</code>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `src/App.tsx`** — remove the Task-8 temporary `effectiveMode` fallback; render for `challengeMode === 'tokens'`:

```tsx
<TokenBank
  parts={challenge.tokens!.parts}
  distractors={challenge.tokens!.distractors}
  seed={challengeKey}
  checked={checked}
  correct={checkResult.correct}
  disabled={checked || isAlreadyCompleted}
  onChange={setSelected}
/>
```

Validation for tokens mode inside `checkAnswer()`: `checkTypedAnswer(selected, [challenge.answer])` (the join’s spacing is normalized away). The `key` prop trick — add `key={challengeKey}` on TokenBank — resets internal placed state between challenges.

- [ ] **Step 3: Add styles to `src/App.css`**

```css
.token-bank {
  display: grid;
  gap: 12px;
  margin-top: 28px;
  padding: 16px;
  border: 2px solid #dce7df;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 0 #e0e9e4;
}

.token-bank.correct {
  border-color: #2ca65f;
  background: linear-gradient(135deg, #e8f8ed, #f8ffe9);
  box-shadow: 0 8px 0 #9be15d;
}

.token-bank.wrong {
  border-color: #d95b4f;
  background: #fff0ee;
  box-shadow: 0 6px 0 #ffc9c2;
}

.token-label {
  color: #244134;
  font-weight: 950;
}

.token-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 64px;
  padding: 12px;
  border: 2px dashed #cfe3d7;
  border-radius: 8px;
  background: #f7fff9;
}

.token-placeholder {
  color: #6b7f71;
  font-weight: 800;
  font-size: 0.9rem;
}

.token-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.token-chip {
  padding: 10px 14px;
  border: 2px solid #dce7df;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 5px 0 #e0e9e4;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.token-chip:hover:not(:disabled) {
  border-color: #278f52;
  transform: translateY(-2px);
  box-shadow: 0 7px 0 #c3ead1;
}

.token-chip:active:not(:disabled) {
  box-shadow: 0 1px 0 #c3ead1;
  transform: translateY(3px);
}

.token-chip.used {
  opacity: 0.35;
}

.token-chip.placed {
  border-color: #278f52;
  background: #f0fbf4;
}
```

- [ ] **Step 4: Verify in browser** (`npm run dev`) — find a tokens-mode question (temporarily force `challengeMode = 'tokens'` on a question with tokens if the seed doesn't produce one, then revert): build the line, remove a block by tapping it, answer wrong with a distractor, answer right.

- [ ] **Step 5: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/components/TokenBank.tsx src/App.tsx src/App.css
git commit -m "feat: token bank mode - build R commands from shuffled blocks"
```

---

### Task 10: Retry loop — session queue wired into App

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `buildQueue`, `advanceQueue`, `requeueFailed`, `shouldReveal`, `QueueItem` (Task 4); `pickMode` with `excludeMode` (Task 3).
- Produces: App practice flow driven by the queue; `phase` state `'practice' | 'match' | 'done'` consumed by Task 11 (`'match'` renders a placeholder "Repaso" panel until Task 11 lands MatchBoard).

- [ ] **Step 1: Replace linear navigation with the queue**

In `App()`:
- Replace `challengeIndex` state with `queue: QueueItem[]` state, initialized `buildQueue(initialProgress.lessonIndex, getLessonChallenges(lessons[initialProgress.lessonIndex]).length, initialProgress.completedCorrect)`.
- Delete `getFirstIncompleteChallengeIndex` and `getNextIncompleteChallengeIndex` (both call sites replaced by `buildQueue`).
- Add `const [phase, setPhase] = useState<'practice' | 'match' | 'done'>('practice')`.
- Derivations:

```ts
const currentItem = queue[0]
const challengeIndex = currentItem?.challengeIndex ?? 0
const challenge = lessonChallenges[challengeIndex]
const challengeKey = getChallengeKey(lessonIndex, challengeIndex)
const challengeMode = currentItem
  ? pickMode(challenge, `${challengeKey}-a${currentItem.attempts}`, currentItem.failedModes.at(-1))
  : 'choice'
const revealOnWrong = currentItem ? shouldReveal(currentItem) : false
```

- `checkAnswer()` on wrong: pass `revealedAnswer` to WriteCard/FeedbackCard **only when `revealOnWrong`** (first miss shows hint + explain only — spec §3).
- `nextChallenge()` becomes `continueSession()`:

```ts
function continueSession() {
  const nextQueue = checkResult.correct ? advanceQueue(queue) : requeueFailed(queue, challengeMode)
  setQueue(nextQueue)
  if (nextQueue.length === 0) setPhase('match')
  setSelected('')
  setChecked(false)
  setCheckResult({ correct: false })
}
```

- Lesson-node click handler and lesson-advance logic: `setQueue(buildQueue(index, getLessonChallenges(lessons[index]).length, completedCorrect)); setPhase('practice')`. When a clicked lesson's queue comes back empty (already completed), set phase `'done'` immediately (no match replay, no XP — spec §3 edge).
- `restart()` additionally resets `setQueue(buildQueue(0, getLessonChallenges(lessons[0]).length, []))` and `setPhase('practice')`.
- Persistence: keep writing `challengeIndex` into localStorage as `queue[0]?.challengeIndex ?? 0` so the stored shape is unchanged.
- The `isAlreadyCompleted` branch disappears from the practice panel (completed challenges never enter the queue). Delete its JSX.
- `phase === 'match'`: render a temporary panel `<div className="feedback good"><strong>Repaso de la unidad</strong><span>Disponible en la próxima tarea.</span></div>` with a Continuar button that calls the existing next-lesson logic (advance `lessonIndex`, rebuild queue, `setShowTheory(true)`, `setPhase('practice')`; on the last lesson set `phase('done')`).
- `phase === 'done'`: panel with "Unidad completa" + Reiniciar button (reuse `restart`).
- The wrong-answer path no longer blocks progression on the same question: after wrong + FeedbackCard, the Continuar button calls `continueSession()` (the question moved to the back).

- [ ] **Step 2: Verify the retry loop in the browser**

`npm run dev`. In one lesson: answer question 1 wrong → feedback shows hint but NOT the expected answer → Continuar → question 2 appears. Complete the rest; the failed question returns at the end **in a different mode**; fail it again → expected answer IS revealed; answer right → phase 'match' placeholder appears. Reload mid-lesson → queue resumes with only incomplete questions.

- [ ] **Step 3: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/App.tsx
git commit -m "feat: retry loop - wrong answers re-queue in a different mode, reveal on second miss"
```

---

### Task 11: MatchBoard — unit-closing repaso

**Files:**
- Create: `src/components/MatchBoard.tsx`
- Modify: `src/App.tsx` (replace the Task-10 placeholder)
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `MatchPair` + `lesson.matchPairs` (Tasks 3/7), `seededShuffle` (Task 8), `phase === 'match'` (Task 10).
- Produces: `<MatchBoard pairs seed onComplete />` — `pairs` already sampled to 4; `onComplete` fires once when all 4 are matched.

- [ ] **Step 1: Create `src/components/MatchBoard.tsx`**

```tsx
import { useMemo, useState } from 'react'
import type { MatchPair } from '../data/lessons'
import { seededShuffle } from '../lib/shuffle'

type MatchBoardProps = {
  pairs: MatchPair[]
  seed: string
  onComplete: () => void
}

export function MatchBoard({ pairs, seed, onComplete }: MatchBoardProps) {
  const rights = useMemo(() => seededShuffle(pairs.map((pair) => pair.right), `${seed}-rights`), [pairs, seed])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matchedLefts, setMatchedLefts] = useState<string[]>([])
  const [shaking, setShaking] = useState<string | null>(null)

  const matchedRights = matchedLefts.map((left) => pairs.find((pair) => pair.left === left)!.right)

  function tryMatch(right: string) {
    if (!selectedLeft) return
    const pair = pairs.find((candidate) => candidate.left === selectedLeft)!
    if (pair.right === right) {
      const nextMatched = [...matchedLefts, selectedLeft]
      setMatchedLefts(nextMatched)
      setSelectedLeft(null)
      if (nextMatched.length === pairs.length) onComplete()
    } else {
      setShaking(right)
      window.setTimeout(() => setShaking(null), 450)
    }
  }

  return (
    <div className="match-board">
      <span className="token-label">Une cada comando con lo que hace</span>
      <div className="match-grid">
        <div className="match-column">
          {pairs.map((pair) => (
            <button
              className={`match-option ${selectedLeft === pair.left ? 'selected' : ''} ${matchedLefts.includes(pair.left) ? 'matched' : ''}`}
              disabled={matchedLefts.includes(pair.left)}
              key={pair.left}
              onClick={() => setSelectedLeft(pair.left)}
              type="button"
            >
              <code>{pair.left}</code>
            </button>
          ))}
        </div>
        <div className="match-column">
          {rights.map((right) => (
            <button
              className={`match-option ${matchedRights.includes(right) ? 'matched' : ''} ${shaking === right ? 'shake' : ''}`}
              disabled={matchedRights.includes(right) || !selectedLeft}
              key={right}
              onClick={() => tryMatch(right)}
              type="button"
            >
              {right}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace the Task-10 placeholder in `src/App.tsx`**

```tsx
{phase === 'match' && (
  <>
    <h2>Repaso: {lesson.title}</h2>
    <p className="context">Última prueba antes de cerrar la unidad.</p>
    <MatchBoard
      key={lessonIndex}
      pairs={seededShuffle(lesson.matchPairs, `match-${lessonIndex}`).slice(0, 4)}
      seed={`match-${lessonIndex}`}
      onComplete={finishMatch}
    />
  </>
)}
```

with:

```ts
function finishMatch() {
  setXp((currentXp) => currentXp + 20)
  playFeedbackSound('unit')
  setCelebration('unit')
  advanceLesson() // the Task-10 next-lesson logic, extracted to a named function
}
```

No heart loss anywhere in match mode (mismatches only shake — spec §3).

- [ ] **Step 3: Add styles to `src/App.css`**

```css
.match-board {
  display: grid;
  gap: 14px;
  margin-top: 28px;
}

.match-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.match-column {
  display: grid;
  gap: 10px;
  align-content: start;
}

.match-option {
  min-height: 58px;
  padding: 12px 14px;
  border: 2px solid #dce7df;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 5px 0 #e0e9e4;
  font-weight: 800;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.match-option:hover:not(:disabled) {
  border-color: #278f52;
  transform: translateY(-2px);
  box-shadow: 0 7px 0 #c3ead1;
}

.match-option.selected {
  border-color: #278f52;
  background: #f0fbf4;
  box-shadow: 0 7px 0 #c3ead1;
}

.match-option.matched {
  border-color: #2ca65f;
  background: linear-gradient(135deg, #e8f8ed, #f8ffe9);
  opacity: 0.65;
  pointer-events: none;
}

.match-option.shake {
  border-color: #d95b4f;
  background: #fff0ee;
  animation: match-shake 400ms ease;
}

@keyframes match-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@media (max-width: 720px) {
  .match-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Verify in browser** — complete a unit; the match board appears; a wrong pair shakes without heart loss; completing all 4 pairs fires +20 XP, unit celebration, and advances to the next unit's theory. Last unit → 'done' panel.

- [ ] **Step 5: Full check + commit**

```bash
npm test && npm run lint && npm run build
git add src/components/MatchBoard.tsx src/App.tsx src/App.css
git commit -m "feat: matching-pairs repaso closes each unit"
```

---

### Task 12: Final verification & cleanup

**Files:**
- Modify: `README.md` (if it documents question behavior)
- Possibly modify: any file with dead code found below

**Steps:**

- [ ] **Step 1: Dead-code sweep** — confirm `isCodeAnswer`, `getChallengeMode`, `getGapTemplate`, `normalizeAnswer`, `shuffleChoices`, `getFirstIncompleteChallengeIndex`, `getNextIncompleteChallengeIndex` no longer exist anywhere:

```bash
grep -rn "isCodeAnswer\|getChallengeMode\|getGapTemplate\|normalizeAnswer\|shuffleChoices\|getFirstIncompleteChallengeIndex\|getNextIncompleteChallengeIndex" src/
```

Expected: no matches. Delete any stragglers.

- [ ] **Step 2: Full suite**

```bash
npm test && npm run lint && npm run build
```

Expected: all green.

- [ ] **Step 3: End-to-end manual run** (`npm run dev`): play unit 1 fully — mixed modes appear (choice/write/gap/tokens), a code-snippet question renders the dark code block, a wrong answer re-queues and returns in a different mode, second miss reveals the answer, matching repaso closes the unit with celebration, progress + XP survive a reload, and a completed lesson revisited shows the 'done' panel without re-granting XP.

- [ ] **Step 4: Update README** if it describes gameplay; one short paragraph on the six interaction modes and the retry loop.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: dead-code sweep, README update, final verification"
```
