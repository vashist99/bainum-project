# Design — Recording Duration Reminder

## Context

All in-browser recording flows (parent Home tab, child data page modal, classroom modal) share one component: `mockup1/src/components/ActivityRecordingForm.jsx`. It drives a `MediaRecorder` and a 250ms `setInterval` timer that updates `elapsedMs` and force-stops the recorder when `elapsed >= MAX_RECORDING_MS` (currently 5 minutes). Uploads are capped at 25MB (`MAX_FILE_BYTES`), checked client-side when the recorder stops.

The current 5-minute silent auto-stop conflicts with the requested behavior (a reminder at 15 minutes can never fire), so this change both raises the cap and adds the reminder.

## Goals / Non-Goals

**Goals:**

- Remind the user at 15-minute intervals that recording is still on, and let them stop or continue from the pop-up.
- Never lose or pause audio because of the reminder — the recorder keeps running under the modal.
- Keep the hard cap (raised to 60 minutes) as the ultimate safety net.

**Non-Goals:**

- Changing the 25MB upload limit or the backend transcription flow.
- Reminders for uploaded files (they have a fixed duration already).
- Auto-stop at the reminder itself (only the 60-minute cap force-stops).
- Persisting reminder preferences per user.

## Decisions

1. **Constants**: `MAX_RECORDING_MS = 60 * 60 * 1000` (hard cap), new `REMINDER_INTERVAL_MS = 15 * 60 * 1000`. Both live at the top of `ActivityRecordingForm.jsx` next to the existing constants — one file, no config plumbing.
   - *Alternative considered*: keep the 5-minute cap and fire the reminder earlier (e.g., 4 minutes). Rejected: the user explicitly asked for a 15-minute reminder, which implies longer sessions are legitimate.

2. **Trigger inside the existing timer loop**: the 250ms interval already computes `elapsed`. Add a `nextReminderAtRef` (starts at `REMINDER_INTERVAL_MS`); when `elapsed >= nextReminderAtRef.current`, set `showReminder = true` and advance the ref by another interval. A ref (not state) avoids re-render races in the interval closure.
   - *Alternative considered*: a separate `setTimeout` chain. Rejected: two clocks can drift and the existing loop already owns elapsed-time bookkeeping.

3. **Modal, not toast**: a DaisyUI modal (same pattern as the delete-classroom confirm) with the live elapsed time, a note that long recordings may exceed the 25MB upload limit, and two buttons — **Keep recording** (primary, closes the modal) and **Stop recording** (calls the existing `handleStopRecording`). A toast would be too easy to miss, and the whole point is an explicit decision.

4. **No pause while the modal is open**: `MediaRecorder` keeps capturing. Pausing would surprise users who chose to keep going and would complicate blob assembly for zero benefit.

5. **No-response behavior**: recording simply continues until the next reminder or the 60-minute cap. Auto-stopping on an unanswered reminder risks killing a legitimate session (e.g., phone face-down during circle time) — the cap already bounds the worst case.

6. **Recurring reminders** at 15/30/45 minutes rather than a single one — a user who dismissed the first reminder at 15:01 shouldn't silently sail to the hard cap.

7. **Reset on stop/re-record**: `nextReminderAtRef` and `showReminder` reset in `handleStartRecording` and `handleStopRecording`, so a new session starts its own reminder schedule.

## Risks / Trade-offs

- [60-minute webm/opus recordings may exceed 25MB and be rejected after the fact] → The reminder modal and the recorder UI warn about the limit; the existing "recording exceeded 25MB" toast still guards the upload. If this bites real users, a follow-up change can raise the backend multer limit.
- [Backgrounded mobile tabs throttle `setInterval`, so a reminder may fire late] → Acceptable: the check uses wall-clock `Date.now()` deltas, so the reminder fires as soon as the tab wakes; the hard cap uses the same mechanism (unchanged behavior).
- [Longer cap means longer transcription jobs] → RevAI handles hour-long audio; processing UX (existing progress messages) already covers slow jobs.

## Migration Plan

Pure frontend change, no data migration. Deploy the frontend; older sessions in-flight are unaffected. Rollback = revert the commit.

## Open Questions

- None blocking. If stakeholders want a different cadence (e.g., reminder every 10 minutes), only `REMINDER_INTERVAL_MS` changes.
