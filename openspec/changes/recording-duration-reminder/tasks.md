## 1. Timer constants and reminder trigger

- [x] 1.1 Constants moved to `mockup1/src/utils/recordingReminder.js` (`MAX_RECORDING_MS = 60 * 60 * 1000`, `REMINDER_INTERVAL_MS = 15 * 60 * 1000`) and imported by `ActivityRecordingForm.jsx` so the schedule logic is unit-testable (folds in task 3.1).
- [x] 1.2 Added `showReminder` state and `nextReminderAtRef`; the 250ms timer loop uses `shouldShowReminder`/`advanceReminder` (skip-ahead safe for throttled tabs) and fires the modal.
- [x] 1.3 Reset `showReminder` and `nextReminderAtRef` in both `handleStartRecording` and `handleStopRecording`.

## 2. Reminder modal UI

- [x] 2.1 DaisyUI modal rendered while `showReminder && recording`: pulsing red dot + "Recording is still on", live `formatElapsed(elapsedMs)`, 25MB/60-min note.
- [x] 2.2 **Keep recording** (btn-primary) closes the modal only; **Stop recording** (btn-outline btn-error) calls `handleStopRecording()` (which also clears the modal).
- [x] 2.3 Modal only toggles `showReminder` state — no recorder/stream refs touched; responsive (stacked buttons on mobile, `w-[92vw]` box); "Up to 5 min" label updated to "Up to 60 min".

## 3. Tests

- [x] 3.1 Pure helpers in `mockup1/src/utils/recordingReminder.js`: `initialReminderAt`, `shouldShowReminder(elapsedMs, nextReminderAt)`, `advanceReminder` (loops past skipped intervals so a slept tab gets one reminder, not a burst).
- [x] 3.2 Added `mockup1/tests/unit/recordingReminder.test.js` — 10 tests: constants, no-trigger before 15 min, trigger at/just-past 15 min, recurrence at 30/45 min, throttled-tab skip-ahead, session reset.
- [x] 3.3 `npm run test:unit` → 130/130 passing (31 suites). Production build (`vite build`) also verified clean.

## 4. Documentation

- [x] 4.1 User manual (teacher "Record activity" + parent "Record activity at home") and FAQ (new "How long can I record?" entry) mention the 60-minute cap, 15-minute reminder, and the 25MB caveat.
- [x] 4.2 Rebuilt all four Word deliverables via `build-docx.sh`.

## 5. Manual verification

- [ ] 5.1 With the dev server and shortened test constants (e.g., temporarily set the interval to 10s), record and confirm: reminder appears, Keep recording continues without an audio gap, Stop recording keeps the clip, and the hard cap auto-stops. *(Needs a human with a microphone — see note below.)*
- [x] 5.2 Real constants (15 min / 60 min) are the ones in the committed code; only the unit tests use synthetic elapsed values.

> **Manual test tip (5.1):** in `mockup1/src/utils/recordingReminder.js`, temporarily set `REMINDER_INTERVAL_MS = 10 * 1000` and `MAX_RECORDING_MS = 35 * 1000`, run the dev server, and start a recording. Expect reminders at ~10s/20s/30s and auto-stop at 35s. Revert before committing.
