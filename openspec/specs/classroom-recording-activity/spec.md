# classroom-recording-activity Specification

## Purpose
TBD - created by archiving change add-recording-location-activity. Update Purpose after archive.
## Requirements
### Requirement: Classroom recordings capture an activity
The classroom recording flow (classroom Record button / `ClassroomUploadModal`) SHALL include a school-context activity picker using the existing predefined school activity catalog, with the existing "add a custom activity (validated by AI)" mechanism. The chosen activity SHALL be persisted on the resulting teacher assessment and on every fanned-out child assessment. This replaces the previous behavior where classroom uploads omitted `activity`.

#### Scenario: Activity picker in classroom modal
- **WHEN** a teacher, assistant, or admin opens the classroom recording modal
- **THEN** a school-context activity picker is shown alongside the location picker

#### Scenario: Activity persisted on classroom recording
- **WHEN** a classroom recording is accepted with activity "Circle time"
- **THEN** the teacher assessment and all fanned-out child assessments carry activity "Circle time"

#### Scenario: Custom classroom activity vetted
- **WHEN** the user enters a custom activity in the classroom modal
- **THEN** it must pass the existing activity AI vetting (client-side before upload, re-validated server-side at accept)

#### Scenario: Legacy uploads remain valid
- **WHEN** a classroom recording saved before this change is read
- **THEN** it loads normally with no activity

