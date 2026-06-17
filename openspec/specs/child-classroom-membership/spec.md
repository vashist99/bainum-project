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

### Requirement: Admin or lead teacher can remove a child from a classroom

The system SHALL expose `DELETE /api/classrooms/:id/children/:childId`
so that an admin OR the classroom's lead teacher can remove a single
child's membership from one classroom. The endpoint MUST:

- Reject unauthenticated callers with 401.
- Reject parents and assistant teachers with 403 (only admins and the
  specific classroom's lead teacher are allowed).
- Reject `:id` and `:childId` that are not valid Mongo ObjectIds with 400.
- Return 404 if the classroom does not exist.
- Return `200 { changed: false, parentPruned: null }` (idempotent) if
  the child is not currently in the classroom.
- On a successful pull, perform in a single classroom update:
  `$pull` of the child id from `Classroom.children[]`, AND — when the
  child's parent has no other child remaining in the classroom — `$pull`
  of that parent id from `Classroom.parents[]`. Separately,
  `$pull` the classroom id from `Child.classrooms[]` on the child
  document.
- NOT mutate any historical `Assessment` or `TeacherAssessment` rows.
  `classroomId` on past recordings stays as-is; the classroom's
  aggregates continue to include that child's prior data.
- Trigger a `classroom-removed` in-app notification for the parent if
  and only if the parent was pruned in this operation
  (see `parent-notifications` capability).

Response on success: `200 { changed: true, parentPruned: <parentId|null> }`.

#### Scenario: Admin removes a child still leaving siblings
- **WHEN** an admin sends `DELETE /api/classrooms/<R>/children/<C>` and
  C's parent P has another child C2 also enrolled in R
- **THEN** the response is `200 { changed: true, parentPruned: null }`
- **AND** R's `children` no longer contains C but still contains C2
- **AND** P is still in R's `parents`
- **AND** no `classroom-removed` notification is created for P

#### Scenario: Lead teacher removes the parent's last child
- **WHEN** the classroom R's lead teacher sends
  `DELETE /api/classrooms/<R>/children/<C>` and C is parent P's only
  child enrolled in R
- **THEN** the response is `200 { changed: true, parentPruned: <P> }`
- **AND** R's `children` no longer contains C
- **AND** R's `parents` no longer contains P
- **AND** C's `classrooms` no longer contains R
- **AND** exactly one `classroom-removed` notification is created for P

#### Scenario: Idempotent on a child that wasn't in the room
- **WHEN** an admin sends DELETE for a child id that is not in R's
  `children`
- **THEN** the response is `200 { changed: false, parentPruned: null }`
- **AND** no state is mutated and no notification is created

#### Scenario: Assistant teacher denied
- **WHEN** the classroom's assistant teacher calls the DELETE endpoint
- **THEN** the response is 403 and no state is mutated

#### Scenario: Unrelated teacher denied
- **WHEN** a teacher who is neither lead nor assistant of R calls the
  DELETE endpoint on R
- **THEN** the response is 403

#### Scenario: Parent denied
- **WHEN** a parent (even an enrolled one) calls the DELETE endpoint
- **THEN** the response is 403

#### Scenario: Past recordings keep their classroom attribution
- **WHEN** C is removed from R via this endpoint
- **AND** C had recorded Assessment rows with `classroomId: <R>`
- **THEN** none of those Assessment rows are mutated or deleted; their
  `classroomId` still equals `<R>`

