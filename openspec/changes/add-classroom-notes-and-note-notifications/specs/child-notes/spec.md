## ADDED Requirements

### Requirement: Child notes API is authenticated

The system SHALL require a valid JWT on all child note endpoints (`POST
/api/notes` with `childId`, `GET /api/notes/child/:childId`,
`DELETE /api/notes/:noteId`, `PUT /api/notes/:noteId`). Unauthenticated
callers MUST receive 401.

#### Scenario: Unauthenticated list denied
- **WHEN** a request without JWT calls `GET /api/notes/child/<id>`
- **THEN** the response is 401

### Requirement: Child note access matches child data page rules

Creating, listing, or deleting a child note SHALL be allowed for admins,
for parents linked to that child, and for teachers with active access to
that child's data (AccessGrant or supervised classroom membership per
existing child controller rules). Other callers MUST receive 403.

#### Scenario: Linked parent can add a child note
- **WHEN** a parent linked to child C POSTs a note for `childId: C`
- **THEN** the response is 201 and the note is saved

#### Scenario: Unrelated parent denied
- **WHEN** a parent not linked to child C POSTs a note for `childId: C`
- **THEN** the response is 403

### Requirement: Staff child notes notify linked parents

The system SHALL create one `child-note-added` in-app notification per
linked parent when an admin or teacher successfully creates a child-scoped
note. The fan-out MUST run after the note is saved and MUST NOT roll back the
note if notification creation fails. Parents authoring their own child notes
MUST NOT trigger this fan-out.

#### Scenario: Teacher note notifies parents
- **WHEN** a teacher with access POSTs a child note for child C
- **AND** parents P1 and P2 are linked to C
- **THEN** exactly two `child-note-added` notifications exist for P1 and P2
- **AND** each references C with a snapshot of the child's name

#### Scenario: Parent self-note does not notify
- **WHEN** a linked parent POSTs a note on their child's page
- **THEN** no `child-note-added` notifications are created for any parent

#### Scenario: Notification failure does not delete the note
- **WHEN** note save succeeds but `Notification.create` throws
- **THEN** the note remains and the API still returns 201
