# Recording Duration Reminder

## Why

Teachers and parents record in the moment — on a phone, in a classroom or at home — and it is easy to forget the microphone is still on. Long forgotten recordings waste battery and storage, risk capturing talk nobody intended to upload, and can exceed the 25MB upload cap so the whole session is lost. Today the recorder silently auto-stops at 5 minutes, which both truncates legitimate longer sessions and gives the user no say in the matter.

## What Changes

- Raise the maximum in-browser recording duration from 5 minutes to 60 minutes.
- After **15 minutes** of continuous recording, show a pop-up reminding the user that recording is still on, with two choices: **Keep recording** or **Stop recording**.
- The reminder repeats every 15 minutes (at 30 and 45 minutes) if the user keeps recording.
- Recording continues uninterrupted while the pop-up is open — dismissing it or choosing "Keep recording" never loses audio.
- If the user takes no action, recording continues until the 60-minute hard cap, at which point it auto-stops (existing behavior, new limit).
- The pop-up warns that very long recordings may exceed the 25MB upload limit.

## Capabilities

### New Capabilities

- `recording-session-limits`: In-browser recorder session duration rules — the hard cap, the periodic still-recording reminder pop-up, and its continue/stop actions.

### Modified Capabilities

<!-- none — the activity/location capture requirements are unchanged; this only governs the recorder session itself -->

## Impact

- **Frontend**: `mockup1/src/components/ActivityRecordingForm.jsx` — timer constants (`MAX_RECORDING_MS`), reminder modal state and UI, continue/stop handlers. Used by both the parent Home tab and the classroom/child recording modals, so all roles get the reminder.
- **No backend changes**: the 25MB upload limit is unchanged; the pop-up only warns about it.
- **Docs**: user manual and FAQ mention the 5-minute limit implicitly ("record a shorter clip" toast); update wording to reflect the 60-minute cap and reminder.
- **Tests**: unit test for the reminder threshold logic; existing recording e2e specs unaffected (they never record 15+ minutes).
