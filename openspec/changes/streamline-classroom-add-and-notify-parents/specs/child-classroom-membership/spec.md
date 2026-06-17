## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Admin can manually enroll or remove a child in a classroom

**Reason**: This change collapses the dual-pathway problem on
`/classrooms/:id`. The only sanctioned enrollment path becomes the
renamed "Add Parents" flow, which already enrolls the parent's selected
children atomically and synchronises AccessGrants. The admin-only
direct-child-add path bypassed the parent-side audit trail and the
notification trigger added in this change, so it is removed end-to-end:

- `PATCH /api/classrooms/:id/children` (the `patchClassroomChildren`
  controller and the route) is deleted from the backend.
- The "Add child to classroom" picker on the classroom homepage is
  deleted from the frontend.
- All tests covering this endpoint and its UI are deleted.

**Migration**:
- To enroll a child in a classroom, open `/classrooms/:id`, click
  "Add Parents", select that child's parent, and confirm "Add" — the
  parent will receive an in-app notification.
- To remove a child from a classroom, there is no longer a one-click
  admin path. Pending follow-up: a separate, intentional "Remove from
  classroom" affordance can be designed in a later change. Until then,
  removal happens implicitly via the classroom-deletion cascade.
- Any external integration that called `PATCH /api/classrooms/:id/children`
  MUST switch to `POST /api/classrooms/:id/invite`. No backward-compat
  shim is provided.
