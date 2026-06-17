# child-classroom-membership Specification

## Purpose
TBD - created by archiving change evolve-classroom-membership-and-transcripts. Update Purpose after archive.
## Requirements
### Requirement: Child has a classrooms array

The `Child` schema SHALL include a `classrooms` field of type
`[ObjectId, ref "Classroom"]`. The array MUST default to `[]` and MUST
NOT contain duplicate ids (`$addToSet` semantics).

#### Scenario: New child starts with an empty classrooms array
- **WHEN** a child is created via `POST /api/children`
- **THEN** the saved document has `classrooms: []`

#### Scenario: Classrooms array de-duplicates
- **WHEN** the same classroom id is pushed twice onto a child's
  `classrooms`
- **THEN** the array contains the id exactly once

### Requirement: Classroom membership is driven by parent invitation acceptance

A `Child` SHALL be added to a `Classroom` (and vice versa) if and only if
a parent of that child **accepts** an invitation whose payload includes
that classroom and that child. The system MUST:

1. On invitation acceptance with a `classroomId`, for every accepted
   child in the invitation, add the classroom id to `Child.classrooms`
   (`$addToSet`), add the child id to `Classroom.children`
   (`$addToSet`), and add the parent id to `Classroom.parents`
   (`$addToSet`).
2. On invitation acceptance without a `classroomId`, NOT modify
   `Child.classrooms` (preserves the legacy parent-link-only invite).

#### Scenario: Accepting a classroom invitation enrolls the children
- **WHEN** a parent accepts a classroom invitation that lists 2 of their
  3 children
- **THEN** those 2 children have the classroom id appended to their
  `classrooms` arrays
- **AND** the classroom's `children` and `parents` arrays include
  those child ids and the parent id

#### Scenario: Legacy parent-only invitation
- **WHEN** a parent accepts an invitation that has no `classroomId`
- **THEN** no child's `classrooms` array is modified by the acceptance

#### Scenario: A second classroom invitation
- **WHEN** a parent accepts another classroom invitation for the same
  child, targeting a different classroom
- **THEN** that child's `classrooms` array now contains both classroom
  ids

### Requirement: Membership is removed when the classroom is deleted

When a `Classroom` is deleted, the system MUST remove that classroom's
id from every `Child.classrooms` array that contained it. This MUST
happen in the same transaction (or sequenced operation) as the
classroom deletion so that a viewer cannot observe a partial state.

#### Scenario: Classroom delete prunes child memberships
- **WHEN** an admin deletes a classroom that had 5 children enrolled
- **THEN** those 5 `Child.classrooms` arrays no longer contain the
  deleted classroom's id
- **AND** the deletion summary returned by the endpoint reports those
  5 unlinkings

### Requirement: Child.leadTeacher is removed

`Child.leadTeacher` SHALL no longer be a required schema field. The
field MUST be renamed to `leadTeacher_deprecated` in the schema for
one release and become read-only (no API path SHALL write to it).
After the deprecation window, the field SHALL be removed entirely.

**Reason**: Membership is now expressed via `Child.classrooms`, which
is unambiguous (ObjectId references) and editable through the parent
invitation flow rather than a free-form name string.

**Migration**: Existing rows keep their `leadTeacher` value under
`leadTeacher_deprecated` so administrators can audit which legacy
children need to be re-enrolled via classroom invitations. No
automatic backfill of `Child.classrooms` from this string is
performed.

#### Scenario: Schema rejects writes to leadTeacher
- **WHEN** a client sends `POST /api/children` or
  `PATCH /api/children/<id>` with a `leadTeacher` field in the body
- **THEN** the field is ignored (stripped) before save and the response
  does not echo it back

#### Scenario: Existing value preserved in deprecated field
- **WHEN** a child created before this change is read via
  `GET /api/children/<id>`
- **THEN** the response includes `leadTeacher_deprecated` with the
  original string and `classrooms: [...]` reflecting current
  membership (possibly empty)

#### Scenario: Add Child form no longer asks for lead teacher
- **WHEN** an admin or teacher opens the Add Child form
- **THEN** no Lead Teacher dropdown is shown
- **AND** an explanatory note says "Classrooms are set when a parent
  accepts an invitation"

### Requirement: Recording fan-out resolves children via classrooms

`getSupervisedChildrenForTeacher(teacher)` SHALL return the union of:
1. Every `Child` listed in `Classroom.children` for any `Classroom`
   where `teacher` is the lead or assistant.
2. Every `Child` linked to the teacher by an active `AccessGrant`
   (the existing fallback for non-classroom-mediated relationships).

The helper MUST NOT read `Child.leadTeacher` or
`Child.leadTeacher_deprecated`. Results MUST be deduplicated by child
id.

