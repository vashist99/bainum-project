## Context

Today, `/classrooms/:id` has two add-paths that confuse admins and bypass the
parent-side audit trail of the invite flow:

1. **Admin-only "Add child to classroom"** picker — calls
   `PATCH /api/classrooms/:id/children` with `{ addChildId }` and mutates only
   `Classroom.children[]` + `Child.classrooms[]`. The parent is never told.
2. **"Invite Parents"** modal — calls `POST /api/classrooms/:id/invite` which
   enrolls the parent AND their selected children, syncs AccessGrants, and
   covers the privacy/visibility model end-to-end. The parent still isn't
   told in-app (only an email goes out for un-onboarded parents).

There is no `Notification` model, no notification UI, and no parent-side view
of `/classrooms/:id` — `findAuthorizedClassroom` returns 403 to parents via
`canManageClassroom`. Parents currently only see classroom membership
indirectly through `/child/:id` (ChildDataPage shows the classroom name).

Stakeholders: admins (manage classrooms), lead/assistant teachers (notified
on assignment), parents (notified on enrollment, navigate to a read-only
classroom view).

## Goals / Non-Goals

**Goals:**
- Collapse classroom enrollment to a single path (the renamed "Add Parents"
  flow) and surface every successful enrollment as a clickable in-app
  notification on the recipient's navbar bell.
- Persist notifications in MongoDB with a 10-day TTL so the database is
  self-cleaning and the notification history stays small.
- Let an enrolled parent click their notification and land on a useful,
  privacy-respecting read-only variant of `/classrooms/:id`.
- Keep the change additive at the data layer (new collection only) and
  removal-only at the API layer (drop one endpoint).

**Non-Goals:**
- Read/unread tracking. Per the user choice, notifications simply exist for
  10 days and then disappear. We do not store a `readAt` timestamp or
  decorate the bell badge with "unread" vs "total".
- Real-time push (WebSocket / SSE). The bell refetches `/api/notifications`
  on mount, on navigation, and on an opt-in 60-second focus refresh; no
  push channel is added.
- Notifications for events other than classroom enrollment (e.g. recording
  uploads, transcript expiry). Out of scope for this change; the model is
  extensible (`type` field), but only the `classroom-added` type is wired up.
- Parent write access to `/classrooms/:id`. Read-only only.
- Touching the email invitation flow (`Invitation` model, Brevo send) —
  in-app notification is additive on top of it.
- Retroactive notifications for parents already enrolled at rollout time.

## Decisions

### D1 — Single `Notification` collection with TTL, not per-user inbox arrays

We add a top-level `Notification` Mongoose model:

```js
{
  recipientId: ObjectId,      // indexed; the User/Teacher/Parent _id
  recipientRole: String,      // "parent" | "teacher" | "admin" — denormalized for fast filtering
  type: String,               // "classroom-added" (only kind for now)
  classroomId: ObjectId,      // populated for classroom-added; future types may use other fields
  classroomName: String,      // denormalized snapshot at creation time
  message: String,            // pre-rendered "You have been added to a classroom: '<name>'"
  createdAt: Date,            // defaults to now
  expiresAt: Date,            // createdAt + 10d; TTL index expires:0 on this field
  // (no readAt, no dismissed flag — per non-goals)
}
```

`expiresAt` carries a `{ expireAfterSeconds: 0 }` MongoDB TTL index, so the
server auto-purges 10-day-old rows on its TTL sweep (runs every ~60s).

**Why not embed in User.notifications[]?** Per-user array notifications make
the TTL index impossible (TTL works on documents, not array elements) and
balloon the User document with churning data. A separate collection keeps
recipient documents stable.

### D2 — Notification fan-out happens at every classroom-membership write

There are now three sites that mutate classroom membership and trigger
fan-out, all sharing the same `fanOutClassroomNotifications` helper:

- **`inviteParents`** (add path): emit `classroom-added` for every
  newly-added parent (those whose `parents` membership in `Classroom` was
  not already present at write time — we compute the delta from the
  pre-image we fetched). ALSO emit `classroom-added` for the lead and
  assistant teacher **only when this is the first time they are added to
  this classroom** — see idempotency rule below.
- **`createClassroom`** (assign path): emit `classroom-added` to the
  newly-assigned lead and (if set) assistant teacher.
- **`removeChildFromClassroom`** (remove path; see D7): when the removal
  prunes the last enrollment a parent had in this room, emit
  `classroom-removed` to that parent. The teachers are NOT notified on
  per-child removal (the room itself isn't going away, only one
  enrollment).

Teacher idempotency: we check `Notification` itself with
`{ recipientId: tid, classroomId, type: 'classroom-added' }`. If a row
exists (even an unexpired one within the TTL window), we skip. This is
idempotent enough for the 10-day window and avoids spamming teachers
across repeated invites.

Parent re-notify-on-readd is intentional: if a parent is removed and
later re-added, we WANT a fresh `classroom-added` event for them; the
prior `classroom-added` row (if not already TTL-purged) is left alone.

Notification creation is wrapped in a try/catch — a notification write
failure must not roll back the membership write.

