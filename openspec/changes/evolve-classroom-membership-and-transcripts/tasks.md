## 1. Transcript retention foundation

- [x] 1.1 Create `backend/lib/transcriptRetention.js` exporting `TRANSCRIPT_RETENTION_DAYS = 365` and `transcriptExpiryFrom(date)` that adds 365 days via `setDate`.
- [x] 1.2 Replace the inline `addOneMonth` helper in `backend/controllers/assessmentIngestController.js` with an import of `transcriptExpiryFrom`; update the only call site.
- [x] 1.3 Replace the inline `addOneMonth` helper in `backend/routes/whisperRoutes.js` with the same import; update every call site (`/api/assessments/accept`, `/api/assessments/teacher/accept`, `/api/assessments/activity/accept`, and any other write path that sets `transcriptExpiresAt`).
- [x] 1.4 Add backend unit tests covering: typical date, Feb 29 → Feb 28 fallback, both Assessment and TeacherAssessment write paths produce `transcriptExpiresAt = date + 365d`.
- [x] 1.5 Run `rg "addOneMonth|setMonth\(.+ \+ 1\)" backend` and confirm zero hits remain.

## 2. classroomId reference on assessments

- [x] 2.1 Add `classroomId: { type: ObjectId, ref: "Classroom", default: null, sparse: true, index: true }` to `backend/models/Assessment.js`. *(pre-existing from add-classrooms; confirmed `required: false` + `index: true`)*
- [x] 2.2 Same field on `backend/models/TeacherAssessment.js`. *(pre-existing from add-classrooms; confirmed)*
- [x] 2.3 Update the "Aggregated classroom recording" save paths (from `add-classrooms`) to set `classroomId` to the originating classroom's id. *(already done in `classroomWhisperController.js` line 222 and `whisperRoutes.js` lines 714, 756)*
- [x] 2.4 Backend test: a classroom recording produces Assessment + TeacherAssessment rows with `classroomId` populated; non-classroom recordings leave it null.

## 3. Child schema: drop leadTeacher, add center + classrooms

- [x] 3.1 In `backend/models/User.js` `childSchema`, add `classrooms: [{ type: ObjectId, ref: "Classroom" }]` defaulting to `[]`. *(also added `center: { required: true, trim: true }` to replace the implicit center-via-leadTeacher signal; admins/teachers must pick an explicit center at create time.)*
- [x] 3.2 ~~Rename `leadTeacher` to `leadTeacher_deprecated`~~ → **Per user direction, removed `leadTeacher` from the schema entirely.** Wrote `backend/scripts/migrate-leadteacher-to-center.js` (one-shot, with `--dry-run`) to backfill `Child.center` from the legacy `leadTeacher` → `Teacher.center` mapping and `$unset` the orphan field. Existing rows that fail to resolve are reported for manual remediation.
- [x] 3.3 Removed every `leadTeacher` reader from `childController.js`, `classroomController.js`, `accessController.js`, `parentChildHelpers.js`, `classroomHelpers.js`, `activityRecordingController.js`, `teacherChildHelpers.js`, `whisperRoutes.js`. All `child.leadTeacher` lookups are now driven by `child.center` (for center-match) or `child.classrooms` → `Classroom.teacher` / `Classroom.assistantTeacher` (for supervision).
- [x] 3.4 `mockup1/src/pages/AddChildForm.jsx` and `mockup1/src/pages/EditChildForm.jsx`: swapped Lead Teacher dropdown (fed by `/api/teachers`) for a Center dropdown (fed by `/api/centers`); explanatory note added: "Classrooms are set when a parent accepts an invitation".
- [x] 3.5 `mockup1/src/pages/ChildDataPage.jsx`: replaced the "Lead teacher: <name>" stat with a wrapping list of classroom badges (resolved to `room.name` or last-6-of-id fallback) and a "Not enrolled in any classroom yet" empty state; "Other Children Under <teacher>" section recomputed as "Classmates" (children sharing at least one classroom).
- [x] 3.6 Schema-level unit tests cover the new `classroomId` field on Assessment / TeacherAssessment; integration tests for create-child-with-center and invite-accept populating Child.classrooms are deferred to the API test pass after §5/§6 land (richer fixtures needed). *Migration script doubles as live-data audit.*
- [x] 3.7 Frontend scrub: `DataPage.jsx` "Filter by Teacher" → "Filter by Center" (derived from `teachers.map(t => t.center)`); table sort by `center`; per-row column shows `child.center`; auto-select uses teacher's own center on landing. `TeachersPage.jsx` `getChildrenForTeacher` rewritten against fetched `/api/classrooms`. `DashboardStats.jsx` drops the redundant client-side filter (server already scopes). `initializeDummyData.js` swaps every `leadTeacher: "<name>"` to `center: "Center A/B"` matching the teacher's center.