#### Scenario: Children from led classrooms
- **WHEN** a teacher leads 2 classrooms with 3 and 4 children
  respectively
- **THEN** `getSupervisedChildrenForTeacher` returns those 7 children
  (deduped if any overlap)

#### Scenario: Children from assisted classrooms
- **WHEN** a teacher assists 1 classroom of 5 children and leads none
- **THEN** the helper returns those 5 children

#### Scenario: AccessGrant fallback still applies
- **WHEN** a child is in no classroom involving the teacher but the
  teacher has an active `AccessGrant` for that child
- **THEN** the child is included in the result

#### Scenario: No classrooms, no grants
- **WHEN** a teacher has no classrooms and no grants
- **THEN** the helper returns an empty array

### Requirement: Admin can manually enroll or remove a child in a classroom

The system SHALL expose `PATCH /api/classrooms/:id/children` so that an
admin can add or remove an individual child's classroom membership
without going through a parent invitation. The endpoint MUST:

- Reject any caller whose role is not `"admin"` with 403 (lead and
  assistant teachers MUST receive 403 too — this is admin-only).
- Reject unauthenticated callers with 401.
- Accept a JSON body containing exactly one of `addChildId` or
  `removeChildId`; supplying both or neither MUST return 400.
- On `addChildId`: verify the child's effective center matches the
  classroom's center; if it does not, return 409. On success, perform
  `$addToSet` on both `Child.classrooms` (for that child) and
  `Classroom.children` (for that classroom).
- On `removeChildId`: perform `$pull` on both `Child.classrooms`
  and `Classroom.children`. Removing a child whose id is not actually
  in the classroom MUST return 200 with `changed: false` (idempotent).
- NOT add or remove any parents; parent membership continues to be
  governed by the invitation acceptance flow.

Lead and assistant teachers MUST NOT see any UI affordance backed by
this endpoint on the classroom homepage; only admins MUST see the
"Add child" / "Remove child" controls.

#### Scenario: Admin adds a same-center child
- **WHEN** an admin sends `PATCH /api/classrooms/<id>/children` with
  `{ "addChildId": "<child>" }` and the child's center matches the
  classroom's center
- **THEN** the response is 200 with `changed: true`
- **AND** the child's `classrooms` array contains the classroom id
- **AND** the classroom's `children` array contains the child id

#### Scenario: Admin adds a cross-center child
- **WHEN** an admin sends `addChildId` for a child whose center does
  not match the classroom
- **THEN** the response is 409 and no state is changed

#### Scenario: Admin removes a child
- **WHEN** an admin sends `PATCH /api/classrooms/<id>/children` with
  `{ "removeChildId": "<child>" }` and the child is currently in the
  classroom
- **THEN** the response is 200 with `changed: true`
- **AND** the classroom id is no longer in `Child.classrooms`
- **AND** the child id is no longer in `Classroom.children`
- **AND** no parent linked to that child is added or removed by this
  operation

#### Scenario: Idempotent remove
- **WHEN** an admin sends `removeChildId` for a child that is not in
  the classroom
- **THEN** the response is 200 with `changed: false` and no error

#### Scenario: Lead teacher is rejected
- **WHEN** the lead teacher of the classroom calls this endpoint
- **THEN** the response is 403

#### Scenario: Assistant teacher is rejected
- **WHEN** the assistant teacher of the classroom calls this endpoint
- **THEN** the response is 403

#### Scenario: Body validation
- **WHEN** an admin sends a body with both `addChildId` and
  `removeChildId`, or with neither
- **THEN** the response is 400

#### Scenario: Admin-only UI affordance
- **WHEN** an admin opens a classroom homepage
- **THEN** "Add child" and "Remove child" controls appear in the
  classroom children list

#### Scenario: Teachers do not see the controls
- **WHEN** the classroom's lead or assistant teacher opens the same
  homepage
- **THEN** no "Add child" or "Remove child" controls are shown

### Requirement: ChildDataPage shows classroom membership in place of lead teacher

`ChildDataPage` MUST replace any "Lead teacher: <name>" display with a
list of the classrooms the child is enrolled in (rendered by classroom
name). If the child is in no classroom, the page MUST show a friendly
message such as "Not enrolled in any classroom yet."

#### Scenario: Child enrolled in classrooms
- **WHEN** a viewer opens a child's data page and the child has
  `classrooms` of length 2
- **THEN** the page shows both classroom names (linkable if the viewer
  has access)

#### Scenario: Child not yet enrolled
- **WHEN** the child's `classrooms` array is empty
- **THEN** the page shows the empty-state message in the same slot

