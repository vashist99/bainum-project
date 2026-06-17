## Why

Classroom enrollment today has two overlapping "add" pathways on `/classrooms/:id`
(an admin-only "Add child to classroom" picker + the "Invite Parents" modal),
which confuses admins about which one to use and bypasses the parent-side
visibility that the invite flow already establishes. Parents and teachers also
have no in-app signal when they've been added to a classroom — the only
acknowledgement today is an email (for first-time parent invitations) or
nothing at all (for already-registered parents and for assistant teachers).
We want a single "Add Parents" path that owns enrollment AND surfaces a clear
in-app notification to every user who was just added.

## What Changes

- **BREAKING (UI):** Remove the "Add child to classroom" affordance from
  `/classrooms/:id`. There is no longer a path for an admin to manually add a
  child without going through the parent-invite flow.
- **BREAKING (API):** Remove `PATCH /api/classrooms/:id/children`
  (`patchClassroomChildren`). Any future caller that needs this behavior must
  enroll the parent + child together via `POST /api/classrooms/:id/invite`.
- Rename the existing "Invite Parents" button on `/classrooms/:id` to
  **"Add Parents"** and the modal's confirm button from "Send Invite" to
  **"Add"**. The modal title becomes "Add Parents to Classroom". The underlying
  endpoint and request shape do not change.
- **NEW:** Add a per-child "Remove from classroom" affordance (Trash icon next
  to each child in the classroom children list) visible to admins AND the
  classroom's lead teacher (assistant teachers are excluded, matching the
  "Delete classroom" lineage). Backed by a new RESTful endpoint
  `DELETE /api/classrooms/:id/children/:childId`. When removing a child leaves
  their parent with no remaining children in the classroom, the parent is
  auto-pruned from `Classroom.parents[]` in the same write. Historical
  recordings and assessments are left untouched (their `classroomId` stays
  pointing at this room — past attribution is immutable).
- **NEW:** Persist an in-app notification each time a parent OR teacher
  (lead / assistant) is added to a classroom, OR a parent is removed from a
  classroom, with a 10-day TTL so the entry auto-deletes from MongoDB. Two
  notification types are supported: `"classroom-added"` (click navigates to
  `/classrooms/:id`) and `"classroom-removed"` (click navigates to `/home`,
  since the removed parent no longer has access to the classroom page).
- **NEW:** Render a bell icon in the shared `AppLayout` Navbar that shows a
  badge with the live notification count and opens a dropdown listing the
  user's current notifications. Clicking a notification navigates to
  `/classrooms/:id` for the classroom it refers to.
- **BREAKING (auth):** Extend `findAuthorizedClassroom` so that enrolled
  parents pass authorization for **read** endpoints on a classroom they are
  in. `/classrooms/:id` will render a parent-scoped read-only variant: no
  Add Parents / Delete / Add Child controls, transcripts and assessments
  restricted to that parent's own child(ren), classroom roster shown by
  name only.

## Capabilities

### New Capabilities
- `parent-notifications`: In-app notification model, delivery hook on
  classroom enrollment, 10-day TTL auto-expiry, navbar bell surface with
  click-to-navigate behavior.

### Modified Capabilities
- `classroom-homepage`: "Invite Parents" wording is renamed throughout to
  "Add Parents" / "Add"; the admin "Add child to classroom" sub-section is
  removed; a parent variant of the page is introduced.
- `classroom-management`: `findAuthorizedClassroom` allows enrolled parents
  through for read-only access; `PATCH /api/classrooms/:id/children` is
  removed from the API surface.
- `child-classroom-membership`: The existing requirement that an admin can
  manually enroll or remove a child via `PATCH /api/classrooms/:id/children`
  is removed; the only enrollment path becomes the parent-invite flow. A new
  requirement is added for `DELETE /api/classrooms/:id/children/:childId`
  (admin OR lead teacher), including the parent-auto-prune behavior.
- `app-navigation-shell`: The Navbar shell gains a bell affordance with a
  badge count and dropdown, visible on every authenticated page.

## Impact

**Backend**
- New `Notification` Mongoose model with a TTL index on `expiresAt`.
- `inviteParents` (and any future enrollment writer) emits one notification
  per newly-enrolled recipient (parent + lead teacher + assistant teacher).
- `findAuthorizedClassroom` grows a `mode: "manage" | "read"` return so the
  same authorization check can serve both admin/teacher and enrolled-parent
  callers; `getClassroom`, `getClassroomTranscripts`, and
  `getClassroomAssessments` filter their payloads when `mode === "read"`.
- `patchClassroomChildren` controller + route deleted; replaced by a new
  `removeChildFromClassroom` controller behind
  `DELETE /api/classrooms/:id/children/:childId` (admin OR lead teacher).
  The remove handler `$pull`s the child from `Classroom.children[]` and
  `Child.classrooms[]`; if the parent of that child has no remaining
  children in the classroom, also `$pull`s the parent from
  `Classroom.parents[]` AND emits a `classroom-removed` notification.
- New routes: `GET /api/notifications`, `POST /api/notifications/:id/dismiss`
  (optional manual dismiss), and a small internal helper used by the invite
  writer.

**Frontend**
- `ClassroomHomePage.jsx`: drop the `showAddChildPicker` / `addingChildId`
  state and the entire add-child sub-block; rename strings; branch on
  `classroom.role === "parent"` to render the parent variant of the page.
  In manage mode, add a Trash button next to every child in the classroom
  children list visible to admins + the lead teacher, wired to a
  confirmation modal and the new DELETE endpoint.
- `ClassroomInviteModal.jsx`: rename title and confirm button copy.
- `AppLayout` (or `Navbar.jsx`): add `<NotificationBell />` next to the
  user menu; fetches `/api/notifications` on mount and after navigation;
  renders a count badge + dropdown list with click-to-navigate items.
- New shared component `NotificationBell.jsx` + dropdown.
- New axios helpers / hooks.

**Other**
- Existing classroom recordings, transcript retention, and per-child
  recording fan-out are not touched.
- The email-based parent invitation flow is not touched — we only add an
  in-app notification on top of it.
- Existing data is unaffected; the `Notification` collection is empty at
  rollout and only newly enrolled users see notifications.
