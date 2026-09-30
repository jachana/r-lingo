# R-Lingo improvement goals and milestones

**Reviewed:** 30 September 2026
**Status:** Implemented in draft PR #1; phone and friends' learning checks remain open
**Audience:** Project owner, friends learning R, and future contributors

R-Lingo has a working foundation: nine Spanish-language units, varied exercises, offline progress, and passing automated checks. The next goal is to make progress trustworthy and turn course completion into repeatable R skills. Prioritize persistence, feedback, and repeat practice before adding more units.

This is a personal learning app for the owner's friends. They can bring their own devices. Keep the learning checks informal and use them to improve the lessons; commercialization is outside the intended use.

## Implementation progress — 30 September 2026

Progress now uses stable IDs and a versioned session model; it restores retries, feedback, token placements, matching checkpoints, and interrupted units. Completed units can be practiced again without duplicate XP. Answer policies, delayed reveals, unit-specific theory, backup/import confirmation, daily goals, calendar streaks, and scheduled concept review are implemented. The practical assignment and parallel learning-check materials are ready.

Local and GitHub CI verification: **733 tests**, lint, production build, and R execution pass. A production browser walkthrough completed a full unit with the server stopped and preserved progress across a desktop app update. **72 responsive checks** passed across four widths. A Tab/Enter walkthrough completed every exercise mode and the final matching board. See [draft PR #1](https://github.com/jachana/r-lingo/pull/1), [implementation evidence and limitations](verification/implementation-checks.md), [content audit](verification/content-audit.md), and [friends' check instructions](PILOT_PROTOCOL.md).

The open gates are physical Android/iOS installation/offline/update checks, actual screen-reader use, and the friends' assignment and seven-day scores. Progress backups have observed file-download and recovery evidence; the branch and PR CI runs succeeded. No learner results have been collected. The overall goal remains open until the remaining checks are recorded.

## Product goal

Help a beginner learn, retain, and independently apply introductory R to a small public-health dataset through short, accessible sessions that work offline.

The improved app should let a learner stop and resume safely, revisit any completed unit without erasing progress, understand mistakes, and demonstrate the skills in RStudio. Keep the current local-first model; accounts and a backend are outside this roadmap.

### Proposed success measures

These are targets, not measured user outcomes. Establish a learner baseline before claiming improvement.

| Outcome | Completion target | How to verify |
|---|---|---|
| Trustworthy progress | Reload preserves the active exercise, retry history, phase, and earned XP; migrations preserve existing completions | Automated session and storage scenarios, including invalid saves and denied storage |
| Repeatable practice | All nine completed units can be practiced again without resetting course completion or granting duplicate first-completion XP | Browser journeys for replay, course navigation, and refresh |
| Accessible learning | Each exercise mode is usable with a keyboard; gap context, selection, feedback, and progress are available to a screen reader | Keyboard and screen-reader walkthroughs; automated checks as supporting evidence |
| Independent application | At least 4 of 5 beginner pilot participants complete a new dataset assignment with at least 80% of its rubric points without answer reveals | Observe a scored RStudio assignment after the course |
| Retention | At least 4 of 5 pilot participants score at least 80% on a parallel review seven days later | Follow-up assessment with different examples |

Five friends provide an initial usability signal. Use their results to adjust this app for their needs.

## Initial app assessment — before implementation

The findings below describe the starting version. Resolved findings are retained to explain the roadmap; use the implementation record above for current status. In particular, `sessionQueue.ts` has been replaced by the cohesive `learningSession.ts` module.

### What is already working

- **Clear subject and audience:** the course teaches R in Spanish using public-health examples, from objects and vectors through filtering, indicators, plots, dates, and export.
- **Useful practice variety:** 108 challenges, 12 per unit; 35 have authored gaps, 23 have token-bank metadata, and 18 include code snippets. These counts overlap. The curriculum contains 54 matching pairs; the app samples four at each unit's closing review.
- **A real retry loop:** wrong answers move to the end of the queue and change mode when alternatives exist. Choice, typed, gap, and token exercises use separate components.
- **A simple distribution model:** React, TypeScript, Vite, a generated PWA service worker, and a static Nginx container. No database or authentication is needed.
- **A useful test baseline:** 707 tests across four files passed. Many are parameterized content-integrity checks; this does not mean the browser flows have equivalent coverage.

### Improvements supported by the code

| Priority | Finding and evidence | Consequence | Milestone |
|---|---|---|---|
| High | `readStoredProgress()` reads a resume index, but initial queue creation ignores it. Queue order, attempts, and failed modes are not saved (`src/App.tsx`, `src/lib/sessionQueue.ts`). | Reload returns to a rebuilt queue and loses retry context. This follows the July design, but is a limitation for reliable sessions. | M1 |
| High | Progress keys are positional, such as `0-1` (`getChallengeKey()` in `src/data/lessons.ts`). Completion arrays are not fully validated or deduplicated; storage writes have no error handling (`src/App.tsx`). | Reordering content can attach old progress to another question; malformed saves can distort metrics; denied writes have no recovery path. | M1 |
| High | Completed questions are omitted from queues, and completed units resolve to `done`. Reset clears the entire course immediately (`src/App.tsx`). | Learners cannot repeat exercises while keeping their achievements; a reset click erases accumulated progress. | M3 |
| High | `ChoiceList` highlights the correct option after the first wrong answer, although the intended retry design delays answer revelation. Feedback also always shows the explanation (`src/components/ChoiceList.tsx`, `FeedbackCard.tsx`). | Reveal behavior differs by mode; some explanations supply the answer before the intended second attempt. | M2 |
| Medium | The checker accepts any nonempty string-vector assignment whenever an expected answer is a string-vector assignment (`src/lib/checkAnswer.ts`). Existing tests intentionally allow different object names and values for the generic vector prompt. | Appropriate flexibility is global rather than authored per question; a future prompt requiring exact values could be accepted incorrectly. | M2 |
| Medium | `finishMatch()` advances the lesson while the celebration renders the current `lesson.title` (`src/App.tsx`). | Completing one unit can display the next unit's title as completed. | M1 |
| Medium | Gap templates are `aria-hidden`; choice and matching selection rely on CSS; progress tracks lack numeric progress semantics (`WriteCard.tsx`, `ChoiceList.tsx`, `MatchBoard.tsx`, `App.tsx`). | Essential question context and state are missing from the accessibility interface. | M4 |
| Medium | Theory uses six pages per unit with repeated generic prose. “Meta de hoy” is static text; the streak counts consecutive correct answers, and hearts are cosmetic at zero (`src/App.tsx`). | Instruction and rewards do not yet provide a tailored explanation, measurable daily goal, or retention loop. Cosmetic hearts are intentional in the earlier scope. | M2, M5 |
| Medium | Manifest icon purpose is literally `any máskable`, and only an SVG icon is declared (`vite.config.ts`). Offline cache generation passes, but install and update journeys are unverified. | Correct the apparent manifest typo and verify installation support on target devices before treating PWA delivery as complete. | M4 |
| Medium | Existing tests cover content, normalization, queue helpers, and mode selection. There are no app-level or browser test files or checked-in CI workflow. | Integration errors in navigation, rewards, matching, and persistence can escape the current green suite. | M1–M4 |

### Review scope and limits

Reviewed source, configuration, existing tests, the README, and the approved July question-mode design. Opened the running app and inspected its desktop theory screen and accessibility tree. The screen clearly presents the course path and references, but allocates substantial space above the learning task; simplifying that hierarchy is a design proposal, not a measured usability finding.

At the initial assessment, no full course walkthrough, mobile-device test, offline/install/update test, R execution audit, production deployment check, or learner study had been performed. Later implementation evidence is recorded separately above. Build success alone does not verify those journeys.

## Milestone roadmap

Sequence work by completion gates. Effort ranges assume one contributor and describe working days, not committed delivery dates. Learning studies require additional elapsed time.

| Milestone | Result | Priority | Depends on | Estimated effort | Status |
|---|---|---|---|---|---|
| M1 | Reliable session and progress foundation | High | — | 4–6 days | Implemented; local and remote CI checks pass |
| M2 | Consistent validation and teaching feedback | High | M1 stable IDs | 4–6 days | Implemented and locally verified |
| M3 | Repeat practice without losing progress | High | M1, M2 | 3–5 days | Implemented and locally verified |
| M4 | Accessible mobile and offline release | High | M1–M3 | 4–6 days | Desktop checks pass; devices/screen reader pending |
| M5 | Daily goals and scheduled review | Medium | M1, M3, M4 | 4–6 days | Implemented and locally verified |
| M6 | Practical R assignment and learner validation | High | M2–M5 for final pilot | 3–5 days + 7-day follow-up | Materials executed in R; friends' results pending |

The original estimate was **22–34 working days**, plus the seven-day follow-up; it is a planning range, not time spent or a remaining estimate. Release each milestone when its gate passes.

### M1 — Make sessions and progress trustworthy

**Deliver:** a versioned progress model with stable lesson/challenge IDs, a migration from `r-lingo-progress-v2`, and a cohesive session module that owns answer/continue/match transitions. Persist queue order, attempts, failed modes, and session phase. Handle invalid storage and failed writes gracefully. Capture the completed unit identity before navigation so celebrations name it correctly.

**Done when:**

- [x] Valid v2 saves retain completions, unlocked units, and XP after migration; migration is safe to repeat.
- [x] Refresh after an incorrect answer restores the same exercise and retry/reveal state; refresh during matching restores its defined checkpoint.
- [x] Saves with malformed JSON, duplicate/unknown IDs, invalid types, or invalid numeric values produce valid bounded state without a crash.
- [x] If storage is unavailable, learning continues and the app explains that progress cannot be saved.
- [x] Completing a unit names that unit, unlocks the next one, and awards its completion XP exactly once.
- [x] App-level regression tests cover these transitions; CI runs tests, lint, and build on proposed changes. [The PR workflow passed](https://github.com/jachana/r-lingo/actions/runs/36742425365), including R execution.

**Evidence:** migration fixtures, transition tests, and a browser resume/completion walkthrough. Do not rewrite the app solely to split files; extract the session logic to make these behaviors testable together.

### M2 — Make validation and feedback teach the right lesson

**Deliver:** authored answer policies distinguishing exact code/values from open-ended syntax exercises. Keep the current generic vector exercise flexible, while ensuring a constrained exercise checks its requested object and values. Audit normalization against the syntax actually taught, including quoted text. Align first-error hints, later reveals, and explanations across all modes. Replace generic theory passages with concise unit-specific teaching and examples.

**Done when:**

- [x] Every challenge has an explicit or well-defined default validation policy; constrained vector examples reject wrong values and object names, while open-ended examples accept valid alternatives.
- [x] All 108 prompts, expected answers, alternatives, and distractors have been reviewed for agreement with the question's intent.
- [x] First wrong attempts give useful hints without exposing the literal answer through styling or explanation; later failed attempts reveal it consistently.
- [x] Representative taught R scripts and snippets have been executed in R/RStudio, with package setup and expected outputs recorded. Execution used real R through webR; a native RStudio setup walkthrough remains part of the friends' check.
- [x] Each unit explains its own concept, common mistake, and public-health application; concept-review links land on relevant material.

**Evidence:** a content audit checklist, checker/reveal regressions, and a small reproducible R verification script. Existing integrity tests remain green.

### M3 — Allow learners to practice again

**Deliver:** “Practice again” on completed units, a clear course-completion screen, and progress export/import. Separate review sessions from first-time completion. Protect course reset with a confirmation and offer export before reset.

**Done when:**

- [x] Each of the nine completed units starts a fresh review session without changing historical completions or locking units.
- [x] Review errors requeue normally; refresh preserves review state.
- [x] Replay never grants duplicate first-completion or unit-completion XP; any separate review reward has a documented limit. Reviews grant no XP.
- [x] Export/import round-trips progress; malformed or incompatible imports leave the current save intact and explain the problem. Actual downloads were verified from Chrome and the in-app browser; recovery restored 20 XP and checked feedback after advancing to 40 XP and reloading. Chrome's automated file picker requires an additional extension permission, so imports used the in-app browser.
- [x] Cancelling reset preserves progress, and finishing the final unit offers useful next actions, including review and the practical assignment.

**Evidence:** browser journeys covering complete → replay → refresh → export/import → cancel reset.

### M4 — Make the app usable on phones and dependable offline

**Deliver:** a practice-focused layout, clear continuation controls, accessible exercise state, persistent sound preference, and verified PWA installation/update behavior. Correct the manifest purpose typo and provide platform-appropriate icons. Preserve existing reduced-motion support.

**Done when:**

- [x] At 320, 390, 768, and 1280 CSS-pixel widths, every mode and feedback state remains usable without page-level horizontal overflow; long code scrolls inside its panel. Verified representative mode/feedback screens and theory code, not every individual question.
- [ ] Keyboard users can complete all modes; selected/matched states are announced, the gap template is available to assistive technology, and progress has numeric semantics.
- [x] Wrong/correct feedback is understandable without color or sound; sound can be disabled and the preference persists.
- [ ] After one online load, a production build launches and completes a unit offline on the agreed target browsers/devices.
- [ ] Installation and a version update are tested on at least one Android and one iOS device; an update preserves progress and the active session.
- [x] External reference links clearly indicate that their destinations need internet access.

**Evidence:** responsive screenshots, keyboard/screen-reader notes, browser checks, and an install/offline/update test record. Resolve target-device access before scheduling this gate.

### M5 — Add a useful daily learning and review loop

**Deliver:** a configurable daily goal and a small review queue based on concept-level mistakes and review dates. Distinguish an answer streak from a calendar-day streak. Replace cosmetic heart messaging with a clear, non-blocking learning model.

**Done when:**

- [x] “Meta de hoy” displays actual progress toward a selected goal and resets on the learner's local calendar day.
- [x] Daily streak rules are stated and tested across midnight, missed days, and timezone changes.
- [x] Missed concepts become eligible for later review; an injected clock verifies scheduling without waiting in real time.
- [x] Reviews are capped to a short session, support offline use, and preserve course progress. Session/storage tests and the static offline architecture support scheduled review; the complete desktop offline walkthrough exercised unit replay.
- [x] Learners can see which concepts need work; review results do not inflate first-completion metrics.

**Evidence:** time-boundary and scheduling tests plus an observed daily-goal/review journey. Start with a simple documented schedule; tune it from learner evidence.

### M6 — Demonstrate practical learning

**Deliver:** a downloadable synthetic public-health CSV, an RStudio setup guide, and an independent assignment covering import, inspection, cleaning, filtering, indicators, plotting, dates, and export. Publish a scored rubric and separate worked solution. Browser-based R execution is a future option, not a dependency.

**Done when:**

- [x] The dataset, starter material, rubric, and solution reproduce successfully in the documented R environment. Main, baseline, and seven-day reference solutions passed.
- [ ] Five beginners complete a baseline task, try the improved app, and attempt a new assignment; record rubric scores and observed friction.
- [ ] At least four meet the 80% independent-application target and at least four meet the seven-day retention target on parallel questions.
- [ ] If targets are missed, document the failing concepts and revise the relevant teaching/review milestones before claiming success.
- [ ] Use feedback to choose the next curriculum addition rather than expanding the course by default.

**Evidence:** reproducible assignment output and anonymized pilot results. Use synthetic data throughout; collect pilot feedback directly rather than introducing analytics infrastructure.

## Scope and decisions

The July design deliberately kept the retry queue in memory, hearts cosmetic, and spaced repetition out of scope. This roadmap proposes a new phase that revisits those choices; it does not classify every earlier non-goal as an implementation defect.

Implemented choices: exact answers by default, one explicitly open-ended string-vector question, no review XP, daily goals of 5/10/15 exercises, one correct exercise to maintain a local-day streak, and concept reviews at 1/3/7/14 days with a maximum of five concepts from one unit per session. Friends can bring devices for M4. No accounts, cloud sync, paid features, social rankings, or curriculum expansion are required for this goal.

## Next concrete checks

1. Review [draft PR #1](https://github.com/jachana/r-lingo/pull/1) and confirm an HTTPS test URL for the friends' devices. The code is committed on `codex/reliable-learning`; no merge or deployment has been performed.
2. Repeat the verified desktop backup/recovery journey as part of the phone release checks; include invalid files and cancellation.
3. Follow the Android/iOS install, offline, update, and accessibility checklist in [PILOT_PROTOCOL.md](PILOT_PROTOCOL.md) using a production HTTPS build.
4. Give friends the prepared baseline, main assignment, and seven-day materials in [learning-check/](learning-check/README.md). Record observed scores and friction, then adjust the weakest topics before choosing another unit.

## Verification baseline

Run on 30 September 2026:

```text
npm test       4 test files passed; 707 tests passed
npm run lint   passed (exit 0)
npm run build  passed (exit 0); PWA precache generated with 11 entries
```

Source inventory confirmed 9 units and 108 questions. A checker probe accepted `unrelated <- c("wrong")` against an expected string vector; this demonstrates the global permissive policy, not a bug in the current generic vector prompt. Browser inspection confirmed the desktop theory layout and 108-question course total; no learner progress was deliberately reset or advanced.

Reference files: `src/App.tsx`, `src/data/lessons.ts`, `src/data/lessons.test.ts`, `src/lib/checkAnswer.ts`, `src/lib/checkAnswer.test.ts`, `src/lib/sessionQueue.ts`, `src/lib/pickMode.ts`, `src/components/`, `vite.config.ts`, `Dockerfile`, `nginx.conf`, and `docs/superpowers/specs/2026-07-02-question-modes-design.md`.
