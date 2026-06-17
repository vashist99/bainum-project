## Why

`add-classrooms` introduced the Classroom entity and shifted the homepage
from "stat cards" to "classroom cards", but the rest of the data model and
the transcripts UX still live in the pre-classroom world:

- A classroom can be created but never **deleted**, so test/demo
  classrooms accumulate and a teacher who is mis-assigned has no way out
  short of an admin database edit.
- `Child.leadTeacher` is still a free-form **name string** even though
  every child is now meaningfully "in" one or more classrooms via the
  parent-invitation flow. The string is brittle (cosmetic drift, name
  changes break recording fan-out) and represents nothing the user can
  edit consistently.
- A classroom recording has no surface that lists its own **transcripts**
  on the classroom homepage; admins/parents who want to read or export
  the raw text have to navigate to each child's page individually.
- Transcripts of every kind are purged after **30 days**, which is too
  short for educators reviewing progress over a school year. Item 4
  asks for a **calendar year** of retention on the classroom side, and
  it makes no sense to keep child-side and teacher-side transcripts on
  a 30-day clock while classroom transcripts last 12×.

This proposal closes those gaps as a single coherent evolution because
they're all about the classroom-as-system-of-record and the lifecycle of
the data attached to it.

## What Changes

1. **Delete classroom flow.**
   - New `DELETE /api/classrooms/:id` endpoint.
   - UI: a "Delete Classroom" button on the classroom homepage, visible
     to admins and the classroom's lead teacher.
   - Cascade rules: removes the classroom and any `Child.classrooms[]`
     references to it; nullifies the `classroomId` reference on any
     historical `Assessment` / `TeacherAssessment` rows but does NOT
     delete those rows (per-child progress history is preserved);
     **hard-deletes** any *pending* classroom invitations targeting this
     classroom (no audit trail kept); leaves `Teacher`, `Child`, and
     `Parent` documents otherwise untouched.
   - **BREAKING**: classroom deletion is irreversible; UI shows a confirm
     dialog with the explicit list of affected records.

2. **Child membership becomes classroom-driven.**
   - Add `Child.classrooms: [ObjectId ref Classroom]`.
   - **BREAKING**: remove `Child.leadTeacher: String` from the schema in
     favor of deriving "the teacher(s) who supervise this child" from
     the classrooms the child belongs to. A `Child.leadTeacher_deprecated`
     read-only field is kept for one release for inspection only.
   - `Child.classrooms` is populated automatically when a parent
     **accepts** a classroom invitation that includes that child. It is
     pruned automatically when the parent is removed from the classroom,
     when the child is removed from the parent's selection, or when the
     classroom is deleted.
   - **Admin override**: admins (only) gain an `Add child` / `Remove
     child` affordance on the classroom homepage backed by
     `PATCH /api/classrooms/:id/children`, so they can fix
     mis-enrollments, move a child between classrooms, or set up demo
     data without a full parent-invitation cycle. The same-center rule
     still applies. Lead and assistant teachers do NOT get this
     affordance — parent invitation remains the consent path for
     teacher-driven enrollment.
   - Admin and teacher UIs no longer ask for a lead teacher when adding
     a child; that linkage is established by the classroom invite flow
     (or by an admin override).
   - Recording fan-out (`getSupervisedChildrenForTeacher`) reads from
     `Classroom.children[]` rather than `Child.leadTeacher`.

3. **Classroom-scoped transcripts section.**
   - The classroom homepage gains a **Transcripts** card listing every
     classroom recording (TeacherAssessment + each fanned-out
     Assessment), most recent first.
   - The card shows date, activity badge, audio length, total + per-
     category WPM, and the transcript text with the same RAG highlighting
     used elsewhere.
   - A **Download as Excel** button exports an `.xlsx` workbook with
     two sheets:
     - *Recordings*: one row per recording with date, uploaded-by,
       activity, audio length, total word count, total WPM, and — per
       category — both the word count and the WPM (science words,
       science WPM, social-emotional words, social-emotional WPM,
       literacy words, literacy WPM, language words, language WPM).
     - *Transcripts*: one row per recording with date, uploaded-by,
       activity, and the full transcript text.
   - Implemented client-side with `exceljs` so no new backend endpoint
     is required for the export; the underlying transcripts come from
     a new `GET /api/classrooms/:id/transcripts` that already gates on
     classroom membership.

