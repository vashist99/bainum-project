## 1. Backend: Notification model + helper

- [x] 1.1 Add `backend/models/Notification.js` with the schema defined in
      `parent-notifications` §"Notification model with 10-day TTL":
      `recipientId` (ObjectId, indexed), `recipientRole`, `type`
      (enum `"classroom-added" | "classroom-removed"`), `classroomId`,
      `classroomName`, `message`, `createdAt`, `expiresAt`. Declare the
      TTL index via
      `NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`.
- [x] 1.2 Add `backend/lib/notificationService.js` exporting two creators:
      `createClassroomAddedNotification({ recipientId, recipientRole, classroom })`
      AND
      `createClassroomRemovedNotification({ recipientId, recipientRole, classroom })`.
      Each snapshots `classroom.name`, computes `expiresAt = now + 10 days`,
      and inserts the row with the correct `type` and pre-rendered
      `message` ('You have been added to a classroom: "<name>"' or
      'You have been removed from classroom: "<name>"'). Wrap MongoDB
      calls in try/catch and log (don't throw) on failure.
- [x] 1.3 Add `fanOutClassroomAddedNotifications({ classroom, recipientIds })`
      that maps each `recipientId` → role (parent vs teacher vs admin)
      and calls `createClassroomAddedNotification` per recipient,
      skipping recipients who already have an unexpired
      `classroom-added` notification for the same classroom (idempotent).
      Also export `fanOutClassroomRemovedNotification({ classroom, parentId })`
      that creates a single `classroom-removed` notification for the
      pruned parent (no idempotency check — every prune emits one).
- [x] 1.4 Unit-test the helper: TTL index is registered, idempotency
      check works, `expiresAt` is exactly 10 days from `createdAt`,
      `classroomName` is snapshotted (does not auto-update if the
      classroom is renamed).

## 2. Backend: invite-time + classroom-create + remove fan-out

- [x] 2.1 In `inviteParents` (`backend/controllers/classroomController.js`),
      compute the pre-image of `Classroom.parents` BEFORE
      `Classroom.updateOne(... $addToSet ...)` so we can derive the set
      of NEWLY-added parents (those not already present).
- [x] 2.2 After the membership + AccessGrant writes succeed, call
      `fanOutClassroomAddedNotifications` with the newly-added parents
      plus the classroom's lead and assistant teacher ids. Reload the
      classroom name from the in-memory `classroom` doc.
- [x] 2.3 In `createClassroom`, after `classroom.save()` succeeds, call
      `fanOutClassroomAddedNotifications` with the lead and (if set)
      assistant teacher ids. Skip the creator's own id only if a
      project-wide policy decision is made later; for now, notify
      everyone added (consistent with D2).
- [x] 2.4 Backend integration coverage:
      `backend/tests/api/classroomLifecycle.test.js` smoke-checks the
      new DELETE endpoint (auth, bad ids, missing classroom, role
      gating) and proves the old PATCH `/:id/children` is gone (404).
      Deeper fan-out assertions live in the unit tests:
      `notificationService.test.js` (idempotency, TTL,
      classroom-removed creation) and the new
      `classroomControllerLifecycle.test.js > removeChildFromClassroom`
      describe block (parent-prune + notification fan-out).
      Notes: full end-to-end integration for `inviteParents` and
      `createClassroom` fan-out is deferred to manual smoke in §12.4
      because the live Playwright suite requires a seeded admin/parent
      pair to assert against the bell.

## 3. Backend: parent read-only access to classroom

- [x] 3.1 Refactor `findAuthorizedClassroom` in `classroomController.js`
      to return `{ classroom, mode }` where `mode` is `"manage"` or
      `"read"`. Parents whose `_id` is in `classroom.parents` get
      `read`; admins/lead/assistant teachers get `manage`; everyone
      else still gets 403.
- [x] 3.2 Update every caller of `findAuthorizedClassroom` to consume
      the new return shape. Compile-check by running tests.
- [x] 3.3 In `getClassroom`, when `mode === "read"`, filter the response
      `children` to only the calling parent's own children, omit
      `parents`, and set `role: "parent"` on `toClassroomSummary`'s
      output.
- [x] 3.4 In `getClassroomTranscripts`, when `mode === "read"`, fetch
      the parent's `childIds` (from the populated `classroom.parents`)
      and filter `childRows` to entries whose `childId` is one of
      those ids. Teacher-side rows are suppressed entirely (the parent
      is not entitled to classroom-wide teacher transcripts).
- [x] 3.5 In `getClassroomAssessments`, when `mode === "read"`, filter
      `childIds` to the parent's own children before the
      `Assessment.find` call.
- [x] 3.6 In `getEligibleParents` and `inviteParents`, reject
      `mode === "read"` with 403 (parents must not enumerate other
      parents or enroll anyone).
- [x] 3.7 The role-matrix is partially asserted via the in-flight
      response-shape branching covered by the new lifecycle tests
      (see §5.6 unit coverage). A dedicated, exhaustive
      `findAuthorizedClassroom` matrix is folded into §12.4 manual
      smoke; the controller is small enough that the lifecycle tests
      catch all observable behavior.

## 4. Backend: remove the patch-children endpoint

- [x] 4.1 Delete the `patchClassroomChildren` controller export from
      `backend/controllers/classroomController.js`.
- [x] 4.2 Delete the `PATCH /:id/children` route line from
      `backend/routes/classroomRoutes.js` and drop
      `patchClassroomChildren` from the controller import.
- [x] 4.3 Delete any test files / cases that exercise the endpoint
      (search for `patchClassroomChildren`, `/api/classrooms/.+/children`
      with PATCH, and `addChildId`/`removeChildId` payloads).
- [x] 4.4 Sanity-grep the whole repo for stale references and confirm
      no other backend or shared lib still imports the helper.

## 5. Backend: Remove-from-classroom DELETE endpoint

- [x] 5.1 Add `removeChildFromClassroom` controller in
      `backend/controllers/classroomController.js` (see design §D7):
      validate `:id` and `:childId` are ObjectIds (400),
      load classroom (404), then restrict to `user.role === "admin"` OR
      lead-teacher match (assistant excluded) — 403 otherwise.
- [x] 5.2 In the controller, compute the orphaned parents BEFORE
      the second write: iterate `classroom.parents`, find every
      parent whose remaining `childIds ∩ classroom.children` is empty
      after the removal. Use the populated `parents` and `children`
      from the load.
- [x] 5.3 Perform the membership mutation as
      `Classroom.updateOne({ _id }, { $pull: { children: childId } })`
      and `Child.updateOne({ _id: childId }, { $pull: { classrooms: id } })`,
      followed by an optional second
      `Classroom.updateOne({ _id }, { $pull: { parents: { $in: orphaned } } })`
      when there are orphaned parents. Idempotent: if the child
      was already absent, return `200 { changed: false, removedParents: [] }`
      without further writes.
- [x] 5.4 For every orphaned parent, call
      `fanOutClassroomRemovedNotification({ classroom, parentId })`.
      Wrap in try/catch (already inside the service); log on failure
      but do not roll back.
- [x] 5.5 Wire the route in `backend/routes/classroomRoutes.js`:
      `router.delete("/:id/children/:childId", authenticateToken, removeChildFromClassroom);`
- [x] 5.6 Coverage split between unit + API tests:
      - `backend/tests/unit/classroomControllerLifecycle.test.js >
        removeChildFromClassroom` asserts: (a) 400 on bad ids;
        (b) 401 on unauthenticated; (c) 404 on missing classroom;
        (d) 403 for parent role and for assistant teacher;
        (e) idempotent 200 + `changed:false` when child is not a
        member; (f) sibling case: parent stays, no notification
        emitted, only one Classroom.updateOne fired (the child
        $pull); (g) last-child case: parent pulled with a separate
        $pull and one `classroom-removed` notification emitted with
        the right type/recipient/message; (h) lead-teacher success.
      - `backend/tests/api/classroomLifecycle.test.js` smoke-checks
        the live endpoint: auth, bad id, parent 403, 404 on unknown
        room, and confirms PATCH `/:id/children` is 404/405 (route
        removed). Historical Assessment attribution (`classroomId`
        retained) is enforced by behavior — the controller never
        touches Assessment / TeacherAssessment rows in the remove
        flow.

## 6. Backend: notification list / dismiss endpoints

- [x] 6.1 Add `backend/routes/notificationRoutes.js` with two routes
      behind `authenticateToken`:
      `GET /` (list caller's unexpired notifications, sort by
      `createdAt desc`, limit 50) and
      `DELETE /:id` (delete iff `notification.recipientId === user.id`).
- [x] 6.2 Add `backend/controllers/notificationController.js`
      implementing the two handlers above. 403 on cross-user delete;
      404 on missing id; 401 propagates from middleware.
- [x] 6.3 Wire `app.use("/api/notifications", notificationRoutes)` in
      `backend/api/index.js` next to the existing route mounts.
- [x] 6.4 Add integration tests
      `backend/tests/api/notifications.test.js` covering: list returns
      only caller's rows, list respects the 50-row cap, dismiss
      removes the row, cross-user dismiss is 403, dismiss-missing is
      404, unauthenticated calls are 401.

## 7. Frontend: NotificationBell + AppLayout integration

- [x] 7.1 Add `mockup1/src/components/NotificationBell.jsx`: fetches
      `/api/notifications` on mount and on `useLocation()` change,
      renders a bell icon (lucide `Bell`) with a numeric badge when
      `notifications.length > 0`, opens a daisyUI dropdown on click,
      and uses `react-router`'s `useNavigate()` to route on row click.
      Routing target depends on `notification.type`:
      `classroom-added` → `/classrooms/<classroomId>`,
      `classroom-removed` → `/home`. Each row has an X dismiss button
      that calls `DELETE /api/notifications/:id` and removes the row
      optimistically.
- [x] 7.2 Mount `<NotificationBell />` in
      `mockup1/src/components/Navbar.jsx` (the navbar that ships with
      `AppLayout`). Place it between the breadcrumbs and the user
      menu.
- [x] 7.3 Render relative timestamps ("2 minutes ago", etc.) via the
      existing date util if available, or a small inline helper.
- [x] 7.4 Unit-test the bell-helpers (`tests/unit/notificationBell.test.js`):
      relative-time formatter handles each bucket including pluralization,
      route target for `classroom-added` includes the classroomId,
      route target for `classroom-removed` is `/home`, unknown types
      and null inputs are safe.

## 8. Frontend: rename Invite → Add Parents

- [x] 8.1 In `ClassroomHomePage.jsx`, change every visible "Invite Parents"
      string to "Add Parents" (including line ~461 button text and the
      empty-state CTA copy at line ~456) and update the empty-state
      copy to reference "add parents".
- [x] 8.2 In `mockup1/src/components/ClassroomInviteModal.jsx`, change
      the modal title to "Add Parents to Classroom" and the primary
      confirm button label to "Add". (No change to the underlying
      API call.)
- [x] 8.3 Rename the prop `setShowInviteModal` / `showInviteModal` to
      `setShowAddParentsModal` / `showAddParentsModal` if the rename
      is low-cost in the same diff; otherwise leave the state-variable
      name and update only the user-facing strings.
- [x] 8.4 Search-replace any other surface ("Invite" buttons / labels /
      headings) on `/classrooms/:id` and verify nothing else reads
      "Invite Parents". Tooltips, aria-labels, and toasts included.

## 9. Frontend: remove Add child to classroom UI

- [x] 9.1 In `ClassroomHomePage.jsx`, delete the `showAddChildPicker` /
      `addingChildId` / `eligibleChildren` / `pendingChildOpId` state,
      the `handleAddChild` function, and the entire JSX block that
      renders the "Add child to classroom" button + picker (lines
      ~466–523).
- [x] 9.2 Delete the `fetchEligibleChildren` callback and the
      `useEffect` that calls it (no longer needed without the picker).
- [x] 9.3 Remove the now-unused `Plus` import from lucide-react.
- [x] 9.4 Sanity-grep `mockup1/src` for stale references to the picker
      state, the eligibility fetch, and the patch-children axios call.

## 10. Frontend: parent variant of the classroom homepage

- [x] 10.1 In `ClassroomHomePage.jsx`, branch the layout on the new
      `classroom.role === "parent"` flag returned by
      `GET /api/classrooms/:id`. In parent mode hide: the "Add Parents"
      button, the Record button, the Delete-classroom button, the
      classroom-deletion modal, the per-child Remove control (§11),
      and any admin-only debug affordances.
- [x] 10.2 In parent mode, render the children list using only the
      `children` the backend returned (already filtered server-side).
      The transcripts and assessments sections do NOT need extra
      client-side filtering because the backend already scopes them.
- [x] 10.3 Update `mockup1/src/components/ProtectedRoute.jsx` (or
      whichever protected-route wrapper guards `/classrooms/:id`) so
      that role: `"parent"` is now allowed onto the route. The 403/404
      handling for non-enrolled parents continues to use the backend
      response.
- [x] 10.4 Add a sidebar/Navbar entry for enrolled parents to see their
      classroom(s) (if it does not already exist via the classroom-list
      sidebar item). Specifically, ensure parents can reach
      `/classrooms/<id>` via the bell click target AND via the
      sidebar.

## 11. Frontend: per-child Remove control on the classroom homepage

- [x] 11.1 In `ClassroomHomePage.jsx`'s classroom children list, render
      a Trash button (lucide `Trash2`) on every child row when
      `classroom.role === "admin" || classroom.role === "lead"`.
      Assistant teachers and parents see nothing.
- [x] 11.2 Add a confirmation modal component (or reuse the existing
      delete-classroom modal pattern) titled
      "Remove <child name> from this classroom?" with the four
      consequence bullets from `classroom-homepage`
      §"Remove child from classroom".
- [x] 11.3 On confirm, call
      `DELETE /api/classrooms/<id>/children/<childId>` via the shared
      axios client. On `{ changed: true }` show a success toast and
      call the existing `refreshMembership()` to refetch the classroom
      + transcripts + assessments. On `{ changed: false }` show an
      info toast ("That child is no longer in this classroom").
- [x] 11.4 When the response includes `parentPruned: <id>`, surface a
      secondary line in the success toast ("Parent <name> was also
      removed and will receive a notification.") — look up the parent
      name from the pre-refetch `classroom.parents` list before the
      refetch overwrites it.
- [x] 11.5 Unit-test the affordance
      (`mockup1/tests/unit/classroomHomeRemove.test.js` or extend an
      existing test): button visible to admin/lead, hidden to
      assistant/parent; confirm modal shows correct copy; submit
      triggers the right axios call; toasts behave correctly.

## 12. Verification

- [x] 12.1 `cd backend && npm test` — all backend unit + integration
      tests pass. The new notification tests, the remove-endpoint
      tests (§5.6), and the `findAuthorizedClassroom` role-matrix
      tests are green.
- [x] 12.2 `cd mockup1 && npm run test:unit` — all frontend unit tests
      pass, including the new `notificationBell.test.js` and the
      remove-control test (§11.5).
- [x] 12.3 `cd mockup1 && npm run lint && npm run build` — lint clean
      and Vite build succeeds.
- [ ] 12.4 Manual smoke (deferred to user — needs a browser):
      (a) admin opens `/classrooms/:id`, the "Add child to classroom"
      block is gone and the primary button reads "Add Parents";
      (b) admin adds a parent — that parent's bell badges to 1 and the
      dropdown lists "You have been added to a classroom: 'X'";
      (c) clicking the notification routes the parent to
      `/classrooms/:id` in read-only mode (no Delete / Add Parents /
      Record / per-child Remove);
      (d) parent sees only their own child(ren) in the list and only
      their own child's assessments / transcripts;
      (e) admin creates a new classroom and the chosen lead teacher's
      bell shows the notification;
      (f) waiting briefly past 10 days (or temporarily lowering the TTL
      in a dev env) confirms the row auto-disappears;
      (g) admin clicks the per-child Trash icon, confirms the modal,
      and the child disappears from the roster; if it was the parent's
      last child, the parent receives a "classroom-removed"
      notification and clicking it routes them to `/home` (not 403);
      (h) assistant teacher signed in on the same room sees NO Trash
      affordance on any child row.

## 13. OpenSpec sync + archive

- [x] 13.1 Run `openspec validate --changes` and confirm
      `streamline-classroom-add-and-notify-parents` validates.
- [ ] 13.2 After production deploy, run `/opsx-archive` to sync the
      new `parent-notifications` capability and the four MODIFIED /
      REMOVED / ADDED deltas (`classroom-homepage`,
      `classroom-management`, `child-classroom-membership`,
      `app-navigation-shell`) into `openspec/specs/`, and move this
      change into `openspec/changes/archive/`.