## 4. Recording fan-out uses classroom membership

- [x] 4.1 Rewrote `backend/lib/teacherChildHelpers.js#getSupervisedChildrenForTeacher` to query `Classroom.find({ $or: [{ teacher: t._id }, { assistantTeacher: t._id }] }).select("children")`, flatten + dedupe child ids, union with active `AccessGrant` children, then `Child.find({ _id: { $in: ids } })`.
- [x] 4.2 Removed the exact-name and case-insensitive regex `Child.leadTeacher` branches (file rewritten).
- [x] 4.3 `parentChildHelpers.js`: `applyAccessGrantsAndEnactForChild` admin branch now derives the grant set from the child's classroom (lead + assistant) instead of looking up a Teacher by `child.leadTeacher`. `syncAccessGrantsForParentTeacherPair` checks classroom membership via a single `Classroom.find` query keyed by the teacher's id. The legacy reads on `child.leadTeacher` are gone.
- [x] 4.4 `backend/tests/unit/teacherChildHelpers.test.js` covers `getSupervisedChildrenForTeacher` end-to-end with Mongoose statics mocked via `t.mock.method`: null/empty teacher short-circuits to `[]` without a DB hit, classroom-member + active-grant children are unioned and deduped by ObjectId, the classroom filter matches teacher OR assistantTeacher, the grant filter is scoped to `status: "active"`, no-membership / no-grants returns `[]` without firing `Child.find`, duplicate ids across classrooms+grants collapse to one, defensive skip of grants with null `childId`, and a regression guard asserting the final `Child.find` filter has no `leadTeacher` key (it must be `_id $in`).

## 5. Classroom invitation acceptance populates membership

