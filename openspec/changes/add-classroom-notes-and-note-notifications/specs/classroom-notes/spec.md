## ADDED Requirements

### Requirement: Classroom notes are stored with classroom scope

The system SHALL persist classroom-scoped notes in the same `notes`
collection as child notes. Each classroom note MUST include
`classroomId` (ObjectId ref Classroom), `content`, `author`, optional
`authorId`, and `timestamp`. Classroom notes MUST NOT include `childId`.
Child-scoped notes MUST continue to require `childId` and MUST NOT include
`classroomId`. Creating a note with both scopes or neither scope MUST be
rejected with 400.

#### Scenario: Staff creates a classroom note
- **WHEN** an admin POSTs `{ classroomId, content }` to `/api/notes`
- **THEN** a note row is saved with that `classroomId` and no `childId`
- **AND** the response is 201 with the note payload

#### Scenario: Dual scope rejected
- **WHEN** a caller POSTs both `childId` and `classroomId`
- **THEN** the response is 400 and no note is created

### Requirement: Classroom notes API is authenticated and authorized

All `/api/notes` routes MUST require a valid JWT. Classroom note reads and
writes SHALL follow classroom homepage access:

- **Manage** (admin, lead, assistant): list, create, delete classroom notes.
- **Read** (enrolled parent): list only; create and delete MUST return 403.
- Unauthorized users MUST receive 403.

The system SHALL expose `GET /api/notes/classroom/:classroomId` returning
notes for that classroom sorted by `timestamp` descending.

#### Scenario: Lead teacher lists classroom notes
- **WHEN** the classroom's lead teacher calls
  `GET /api/notes/classroom/<id>`
- **THEN** the response is 200 with that classroom's notes newest first

#### Scenario: Enrolled parent can read but not write
- **WHEN** a parent in `Classroom.parents` calls
  `GET /api/notes/classroom/<id>`
- **THEN** the response is 200 with the note list
- **AND WHEN** the same parent POSTs a new classroom note
- **THEN** the response is 403

#### Scenario: Unrelated teacher denied
- **WHEN** a teacher who is neither lead nor assistant of classroom C
  calls `GET /api/notes/classroom/<C>`
- **THEN** the response is 403

### Requirement: Classroom homepage shows Notes and Observations

The classroom homepage (`/classrooms/:id`) SHALL render a **Notes &
Observations** card matching the child data page pattern: note count badge,
textarea + Add Note control (manage mode only), list of notes with author
and timestamp, and per-note delete (manage mode only). In parent read mode
the list SHALL be visible but add/delete controls MUST be hidden.

#### Scenario: Lead teacher adds a classroom note
- **WHEN** the lead teacher opens `/classrooms/:id` in manage mode
- **THEN** the Notes section shows an add form and existing notes
- **AND WHEN** they submit a note
- **THEN** the note appears in the list without a full page reload

#### Scenario: Enrolled parent sees notes read-only
- **WHEN** a parent enrolled in classroom C opens `/classrooms/<C>`
- **THEN** the Notes section lists existing notes
- **AND** no Add Note or Delete controls are rendered
