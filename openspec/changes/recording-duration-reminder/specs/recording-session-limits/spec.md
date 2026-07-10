# recording-session-limits Specification (delta)

## ADDED Requirements

### Requirement: Recording sessions have a 60-minute hard cap

The in-browser recorder SHALL allow continuous recording of up to 60 minutes per session. When the elapsed recording time reaches 60 minutes, the recorder MUST stop automatically and preserve the captured audio exactly as a manual stop would. This replaces the previous 5-minute silent auto-stop.

#### Scenario: Auto-stop at the hard cap

- **WHEN** a recording session reaches 60 minutes of elapsed time
- **THEN** the recorder stops automatically and the captured audio is kept for review/upload

#### Scenario: Recording under the cap is unaffected

- **WHEN** a user stops a recording manually at any point before 60 minutes
- **THEN** the audio is kept and no cap-related behavior triggers

### Requirement: Still-recording reminder pop-up at 15-minute intervals

After 15 minutes of continuous recording, the system SHALL display a modal pop-up reminding the user that recording is still in progress. The pop-up MUST offer exactly two actions: **Keep recording** (dismisses the pop-up, recording continues) and **Stop recording** (stops the recorder, keeping the audio). The pop-up SHALL reappear after each further 15 minutes of recording (at 30 and 45 minutes) if the session continues. The pop-up MUST include a warning that long recordings may exceed the 25MB upload limit.

#### Scenario: Reminder appears at 15 minutes

- **WHEN** a recording session's elapsed time reaches 15 minutes
- **THEN** a modal appears stating recording is still on, showing the elapsed time, with Keep recording and Stop recording buttons

#### Scenario: Keep recording dismisses without interrupting

- **WHEN** the user chooses Keep recording on the reminder
- **THEN** the modal closes and the recorder keeps capturing with no gap or pause in the audio

#### Scenario: Stop recording from the reminder

- **WHEN** the user chooses Stop recording on the reminder
- **THEN** the recorder stops and the captured audio is available for review/upload, identical to a manual stop

#### Scenario: Reminder recurs every 15 minutes

- **WHEN** the user kept recording at the 15-minute reminder and the session reaches 30 minutes
- **THEN** the reminder modal appears again (and again at 45 minutes if the session continues)

#### Scenario: No response to the reminder

- **WHEN** the reminder is shown and the user takes no action
- **THEN** recording continues uninterrupted until the user acts, the next reminder fires, or the 60-minute hard cap auto-stops the session

### Requirement: Recording is never paused or lost by the reminder

The reminder pop-up MUST NOT pause, mute, or restart the `MediaRecorder` session. Audio captured while the pop-up is open SHALL be included in the final recording.

#### Scenario: Audio continuity across a reminder

- **WHEN** the reminder is open for any amount of time and the user then chooses Keep recording and later stops
- **THEN** the final audio includes everything captured while the reminder was open

### Requirement: Reminder schedule resets per session

Each recording session SHALL have its own reminder schedule. Stopping a recording (manually, via the reminder, or via the hard cap) and starting a new one MUST reset the elapsed timer and the reminder schedule to zero.

#### Scenario: New session after a stopped one

- **WHEN** a user stops a 20-minute recording and immediately starts a new recording
- **THEN** the new session's first reminder fires at its own 15-minute mark, not before
