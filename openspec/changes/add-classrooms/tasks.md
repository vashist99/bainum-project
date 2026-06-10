## 1. Backend — Classroom model and API

- [x] 1.1 Create `backend/models/Classroom.js` (name, lead teacher ObjectId ref [indexed, NOT unique — a teacher can lead many], optional assistantTeacher ObjectId ref, center string, children[], parents[], timestamps) and a shared center-name normalization helper
- [x] 1.2 Create `backend/controllers/classroomController.js` with `createClassroom` (teacher: derive lead+center from JWT; admin: require center + teacherId, validate teacher belongs to center; both: optional assistantTeacherId validated as same-center and ≠ lead) and a `canManageClassroom(user, classroom)` helper (admin OR lead OR assistant) used by all classroom endpoints
- [x] 1.3 Add `listClassrooms` (admin: all; teacher: classrooms where lead OR assistant, each flagged `role: "lead" | "assistant"`; populate lead/assistant names) and `getClassroom` (via `canManageClassroom`; populate children/parents)
- [x] 1.4 Add `getEligibleParents` (parents with `invitationAccepted: true` not yet in classroom, populated with child names) and `inviteParents` (add parents + their same-center children via `$addToSet`; skip cross-center children)
- [x] 1.5 Create `backend/routes/classroomRoutes.js`, mount at `/api/classrooms` in `api/index.js` with `authenticateToken`; deny parents (403) on all classroom-admin endpoints
- [x] 1.6 Add unit/API tests: relationship rules (teacher leading multiple classrooms, assistant same-center and ≠ lead, same-center child, multi-classroom child), role-based create/list/detail incl. assistant access and outsider-teacher denial, eligible-parents filtering, invite flow

## 2. Backend — Classroom-scoped recording

- [x] 2.1 Add optional `classroomId` field to `Assessment` and `TeacherAssessment` schemas (additive, no migration)
- [x] 2.2 Extend `POST /api/whisper/classroom` (`classroomWhisperController.js` / `whisperRoutes.js` fan-out) to accept optional `classroomId`: when present, authorize via `canManageClassroom` (lead, assistant, or admin), fan out to `classroom.children`, and stamp `classroomId`; when absent, keep legacy teacher-wide behavior
- [x] 2.3 Add classroom assessments read path (e.g., `GET /api/classrooms/:id/assessments` returning per-child per-category WPM rows for aggregation)
- [x] 2.4 API tests covering both classroom-scoped and legacy fan-out paths

## 3. Frontend — Dashboard and navigation

- [x] 3.1 Create `ClassroomCard.jsx` (DaisyUI card: classroom name as title; lead teacher and center in smaller muted text, assistant when set; small "Assistant" badge when the viewing teacher assists rather than leads; clickable → `/classrooms/:id`; responsive grid-ready)
- [x] 3.2 Rework `HomePage.jsx`: remove `DashboardStats` and the Recording Tools card grid for teachers/admins; teachers see cards for every classroom they lead or assist + "Create Classroom" button (empty state when none); admins see "Create Classroom" button + link to Classrooms page; parent branch untouched
- [x] 3.3 Add `Classrooms` sidebar entry in `Sidebar.jsx` (admin → `/classrooms`, teacher → their classrooms; hidden for parents)
- [x] 3.4 Create `ClassroomsPage.jsx` (admin-only responsive card grid of all classrooms) and register `/classrooms` route in `App.jsx` with `ProtectedRoute`

## 4. Frontend — Create Classroom form

- [x] 4.1 Create `CreateClassroomForm.jsx` at `/classrooms/create`: name field; teacher view shows read-only lead teacher + center from auth context; admin view has center select then center-filtered teacher select; both get an optional assistant-teacher select (center-filtered via `GET /api/centers/:name/teachers`, excluding the lead)
- [x] 4.2 Wire submit to `POST /api/classrooms` with toast feedback and navigate to the new classroom homepage on success; surface center-mismatch and assistant-validation errors inline

## 5. Frontend — Classroom homepage

- [x] 5.1 Create `ClassroomHomePage.jsx` at `/classrooms/:id`: classroom name title with center, lead teacher, and assistant (when set) below; access limited to admin + lead + assistant (redirect/403 otherwise)
- [x] 5.2 Build invite-to-classroom modal: lists eligible accepted parents as "Parent of <child name(s)>" with their children's names and checkboxes; confirm calls invite endpoint and refreshes membership
- [x] 5.3 Add Record button launching the existing classroom recording flow with `classroomId` passed through to `/api/whisper/classroom`
- [x] 5.4 Render aggregated visualizations from classroom assessments: dot matrix with SUMMED per-category WPM; semicircular dials with AVERAGED blue/green/red markers (reuse existing viz components)
- [x] 5.5 Ensure homepage, invite modal, and recording controls are responsive (mobile ~360px through desktop) and match the DaisyUI theme

## 6. Classroom homepage children list

- [x] 6.1 Replace the children badge card on `ClassroomHomePage.jsx` with a proper children list: each child's name with their classroom parent name(s) (derived from the detail endpoint's `parents[].childIds` mapping), responsive, with an invite-prompting empty state
- [x] 6.2 Ensure `getClassroom` returns parents' `childIds` so the child→parent mapping needs no extra request; list refreshes after a successful invite (existing `refreshMembership`)

## 7. Backend — per-child enrollment + parent listing

- [x] 7.1 Change `inviteParents` to accept `invites: [{ parentId, childIds?: [] }]` (legacy `parentIds: []` still works = all eligible children); validate each selected child belongs to that parent; enroll only selected same-center children via `$addToSet`
- [x] 7.2 Extend `listClassrooms` for parents: classrooms where the parent is a member, each row including `enrolledChildren: [{id, name}]` scoped to the requesting parent's own children; keep parents 403 on detail/invite/eligible-parents/assessments/record paths
- [x] 7.3 Update unit/API tests: partial child selection enrolls only selected children, child-not-of-parent rejected, parent list scoped to own enrollments, parent still denied on admin endpoints

## 8. Frontend — invite child selection + parent homepage

- [x] 8.1 Invite modal: per-child checkboxes under each selected parent (all eligible checked by default); confirm sends the `invites` payload
- [x] 8.2 Parent homepage: remove `DashboardStats`; fetch `GET /api/classrooms` and render enrolled-classroom cards (classroom name, teacher, center) with enrolled-child chips linking to `/data/child/:id`; keep the Record Activity card; empty state when no enrollments
- [x] 8.3 ClassroomCard: support a parent variant that is not clickable into the classroom homepage and renders enrolled-child chips instead

## 9. Verification (local only — do not deploy)

- [x] 9.1 Run backend unit/API tests (`npm run test:unit`, `npm run test:api`) and frontend lint (`npm run lint`)
- [ ] 9.2 Manually verify locally with `npm run dev` in both packages: teacher and admin classroom creation (with and without assistant), teacher homepage showing led + assisted cards with badge, assistant access to classroom homepage/invite/record, admin Classrooms page, invite flow with per-child selection, parent homepage showing enrolled classroom cards with child links, classroom recording fan-out hitting only enrolled children; confirm nothing is committed/pushed for deployment
