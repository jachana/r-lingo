# Implementation evidence — 30 September 2026

The changes are local and uncommitted. No deployment or remote CI result is claimed. Browser verification used disposable progress fixtures on `http://127.0.0.1:5175/`; displayed course completions and XP in screenshots are test data. The existing learner origin was not reset.

## Automated checks

```text
npm test         6 files; 733 tests passed
npm run lint     exit 0
npm run build    exit 0; production service worker generated
npm run verify:r exit 0; real R 4.6.0 through webR
```

Session/storage tests cover v2 migration and repeat loading, stable IDs under reordering, invalid data and denied storage, exactly-once rewards, wrong/correct feedback reload, matching checkpoints, all-nine-unit completion and replay, review reload, and serialization/import validation. App integration tests exercise actual controls, including first-error answer hiding, preserved feedback, reset cancellation, invalid import, and returning from a due review to the interrupted course.

Calendar tests use explicit dates/timezones. They verify midnight, missed days, unique questions per day, review dates at 1/3/7/14 days, the five-concept cap, and preservation of the interrupted course. Daily activity records are local dates as observed when answers are checked; changing timezone does not retroactively move historical dates. A streak remains visible through the next day until another day is missed.

See [content-audit.md](content-audit.md) for all 108 reviewed questions and [r-runtime.json](r-runtime.json) for execution details. The runner executes all nine theory scripts, nine output examples, seven intentionally failing snippets, and numeric/date/CSV/PNG assertions. It checks the other two error examples as a missing ggplot layer and a date-format mismatch. Main, baseline, and seven-day assignment references also execute and check their expected outputs. RStudio's native installation/UI has not been tested here.

## Observed production browser journeys

- Imported a complete-course fixture through the file picker and explicit replacement confirmation. All nine unit controls opened fresh 12-question reviews; original completion totals and 2,340 XP stayed intact.
- Reloaded an incorrect answer and continued its retry queue. Reloaded token placements before checking and received a correct result.
- Reloaded a three-of-four matching checkpoint, completed the remaining pair by keyboard, observed the correct completed-unit title, next-unit unlock, and XP from 240 to 260. Reload kept 260 XP without repeating the reward.
- Completed answers in choice, write, gap, and token modes using keyboard activation. Matched pairs using Enter. These checks focus controls through documented browser locators; they are not a full Tab-order or actual screen-reader walkthrough.
- Cancelled reset without changing XP/checkpoints. Changed the sound checkbox, reloaded, and observed the saved preference.
- Observed a desktop production update from `index-CvFRBWLz.js` to `index-B_bmDI5x.js`, preserving a matching checkpoint and subsequent completion. A later update to `index-DSg_Lnuv.js` preserved checked wrong feedback while applying the new first-error hint rule. Physical-device updates remain untested.
- Stopped the production server and confirmed it gave no HTTP response. Reloaded the cached app, answered all 12 first-unit review questions, completed four matching pairs, and reloaded the completed review. XP stayed at 2,340; the daily counter reached 12 unique correct questions. See [offline-check.json](offline-check.json) and [offline-unit.jpg](offline-unit.jpg). Other network destinations were not disabled; no external references were needed.
- Download notification polling timed out in both Chrome and the in-app browser, but the actual JSON files were created in Downloads. Verified a Chrome export with 20 earned XP and checked `r-basics-q01` feedback. Imported that exact file through the in-app browser and confirmed the first question, earned XP, and checked feedback after reload. Exported again from the in-app browser; both files decode to identical progress objects (JSON property order changes during sanitization, so the bytes differ). Advanced to 40 XP, imported its own downloaded 20-XP file, explicitly confirmed replacement, and verified restored progress and feedback after another reload. See [backup-roundtrip.json](backup-roundtrip.json), [downloaded fixture](fixtures/browser-export.json), and [restored screenshot](backup-restored.jpg). Chrome's automated file picker needs an extra extension file-URL permission; it was not changed, and Chrome-specific reimport was not observed.

## Responsive evidence

[browser-matrix.json](browser-matrix.json) records **72 checks** at 320/390/768/1280 CSS pixels: choice/write/gap/tokens in unanswered, wrong, and correct states; matching checkpoint/wrong/correct states; unit completion; and text/code theory. No page-level overflow was measured, and visible practice buttons/inputs remained within the viewport. Mode fixtures use the first question with attempts chosen to reach each mode; some wrong states are later-attempt reveals. These are representative layout checks, not a visual audit of every question or physical device.

Screenshots: [desktop practice](app-preview.jpg), [phone-width token feedback](mobile-practice.jpg), [unit completion](unit-complete.jpg), and [offline completed unit](offline-unit.jpg).

## Open completion gates

| Gate | What is ready | Evidence still needed |
|---|---|---|
| M1 remote CI | Checked-in workflow and passing local commands | First host workflow result |
| M4 mobile release | Icons, manifest, desktop caching/update, responsive/keyboard checks | Physical Android and iOS install/offline/update, native screen reader, full keyboard order |
| M6 learning outcomes | Synthetic datasets, starter, 20-point rubric, three executed reference solutions, blank results table | Five friends' observed baseline and assignment scores; seven-day follow-up; teaching revisions if needed |

The informal learning checks are described in [PILOT_PROTOCOL.md](../PILOT_PROTOCOL.md). No participant scores, installed-device results, or learning gains have been inferred from automated tests. Overall goal completion remains pending.