### D3 — Endpoint removal vs deprecation

`PATCH /api/classrooms/:id/children` and the controller
`patchClassroomChildren` are deleted entirely (route, handler, tests).
The user confirmed they want both removed. The add-half of its
functionality is now served exclusively by `inviteParents`; the
remove-half is replaced by the new RESTful endpoint introduced in
D7 (`DELETE /api/classrooms/:id/children/:childId`). Risks:

- A live mobile client or external integration relying on the old
  PATCH endpoint would break. Mitigation: this is an internal app with
  one frontend; `rg` confirms the only caller is the admin "Add child"
  picker we are removing.
- Existing E2E tests touching the PATCH endpoint must be deleted, not
  skipped.

### D4 — Parent read-only access to `/classrooms/:id`

`findAuthorizedClassroom` is refactored to return `{ classroom, mode }`
where `mode` is `"manage"` for admin / lead / assistant teacher, and
`"read"` for an enrolled parent (the user's `_id` appears in
`classroom.parents[]`). Anyone else continues to get 403.

Each handler that uses `findAuthorizedClassroom` then chooses its policy:

| Endpoint | Manage mode | Read mode |
|---|---|---|
| `GET /api/classrooms/:id` | Full payload | Full payload BUT `children` filtered to the parent's own child ids; `parents` omitted; `role: "parent"` |
| `GET /api/classrooms/:id/transcripts` | All recordings | Recordings filtered to those whose `childId` is one of the parent's children OR `source === "teacher"` (room-wide teacher recordings stay visible) |
| `GET /api/classrooms/:id/assessments` | All assessments | Filtered to parent's own children only |
| `GET /api/classrooms/:id/eligible-parents` | Allowed | **403** in read mode (parents can't see who else is invitable) |
| `POST /api/classrooms/:id/invite` | Allowed | **403** |
| `DELETE /api/classrooms/:id` | Lead/admin only (unchanged) | **403** |
| `PATCH /api/classrooms/:id/children` | (removed entirely) | — |

The frontend `ClassroomHomePage.jsx` branches on the returned
`classroom.role`:
- `manage`: existing layout, minus the deleted Add child block, with the
  renamed Add Parents button.
- `parent`: hides the Add Parents button, the Delete classroom button,
  and the "Add child" picker (which is gone anyway); the transcript /
  recording sections render only the filtered subset returned by the
  backend.

**Why not a separate `/my-classrooms/:id` route?** Two routes duplicate
auth + layout work. A single route with a role-branched layout reuses
all the recording / chart / transcript components and matches the
notification's direct link.

### D5 — Notification bell in `AppLayout` Navbar

A new `NotificationBell` component is mounted next to the user menu in the
existing `Navbar.jsx`. Behavior:

- On mount and on `useLocation` change, fetch `GET /api/notifications`
  → returns the caller's active notifications (max 50, sorted by
  `createdAt desc`).
- Badge: count = `notifications.length` (no "unread" filter — see D1).
  Hidden if zero.
- Click on bell: opens a dropdown listing each notification's message +
  relative time ("2 minutes ago"). Click on a row: navigates to
  `/classrooms/${classroomId}` and closes the dropdown.
- A small "Dismiss" X on each row calls `POST /api/notifications/:id/dismiss`
  which hard-deletes that single row (also via the same endpoint we use
  for "clear all"). Dismiss is opt-in convenience; the 10-day TTL is the
  guarantee.

**Why not also poll on a timer?** Refetching on every route change is enough
for the volumes we expect (worst case a few hundred parents enrolled per
day across the whole system). A timer-based poll can be added later without
breaking changes.

### D6 — Route protection extension is the only auth-model risk

Allowing parents into `/api/classrooms/:id` is the single most invasive
change. We mitigate by:

- Whitelisting only the **read** endpoints listed in the D4 table.
- Filtering payload server-side; clients never receive other children's
  identifiers in `parent` mode.
- A new unit test for `findAuthorizedClassroom` covering each role × each
  mode combination.

### D7 — Remove-from-classroom flow

A new RESTful endpoint `DELETE /api/classrooms/:id/children/:childId` lives
in `classroomController.js` as `removeChildFromClassroom`. Behavior:

**Authorization.** Admin OR the classroom's lead teacher (assistant
teachers excluded — matches the "Delete classroom" lineage). Anyone else
gets 403. Parents always get 403. We re-use `findAuthorizedClassroom`
to fetch and authorize the room, then check `user.role === "admin" ||
String(user.id) === String(classroom.teacher._id)` for the per-handler
restriction.

**Atomicity.** A single `Classroom.updateOne` issues the membership
mutation:

1. `$pull` the child id from `Classroom.children[]`.
2. Compute `parentToPrune`: the parent (in `Classroom.parents`) whose
   `childIds` no longer intersects the post-pull `Classroom.children[]`
   for this classroom. We do this in app code BEFORE the `$pull` (using
   the populated `parents` and `children` from `findAuthorizedClassroom`)
   to avoid a follow-up round trip.
3. If `parentToPrune` exists, include `$pull: { parents: parentToPrune }`
   in the same update.