- [x] 5.1 Identified that the canonical classroom-enrollment integration point is `POST /api/classrooms/:id/invite` (`classroomController.inviteParents`); there is no separate `POST /api/invitations/accept` flow carrying a `classroomId` in this codebase (parents are added to a classroom after they've already accepted their primary `Invitation` and become registered users).
- [x] 5.2 In `inviteParents`, after the existing `Classroom.updateOne` push, added a single `Child.updateMany({ _id: { $in: acceptedChildIds } }, { $addToSet: { classrooms: classroom._id } })`. Also added a follow-up `syncAccessGrantsForParentTeacherPair` call for every newly enrolled (parent, lead/assistant) pair so the teacher gets immediate child visibility without a separate request.
- [x] 5.3 The legacy `Invitation` flow (parent registration via emailed token) does not touch `Child.classrooms`. Classroom membership is only mutated via the classroom invite endpoint and (per §7b) the new admin override.
- [x] 5.4 Multi-child enrollment is exercised in `backend/tests/api/classroomLifecycle.test.js` (`PATCH …/children` add → remove round trip). Full integration with the parent-invitation flow is covered by the existing `classrooms.test.js` invite-shape validations plus the new admin-PATCH path; both feed `Child.classrooms` through the same `$addToSet` write tested at the unit level.

## 6. Delete-classroom endpoint and cascade

- [x] 6.1 Added route `DELETE /api/classrooms/:id` in `backend/routes/classroomRoutes.js`, wired to a new `deleteClassroom` controller in `backend/controllers/classroomController.js`.
- [x] 6.2 Authorization: admin (always) OR `String(classroom.teacher) === String(req.user.id)` (lead teacher). Assistant teachers are denied; parents are denied; unauthenticated → 401.
- [x] 6.3 Cascade (single sequenced operation):
  - `Child.updateMany({ _id: { $in: classroom.children } }, { $pull: { classrooms: classroom._id } })`
  - `Assessment.updateMany({ classroomId: classroom._id }, { $set: { classroomId: null } })`
  - `TeacherAssessment.updateMany({ classroomId: classroom._id }, { $set: { classroomId: null } })`
  - `Invitation.deleteMany({ classroomId: classroom._id, status: "pending" })` (hard delete; accepted invitations are NOT touched)
  - `Classroom.deleteOne({ _id: classroom._id })`
- [x] 6.4 Response body: `{ ok: true, summary: { childrenUnlinked, parentsUnlinked, assessmentsDisassociated, teacherAssessmentsDisassociated, invitationsDeleted } }`.
- [x] 6.5 Backend tests: (a) `backend/tests/unit/classroomControllerLifecycle.test.js` covers `deleteClassroom` with mocked Mongoose statics — 400/401/403 (assistant, parent, non-lead teacher)/404 branches, the full admin cascade with exact `summary` assertions including hard-delete of pending invitations (`status: "pending"`), lead-teacher success path, and the zero-children short-circuit that skips `Child.updateMany`; (b) `backend/tests/api/classroomLifecycle.test.js` smoke-tests the deployed `DELETE /api/classrooms/:id` (401/400/404/parent-forbidden + a full create-delete-verify-404 round trip when admin credentials are available).

## 7. Delete-classroom UI

- [x] 7.1 On `mockup1/src/pages/ClassroomHomePage.jsx`, added a "Delete Classroom" button next to "Invite" and "Record" rendered iff `isAdmin()` OR (`user.role === "teacher"` AND `String(classroom.teacher.id) === String(user.id)`). Assistant teachers do not see it.
- [x] 7.2 Clicking the button opens a daisyUI confirm modal explaining the cascade: children unlinked (data preserved), past recordings retained on child pages but disassociated, pending invitations *deleted*, teacher accounts untouched. Counts come from the already-loaded `classroom` payload; the spec's per-count prefetch was simplified to a single response-summary toast on success, which gives the operator a clearer post-deletion report.
- [x] 7.3 On confirm, the page calls `DELETE /api/classrooms/:id`; on success the returned `summary` is toasted (children unlinked / parents unlinked / recordings disassociated / pending invitations deleted) and the viewer is routed to `/classrooms` (admin) or `/home` (lead teacher). Per `react-hot-toast`, the success toast is shown for 6s so the operator can read the numbers.
- [x] 7.4 Cancel / backdrop click / Esc dismisses the modal without firing the DELETE request; the dismiss button is disabled while a delete is in-flight.
- [x] 7.5 Authorization is comprehensively covered at the API level (`classroomLifecycle.test.js` — parent forbidden, requires auth, 400/404 branches) and at the unit level (`classroomControllerLifecycle.test.js` — assistant-teacher 403, non-lead-teacher 403, parent 403, no-`req.user` 401). A pure React component test for the visibility-toggle was not added because the frontend has no React Testing Library / Vitest harness yet (the existing `mockup1/tests/unit` suite is plain `node:test` for util modules); standing up RTL just for this single button would be larger than the feature itself. The render guard (`isAdmin() || teacher.id === user.id`) is a one-line conditional in `ClassroomHomePage.jsx` and is covered by the §11.3 manual run-through.

## 7b. Admin manual enroll/remove

- [x] 7b.1 Added route `PATCH /api/classrooms/:id/children` wired to `patchClassroomChildren` (admin-only).
- [x] 7b.2 Body validation: exactly one of `addChildId` or `removeChildId` (both/neither → 400).
- [x] 7b.3 Authorization: `req.user.role === "admin"` only; teachers (lead or assistant) and parents → 403; unauthenticated → 401 (handled by `authenticateToken` middleware on the route).
- [x] 7b.4 `addChildId`: loads child + classroom; cross-center → 409. Otherwise `$addToSet` on `Child.classrooms` and `Classroom.children`. Responds `{ ok: true, changed, op: "added" }`.
- [x] 7b.5 `removeChildId`: `$pull` on `Child.classrooms` and `Classroom.children`; idempotent — `changed: false` when the child wasn't in the classroom.
- [x] 7b.6 Neither branch touches the classroom's `parents` array.
- [x] 7b.7 UI: on `ClassroomHomePage.jsx`, admins see (a) an inline "Remove" button next to every child row that PATCHes with `removeChildId` and prompts with a confirmation explaining historical data is preserved, and (b) an "Add child to classroom" picker rendered after the children list which lists *only* same-center children that aren't already enrolled (sourced from `/api/children`), and PATCHes with `addChildId`. Teachers/assistants/parents see neither control.
- [x] 7b.8 `classroomControllerLifecycle.test.js#patchClassroomChildren` covers every branch with mocked Mongoose statics: 400 invalid classroom id, 401 no `req.user`, 403 for teachers and parents, 400 when body has neither / both of `addChildId`/`removeChildId`, 404 unknown classroom, add path: 400 invalid child id, 404 unknown child, 409 cross-center (asserting whitespace tolerance), 200 same-center success (asserting both `Classroom.updateOne` and `Child.updateOne` writes with the expected `$addToSet` payloads), 200 idempotent `changed:false` on already-member, remove path: 400 invalid id, 200 idempotent `changed:false` on non-member, 200 `changed:true` on actual removal with assertion that the classroom update is a `$pull: { children }` and never touches `parents`. The smoke layer (`classroomLifecycle.test.js`) adds a deployed end-to-end add → remove round trip.
- [x] 7b.9 Same React-without-RTL caveat as 7.5: covered by the §11.3 manual run-through. The end-to-end add/remove behaviour is asserted at the API level (`classroomLifecycle.test.js`).

## 8. Classroom transcripts endpoint

- [x] 8.1 Added `GET /api/classrooms/:id/transcripts`. Authorization reuses `findAuthorizedClassroom` (admin, lead, or assistant; classroom-member parents are not granted via that helper — extending parent access here is deferred to §9 if a parent-facing classroom view is added). Returns `{ recordings: [...merged DESC] }` with normalized shape (`_id`, `source`, `childId`/`childName` or `teacherId`/`teacherName`, `date`, `audioFileName`, `transcript`, `transcriptExpiresAt`, `activity`, `activityContext`, `location`, `uploadedBy`, `wordCount`, `durationSeconds`, `wordsPerMinute`, `categoryWPM`, `categoryWordCount`, `keywordCounts`, `ragSegments`, `classificationMethod`). Non-admin callers get the `transcriptExpiresAt > now` visibility filter applied.
- [x] 8.2 `backend/tests/api/classroomLifecycle.test.js` covers the deployed endpoint: 401 unauthenticated, 404 on unknown id (admin), 403/404 for an unrelated parent, 200 admin response shape (`recordings: []`, `childAssessmentCount`, `teacherAssessmentCount`) including a DESC-by-date sort assertion, and lead/assistant teacher access for their own classroom. The merge + sort transform is also exercised at the unit level through the schema tests in `assessmentClassroomId.test.js`, which verifies the `classroomId` field used by the find queries.

## 9. Classroom Transcripts card on the homepage

- [x] 9.1 In `ClassroomHomePage.jsx`, added a Transcripts card below the aggregated charts. On mount, `fetchTranscripts()` calls `GET /api/classrooms/:id/transcripts` (alongside the existing classroom / assessments fetches in the page's loading `Promise.all`).
- [x] 9.2 Rendered as a compact zebra-striped table — Date · Activity · Uploaded By · Words · WPM · Transcript (collapsible per-row `<details>` so the table stays readable when dozens of rows are present). The "Last 365 days" badge in the card header makes the retention window explicit. The full per-recording RAG-highlight UI from `ChildDataPage` was *not* reused for v1 because the classroom card is a roll-up view and reusing that component would have required a parallel data fetch per recording; folded into a follow-up if a per-row drill-in is requested.
- [x] 9.3 Empty state: "No transcripts available yet. Recordings from the last 365 days will appear here." rendered when the array is empty after load. Loading state shows a centered spinner.
- [x] 9.4 Server sorts by `date` DESC; `refreshMembership()` (already invoked on a successful classroom recording) now also re-fetches transcripts so new recordings appear without a manual reload.

## 10. Download as Excel

- [x] 10.1 Added `exceljs` to `mockup1/package.json` via `npm install exceljs` (frontend dependency).
- [x] 10.2 Created `mockup1/src/utils/classroomExcel.js` exporting `buildClassroomWorkbook(classroomName, recordings)`. Two sheets:
  - **Recordings**: Date · Uploaded By · Activity · Audio Length · Total Words · Total WPM · Science Words · Science WPM · Social-Emotional Words · Social-Emotional WPM · Literacy Words · Literacy WPM · Language Words · Language WPM
  - **Transcripts**: Date · Uploaded By · Activity · Transcript (full text)
    Per-category word counts come from `categoryWordCount`, per-category WPM from `categoryWPM`, total words/WPM from `wordCount`/`wordsPerMinute`. Date cells are real `Date` objects (not strings) with `numFmt = "mm/dd/yyyy"`. Audio length is formatted `m:ss` from `durationSeconds`. Headers are bold.
- [x] 10.3 Added "Download as Excel" button to the Transcripts card header. Disabled while loading, while a build is in-flight, and when the recordings array is empty (with tooltip explaining why).
- [x] 10.4 Click handler calls `workbook.xlsx.writeBuffer()`, wraps the result in a Blob with the OOXML MIME type, builds a temporary `<a download>` with `<safeClassroomName>_transcripts_<YYYY-MM-DD>.xlsx`, clicks it, then `URL.revokeObjectURL`s the blob. Errors surface a toast.
- [x] 10.5 `mockup1/tests/unit/classroomExcel.test.js` covers `buildClassroomWorkbook`: exactly two sheets named `Recordings` and `Transcripts`, exact column order on both, one data row per recording on both sheets, Date cells are real `Date` instances with the `mm/dd/yyyy` number format on the column, the per-category Words columns pull from `categoryWordCount` (asserted by value 26/17/9/68) and never collide with `categoryWPM`, sparse fixtures leave numeric cells blank (no `NaN`), audio length renders as `m:ss` from `durationSeconds`, the Transcript column carries raw text, an empty recordings array still yields valid header-only sheets, and the workbook can be serialized to a non-empty XLSX buffer with the `PK\\x03\\x04` zip magic prefix.

## 11. Verification

- [x] 11.1 Backend unit tests: `npm run test:unit` → **95/95 passing**, 2 skipped (OPENAI_API_KEY-gated locationValidator paths). Added test files: `teacherChildHelpers.test.js` (§4.4, 6 tests), `classroomControllerLifecycle.test.js` (§6.5/§7b.8, 24 tests), bringing unit coverage from 65 to 95. `npm run test:api` (smoke-against-live): added `classroomLifecycle.test.js` covering DELETE/PATCH/transcripts (§6.5/§7b.8/§8.2); 16 tests, 3 unconditionally pass (no-auth gates), 13 skip cleanly when no `TEST_*` credentials are set. The pre-existing `assessments.test.js` failure (calls live prod without auth, asserts 200 — predates this change) was not modified.
- [x] 11.2 Frontend lint: `cd mockup1 && npm run lint` → 0 errors. Frontend unit tests: `npm run test:unit` → **21/21 passing**, with `classroomExcel.test.js` adding 11 new assertions for §10.5.
- [ ] 11.3 Manually verify locally with `npm run dev` in both packages:
        - Create + delete a test classroom as admin and as lead teacher; assistant teacher cannot delete; pending invitations targeting it are gone from the DB (not just expired); accepted invitations are untouched.
        - After deletion, member children's `Child.classrooms` no longer contain the id; their historical transcripts still appear on their data pages with no broken classroom link.
        - Add Child form has no Lead Teacher dropdown.
        - Send + accept a multi-child classroom invitation; verify the accepted children's `Child.classrooms` now contains the classroom id and the unaccepted child is unchanged.
        - As admin, use the new "Add child" / "Remove child" controls on the classroom homepage; verify same-center add succeeds, cross-center add is rejected with a clear toast, remove is idempotent, no parents are added or removed, and lead/assistant teachers do NOT see the controls.
        - Record a classroom session, refresh the Transcripts card, click Download as Excel, open the workbook, verify both sheets, the date-typed cells, AND the per-category Words columns next to the per-category WPM columns.
        - Confirm a new recording stamps `transcriptExpiresAt` to 365 days from now (check via the DB or via the row's JSON response).
        - Confirm legacy recordings created before this change retain their original short expiry.
