## ADDED Requirements

### Requirement: Classroom recording accept notifies enrolled parents

The system SHALL fan out one `classroom-recording-added` in-app notification per
parent in `Classroom.parents[]` when an admin or teacher successfully accepts
a classroom-scoped recording via `POST /api/assessments/teacher/accept` with a
valid `classroomId`, after assessments are saved. The notification message
SHALL read `New recording in classroom: "<classroom name>"`. This fan-out MUST
NOT run on transcript reject or on non-classroom teacher accepts.

#### Scenario: Accept after classroom Record flow
- **WHEN** a teacher completes the classroom homepage Record flow and accepts
  the transcript for classroom R
- **THEN** each parent enrolled in R receives a `classroom-recording-added`
  notification
- **AND** clicking the notification navigates to `/classrooms/<R>`

#### Scenario: Admin accept on classroom homepage
- **WHEN** an admin accepts a classroom recording scoped to classroom R
- **THEN** enrolled parents receive `classroom-recording-added` notifications
  the same as when a teacher accepts
