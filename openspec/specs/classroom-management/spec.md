# classroom-management Specification

## Purpose
TBD - created by archiving change add-classrooms. Update Purpose after archive.
## Requirements
### Requirement: Classroom entity and relationships
The system SHALL store classrooms with a name, exactly one teacher-in-charge, at most one optional assistant teacher, exactly one center, and a list of member children. A teacher MAY lead multiple classrooms (1:N) and MAY assist other classrooms. The assistant teacher MUST be a `Teacher` entity from the same center as the classroom and MUST NOT be the same teacher as the lead. A center MAY have many classrooms. A child MAY belong to multiple classrooms, but only classrooms whose center matches the child's own center.

#### Scenario: Classroom created with valid relationships
- **WHEN** a classroom is created with a name, a teacher, and a center
- **THEN** the classroom is persisted referencing that teacher and center, and appears in queries for that center's classrooms

#### Scenario: Teacher leads multiple classrooms
- **WHEN** a classroom is created with a teacher who already leads another classroom
- **THEN** the classroom is created and the teacher leads both classrooms

#### Scenario: Assistant teacher assigned
- **WHEN** a classroom is created or updated with an assistant teacher from the classroom's center who is not the lead
- **THEN** the classroom persists the assistant teacher reference

#### Scenario: Assistant same as lead rejected
- **WHEN** a classroom is created or updated with an assistant teacher who is also the lead teacher of that classroom
- **THEN** the API rejects the request with a validation error

#### Scenario: Assistant from another center rejected
- **WHEN** a classroom is created or updated with an assistant teacher whose center differs from the classroom's center
- **THEN** the API rejects the request with a validation error

#### Scenario: Child from another center rejected
- **WHEN** a child is added to a classroom whose center differs from the child's center
- **THEN** the API rejects the request and the child is not added

#### Scenario: Child in multiple classrooms of same center
- **WHEN** a child already in one classroom is added to a second classroom in the same center
- **THEN** the child is a member of both classrooms

### Requirement: Create classroom API with role-based defaults
The system SHALL expose an authenticated endpoint to create classrooms. For teachers, the lead teacher SHALL be the requesting teacher and the center SHALL be the teacher's center (not overridable). For admins, the request MUST specify a center and a teacher belonging to that center. Both roles MAY optionally specify an assistant teacher from the classroom's center. Parents SHALL NOT create classrooms.

#### Scenario: Teacher creates own classroom
- **WHEN** a teacher submits only a classroom name
- **THEN** a classroom is created with that teacher as teacher-in-charge, the teacher's center as the classroom center, and no assistant teacher

#### Scenario: Teacher creates classroom with assistant
- **WHEN** a teacher submits a classroom name and an assistant teacher from their center
- **THEN** the classroom is created with the requesting teacher as lead and the chosen teacher as assistant

#### Scenario: Admin creates classroom for a teacher
- **WHEN** an admin submits a name, a center, and a teacher from that center (optionally an assistant from that center)
- **THEN** the classroom is created with the chosen teacher, center, and assistant (if provided)

#### Scenario: Admin selects mismatched teacher and center
- **WHEN** an admin submits a teacher who does not belong to the selected center
- **THEN** the API rejects the request with a validation error

#### Scenario: Parent denied
- **WHEN** a parent calls the create-classroom endpoint
- **THEN** the API responds 403

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

