## MODIFIED Requirements

### Requirement: Classroom listing and retrieval respect roles
The system SHALL let admins list all classrooms, teachers list/retrieve the classrooms where they are lead OR assistant, and parents list AND retrieve only the classrooms their own children are enrolled in (with each row indicating which of their children are enrolled). Parents SHALL remain denied on classroom **administration** endpoints (invite, eligible-parents, delete-classroom, child-removal) but SHALL be granted **read** access to the classroom detail, assessments, and transcripts endpoints in a scope-limited form:

- `GET /api/classrooms/:id`: returns 200 to enrolled parents with
  `role: "parent"`, with `children` filtered to that parent's own
  child(ren) and `parents` omitted entirely.
- `GET /api/classrooms/:id/assessments`: returns 200 to enrolled parents
  with `assessments` filtered to that parent's own child(ren).
- `GET /api/classrooms/:id/transcripts`: returns 200 to enrolled parents
  with `recordings` filtered to those whose `childId` matches one of
  that parent's children OR whose `source === "teacher"` (room-wide
  teacher recordings remain visible).
- `POST /api/classrooms/:id/invite`,
  `GET /api/classrooms/:id/eligible-parents`,
  `DELETE /api/classrooms/:id`,
  `DELETE /api/classrooms/:id/children/:childId`: continue to return 403 to parents.

Listing responses SHALL include the classroom name, teacher-in-charge name, assistant teacher name (when set), and center name (populated, not just IDs), and SHALL indicate whether the requesting teacher is lead or assistant for each classroom.

#### Scenario: Admin lists all classrooms
- **WHEN** an admin requests the classroom list
- **THEN** all classrooms are returned with teacher, assistant (when set), and center names populated

#### Scenario: Teacher sees led and assisted classrooms
- **WHEN** a teacher who leads classroom A and assists classroom B requests classrooms
- **THEN** both A and B are returned, each marked with the teacher's role (lead vs assistant)

#### Scenario: Parent lists enrolled classrooms only
- **WHEN** a parent whose child is enrolled in classroom A (but not B) requests the classroom list
- **THEN** only classroom A is returned, including which of the parent's children are enrolled in it

#### Scenario: Parent retrieves enrolled classroom detail
- **WHEN** a parent whose `_id` is in `classroom.parents` calls
  `GET /api/classrooms/<id>`
- **THEN** the response is 200 with `role: "parent"`, the classroom
  name, center, and teacher names populated
- **AND** `children` lists only the calling parent's own enrolled
  child(ren)
- **AND** the `parents` field is not included in the response payload

#### Scenario: Parent retrieves enrolled classroom transcripts
- **WHEN** an enrolled parent calls
  `GET /api/classrooms/<id>/transcripts`
- **THEN** the response is 200 with `recordings` containing only entries
  whose `childId` is one of the parent's own children OR whose `source`
  is `"teacher"`

#### Scenario: Parent denied on classroom administration endpoints
- **WHEN** a parent calls `POST /api/classrooms/<id>/invite`,
  `GET /api/classrooms/<id>/eligible-parents`,
  `DELETE /api/classrooms/<id>`, or
  `DELETE /api/classrooms/<id>/children/<childId>`
- **THEN** the API responds 403

#### Scenario: Non-enrolled parent denied on classroom detail
- **WHEN** a parent whose `_id` is NOT in `classroom.parents` calls any
  classroom endpoint for that classroom
- **THEN** the API responds 403
