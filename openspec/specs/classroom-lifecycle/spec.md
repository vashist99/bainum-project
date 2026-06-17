# classroom-lifecycle Specification

## Purpose
TBD - created by archiving change evolve-classroom-membership-and-transcripts. Update Purpose after archive.
## Requirements
### Requirement: Classroom can be deleted by admin or its lead teacher

The system SHALL expose `DELETE /api/classrooms/:id`. The endpoint MUST
authorize the caller as one of:
- an admin, or
- the `teacher` (lead teacher) of the classroom identified by `:id`.

Any other authenticated user (assistant teacher, parent, or unrelated
teacher) MUST receive a 403. Unauthenticated callers MUST receive a 401.

#### Scenario: Admin deletes a classroom
- **WHEN** an admin sends `DELETE /api/classrooms/<id>` for an existing
  classroom
- **THEN** the response is 200 with a summary of what was removed and what
  was preserved (counts of unlinked children, parents, and historical
  recordings)
- **AND** subsequent `GET /api/classrooms/<id>` returns 404

#### Scenario: Lead teacher deletes their own classroom
- **WHEN** the lead teacher of a classroom sends `DELETE /api/classrooms/<id>`
- **THEN** the response is 200 with the same summary

#### Scenario: Assistant teacher is rejected
- **WHEN** a teacher who is only the `assistantTeacher` of the classroom
  sends `DELETE /api/classrooms/<id>`
- **THEN** the response is 403

#### Scenario: Parent is rejected
- **WHEN** any parent sends `DELETE /api/classrooms/<id>`
- **THEN** the response is 403

#### Scenario: Unauthenticated
- **WHEN** an unauthenticated request hits `DELETE /api/classrooms/<id>`
- **THEN** the response is 401

### Requirement: Deletion severs membership without destroying history

When a classroom is deleted, the system SHALL:
1. Remove the classroom id from every member child's `Child.classrooms`
   array.
2. Delete the `Classroom` document itself.
3. Null the `classroomId` reference on every `Assessment` and
   `TeacherAssessment` row that pointed to the deleted classroom; the
   rows themselves (transcript, metrics, child/teacher links) MUST be
   preserved.
4. Hard-delete every `pending` `Invitation` row targeting this
   classroom (`Invitation.deleteMany({ classroomId, status:
   "pending" })`). `accepted` invitations MUST be left as-is.

`Teacher`, `Parent`, `Center`, and `Child` documents (apart from the
`classrooms[]` pull on Child) MUST NOT be otherwise modified.

#### Scenario: Members are unlinked
- **WHEN** a classroom with 5 enrolled children is deleted
- **THEN** each of those 5 `Child` documents has the classroom id removed
  from its `classrooms` array
- **AND** each child's transcripts on their data page still show the
  classroom recordings made before deletion

#### Scenario: Historical recordings preserved
- **WHEN** a classroom is deleted
- **THEN** every `Assessment.classroomId` and `TeacherAssessment.classroomId`
  that referenced it becomes `null`, but the documents themselves remain
  with all their fields intact

#### Scenario: Pending invitations hard-deleted
- **WHEN** a classroom is deleted and there are 2 pending invitations
  targeting it
- **THEN** both invitation documents are removed from the database
  (`Invitation.findById(<id>)` returns null afterwards)
- **AND** any `accepted` invitation that linked to the same classroom
  is left unchanged in the database (only its association with the
  now-deleted classroom is logically severed)

#### Scenario: Teacher and parent accounts untouched
- **WHEN** a classroom is deleted
- **THEN** its lead teacher, assistant teacher, and every enrolled parent
  remain valid users with their other classrooms unaffected

### Requirement: Delete button on the classroom homepage

The classroom homepage SHALL render a "Delete Classroom" button visible
to admins and the classroom's lead teacher. Clicking it MUST open a
confirmation dialog that shows:
- the number of children currently enrolled,
- the number of parents currently in the classroom,
- the number of historical recordings that will be disassociated (not
  deleted),
- the number of pending invitations that will be **deleted**.

The destructive action MUST require the user to click a "Yes, delete"
button before the request is sent. Cancelling or dismissing the dialog
MUST send no request.

#### Scenario: Admin sees the button
- **WHEN** an admin opens a classroom homepage
- **THEN** the page renders a "Delete Classroom" button in the header
  controls

#### Scenario: Lead teacher sees the button
- **WHEN** the classroom's lead teacher opens its homepage
- **THEN** the page renders the same button

#### Scenario: Assistant teacher does not see the button
- **WHEN** the classroom's assistant teacher opens the same homepage
- **THEN** no "Delete Classroom" button is shown

#### Scenario: Parent does not see the button
- **WHEN** an enrolled parent opens a classroom homepage they have
  access to
- **THEN** no "Delete Classroom" button is shown

#### Scenario: Confirm dialog summarizes impact
- **WHEN** the admin or lead teacher clicks "Delete Classroom"
- **THEN** a modal appears listing the number of children, parents,
  historical recordings (to be disassociated), and pending invitations
  (to be deleted), plus a "Yes, delete" and a "Cancel" button

#### Scenario: Cancelling sends no request
- **WHEN** the user clicks "Cancel" in the confirm dialog
- **THEN** no `DELETE /api/classrooms/<id>` request is sent and the
  classroom is unchanged

### Requirement: Deletion is irreversible

The system MUST NOT provide a "restore" or "trash" mechanism for deleted
classrooms in this iteration. After a successful delete, the only way to
recreate the grouping is to create a new classroom and re-invite the
parents.

#### Scenario: No undo
- **WHEN** a classroom has been deleted
- **THEN** there is no API endpoint or UI affordance to bring it back;
  any future request to `GET /api/classrooms/<id>` returns 404