4. Separately: `Child.updateOne({ _id: childId }, { $pull: { classrooms: id } })`.

The two updates are not in a transaction (the rest of the codebase
doesn't use Mongo transactions); on partial failure the worst case is a
brief `Child.classrooms` referencing a classroom whose `children` no
longer contains it — already a tolerated drift mode in the recording
fan-out (see `getSupervisedChildrenForTeacher`).

**Historical recordings.** `classroomId` on existing `Assessment` and
`TeacherAssessment` rows is left untouched. The classroom's
aggregated charts and `getClassroomTranscripts` continue to surface
that child's past recordings. Rationale: history is immutable and the
classroom-deletion cascade is the only place we null these out.

**AccessGrant cleanup.** If `parentToPrune` happens AND no other
classroom links that parent with the lead/assistant teachers, the
parent-teacher AccessGrant could in principle be revoked. We do NOT
do this in this change: revoking grants without a comprehensive sweep
risks dropping access from older shared classrooms / direct grants.
Re-call `syncAccessGrantsForParentTeacherPair` is a no-op when the
parent-teacher relationship still has any basis. Acceptable for now.

**Removal notification.** When `parentToPrune` is set, emit a
`classroom-removed` notification with `message: 'You have been removed
from classroom: "<name>"'` and `classroomId` set. Per-child removals
that do NOT prune the parent do NOT emit a notification (the parent
still has another child in the room).

**Click-target divergence.** The bell already routes
`classroom-added` notifications to `/classrooms/<classroomId>`. For
`classroom-removed` notifications the destination is `/home` instead:
the parent no longer has access to the classroom page (would 403), and
`/home` is the safe landing where they can see their remaining
enrolled rooms. The bell switches on `notification.type` to choose
the destination.

**Response shape.** 200 with
`{ changed: true, parentPruned: <id|null> }` on success;
`{ changed: false }` (idempotent) if the child wasn't in the classroom;
404 if the classroom or child doesn't exist; 400 if `:childId` is not
a valid ObjectId; 403 / 401 per the auth rules above.

## Risks / Trade-offs

- [TTL doesn't fire instantly] → MongoDB's TTL monitor runs every ~60s.
  A user could see a notification linger up to one extra minute past the
  10-day mark. Acceptable.
- [Bell badge over-counts after the user clicks but before TTL fires] →
  Without read/unread tracking (per D1), the badge keeps showing the
  notification until the user manually dismisses or TTL fires. Add the
  "Dismiss X" affordance in D5 to give users an out.
- [Teacher gets re-notified after their first notification's TTL expired] →
  D2's "skip if existing notification" check uses the live `Notification`
  collection, which auto-purges. If a teacher is added, the notification
  expires after 10d, and then they're re-added 11d later, they get a
  second notification. This is actually desirable behavior (re-onboarding
  is a real event), so we accept it.
- [Parent read-only `/classrooms/:id` reveals classroom name to the parent
  via the URL] → URL already contains the classroom id, and the parent
  needs the name to make sense of the page. Not a regression.
- [Removed `PATCH /:id/children` breaks an external integration we don't
  know about] → Code search shows no external callers. Accepted.
- [Notification fan-out on classroom creation creates a "Welcome" effect
  for the creating teacher] → The lead teacher creating their own classroom
  will see "You have been added to a classroom: '<own classroom>'", which
  is slightly redundant. We accept it for consistency; the alternative
  (skip if `recipientId === req.user.id`) adds branching with no real
  benefit.
- [Per-child remove without a transaction can leave drift] → If the
  `Classroom.updateOne` succeeds but `Child.updateOne` fails, the child
  is gone from the room's `children[]` but their `Child.classrooms[]`
  still mentions it. Recording fan-out already tolerates this via the
  defensive intersection in `getSupervisedChildrenForTeacher`. We
  log + return 500 if the second update fails; an admin can retry.
- [AccessGrants linger after a removed parent] → A parent removed from
  the only classroom they shared with a teacher would, strictly, no
  longer need that teacher's AccessGrant. We intentionally do NOT
  revoke grants in this change (see D7). Risk: parents who left a
  classroom retain "linked teacher" status until the grant is otherwise
  cleared. Mitigation: cheap follow-up change can add a grant-prune
  sweep when the user comes back to it.

## Migration Plan

1. Backend ships first with `Notification` model + TTL index +
   notification helper + updated `inviteParents` + new
   `/api/notifications` routes + updated `findAuthorizedClassroom`. The
   old `PATCH /:id/children` route is removed in the same backend
   release; until the frontend ships, the admin "Add child" button will
   show a toast on click. Acceptable for a short interval.
2. Frontend ships next: removes the Add child UI, renames Invite →
   Add Parents, adds the bell, and ships the parent-variant page.
3. Rollback: revert both repos to their pre-change commits; the new
   `notifications` MongoDB collection becomes orphaned but harmless
   (the TTL index will continue draining it to empty).

## Open Questions

None — all five design questions were answered up front
(notification surface = navbar bell, persistence = 10d TTL,
click target = extend parent access to `/classrooms/:id`,
rename = "Add Parents", teachers also notified, endpoint removed).
