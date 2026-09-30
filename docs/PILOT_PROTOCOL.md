# Friends' learning check and device verification

**Status:** Prepared; no participant or physical-device results have been collected.

## Learner pilot

This app is for friends who need to learn R, not a commercial product. Invite five beginners with little or no prior R experience for an informal learning check. They can bring their own devices. Use anonymous IDs P01–P05 and obtain their agreement to participate. Do not record patient data, names, or sensitive background information. Participation and scores are voluntary.

Before training, give each participant the 20-minute baseline task in [learning-check/baseline/](learning-check/baseline/), using the same eight rubric domains in `public/practica/guia.md`. Ask learners to choose their own object names. Record score, help received, and which concepts caused difficulty. Keep setup support separate from coding assistance.

After using the course and review features, give the independent assignment with `vigilancia.csv` and `poblaciones.csv`. Score the saved script and outputs against the 20-point rubric. Record duration, revealed answers, requested help, and usability observations. An independent pass requires at least 16/20 with no answer reveals or code supplied by another person.

Seven local calendar days later, use the prepared parallel assignment in [learning-check/seven-day/](learning-check/seven-day/). It changes ages, communes, dates, duplicate ID, denominators, and expected results while keeping the same difficulty and rubric. The [coordinator materials](learning-check/README.md) include a separately executed reference solution. Score out of 20 and record help in the same way. At least four participants must independently pass each assessment for the proposed target to be met.

| Participant | Baseline /20 | Assignment /20 | Help/reveals | Follow-up date | Seven-day /20 | Independent passes | Observations |
|---|---|---|---|---|---|---|---|
| P01 | | | | | | | |
| P02 | | | | | | | |
| P03 | | | | | | | |
| P04 | | | | | | | |
| P05 | | | | | | | |

Leave this table empty until observed results exist. If targets are missed, identify failing concepts and revise teaching/review, then run a new assessment. Summarize findings before deciding whether to add another unit. These five-person results are a usability signal, not a general claim of educational effectiveness.

## Android and iOS release checks

Use a deployed HTTPS production build and one physical Android device and one physical iOS device. Record device, OS, browser version, build identifier, and date. Desktop viewport simulation does not satisfy this gate.

1. Load online, install/add to the home screen, launch standalone, and check the icon and screen layout.
2. Start a unit, make an error, and close/reopen. Verify the exercise, feedback, retry history, and XP remain.
3. Complete one matching pair and reopen. Verify its checkpoint remains.
4. After an online load, disconnect networking and complete a unit. Export progress while offline.
5. Reconnect and make a new app build available. Apply the update, then verify active session and historical progress survive. Repeat with networking interrupted during update.
6. Test every exercise mode using the device's screen reader and external keyboard where supported. Verify gap context, selection, feedback, and numeric progress are announced.
7. Confirm reference links say they require internet, sound preference persists, and reduced motion is respected.

Record each item as passed, failed, or not tested; attach observations. Do not mark M4 or M6 complete until the respective observed gates pass.