4. **Transcript retention extended from 1 month to 1 calendar year.**
   - **BREAKING**: every newly created `Assessment` and
     `TeacherAssessment` sets `transcriptExpiresAt` to *one year* after
     the recording date (today: one month). The purge job is unchanged
     — it still wipes transcript text + RAG segments once the date
     passes — so the storage savings semantics stay the same, just on
     a 12× longer window.
   - Historical rows are *not* re-stamped (we don't move their dates
     forward retroactively), so anything created before this change
     still purges on its original 1-month schedule. New rows get the
     full year automatically.
   - A single helper (`backend/lib/transcriptRetention.js`) centralizes
     the rule so future changes only edit one constant.

## Capabilities

### New Capabilities

- `classroom-lifecycle`: deletion endpoint and authorization, cascading
  rules (children, recordings, invitations) when a classroom is removed.
- `child-classroom-membership`: `Child.classrooms` field semantics,
  parent-invitation-driven enrollment, removal of `Child.leadTeacher`,
  and how recording fan-out resolves children for a teacher.
- `transcript-retention`: the rule that every newly created assessment
  transcript persists for one year from the recording date, where the
  retention constant lives, and how the existing purge job interacts
  with it.

### Modified Capabilities

- `classroom-homepage`: add the Transcripts card and the Excel download
  to the existing classroom homepage requirements introduced by
  `add-classrooms`.

## Impact

- **Backend**
  - `backend/models/Classroom.js`: no schema change (already has
    `children[]`, `parents[]`).
  - `backend/models/User.js` (`childSchema`): add `classrooms: [ObjectId]`,
    deprecate `leadTeacher`.
  - `backend/lib/teacherChildHelpers.js`: switch
    `getSupervisedChildrenForTeacher` to read classroom membership.
  - `backend/lib/parentChildHelpers.js` /
    `backend/controllers/invitationController.js`: when a parent accepts
    a classroom invite, push the classroom into each enrolled child's
    `classrooms[]`; when removed, pull.
  - `backend/controllers/accessGrantHelpers.js`: remove the
    `child.leadTeacher === teacher.name` derivation path.
  - **New** `backend/lib/transcriptRetention.js`: `oneYearFrom(date)` and
    `TRANSCRIPT_RETENTION_DAYS = 365`.
  - `backend/controllers/assessmentIngestController.js` and
    `backend/routes/whisperRoutes.js`: replace inline `addOneMonth` with
    `oneYearFrom`.
  - **New** routes: `DELETE /api/classrooms/:id`,
    `GET /api/classrooms/:id/transcripts` (gated to admin + classroom's
    teachers + enrolled parents), and
    `PATCH /api/classrooms/:id/children` (admin-only manual
    enroll/remove with `{ addChildId | removeChildId }` payload).
- **Frontend (mockup1)**
  - Classroom homepage: Delete Classroom button + confirm dialog;
    Transcripts card; Download as Excel.
  - `AddChildForm` / `EditChildForm`: drop the Lead Teacher dropdown;
    show "classrooms will be set when a parent accepts an invitation".
  - `ChildDataPage`: replace "Lead teacher: <name>" line with the
    classroom(s) the child is enrolled in.
  - New dep: `exceljs` (front-end only).
- **Tests**
  - Backend unit tests for the new retention helper, the deletion
    cascade, the membership population/pruning, and the new
    transcripts endpoint authorization.
  - Frontend test for the Excel builder (correct sheets, columns,
    row counts).
- **Risk**
  - Removing `leadTeacher` touches recording fan-out — covered by
    the `child-classroom-membership` spec; rollback is to re-add the
    field and revert `getSupervisedChildrenForTeacher`.
  - Extending retention to one year increases the on-disk transcript
    footprint roughly 12×; we accept this because no other system on
    the project is storage-bound and educators have asked for it.
  - Classroom deletion is irreversible; mitigated by an explicit
    confirm dialog and admin-only access on the destructive path.
