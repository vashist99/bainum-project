## 1. Backend: JSON school alias + dual API mount

- [x] 1.1 Add a small serializer helper (e.g. `backend/lib/schoolFieldAlias.js`)
      that maps documents with a `center` field to API objects including
      `school` (and `center` during transition). Use on Teacher, Child,
      Classroom, and Center list/detail responses.
- [x] 1.2 Update create/update handlers for Child, Teacher, Classroom, and
      Center to accept `school` OR `center` in the body and normalize to the
      persisted `center` field before save.
- [x] 1.3 Mount `centerRoutes` at both `/api/schools` and `/api/centers` in
      `backend/api/index.js`. Change list response key from `centers` to
      `schools` on the `/api/schools` mount (keep `centers` key on legacy
      mount for compat, OR return both keys — document choice in code comment).
- [x] 1.4 Sweep `backend/controllers/centerController.js` and
      `classroomController.js` user-visible `message` strings: Center→School.
- [x] 1.5 Unit tests: write with `{ school: "X" }` persists `center`; response
      includes `school`; legacy `{ center: "X" }` still works.

## 2. Backend: validation / helper message sweep

- [x] 2.1 Update `classroomHelpers.js`, `centerNames.js` (or add
      `schoolNames.js` re-export), `locationValidator.js`, `activityValidator.js`
      error strings visible to clients to say "school" not "center".
- [x] 2.2 Grep `backend/` for remaining user-facing "center" strings in
      `res.status(...).json({ message: ... })` and fix.

## 3. Frontend: routes and file renames

- [x] 3.1 Add primary routes `/schools`, `/schools/add`, `/schools/edit/:id` in
      `App.jsx`; legacy `/centers/*` → `<Navigate replace />` to `/schools/*`.
- [x] 3.2 Rename `CentersPage.jsx` → `SchoolsPage.jsx`, forms
      `AddCenterForm` → `AddSchoolForm`, `EditCenterForm` → `EditSchoolForm`;
      update all imports.
- [x] 3.3 Rename `EmptyCenters` → `EmptySchools` in `LoadingStates.jsx`.
- [x] 3.4 Update axios calls from `/api/centers` to `/api/schools` throughout
      `mockup1/src`.
- [x] 3.5 Rename e2e `centers.spec.js` → `schools.spec.js`; add redirect test
      for `/centers` → `/schools`.

## 4. Frontend: user-visible string sweep (Center → School)

- [x] 4.1 `Sidebar.jsx`: "Centers" → "Schools", href `/schools`.
- [x] 4.2 `SchoolsPage.jsx` (formerly CentersPage): all titles, breadcrumbs,
      buttons, empty states, delete confirmations.
- [x] 4.3 `DataPage.jsx`: filter label "Filter by School", options "All
      schools", teacher alert "at your school", column header "School" (if
      present).
- [x] 4.4 Forms: `AddSchoolForm`, `EditSchoolForm`, `AddChildForm`,
      `EditChildForm`, `AddTeacherForm`, `EditTeacherForm`, `CreateClassroomForm`,
      `ClassroomUploadModal`, `TeacherProfilePage`, `ClassroomHomePage`,
      `DashboardStats.jsx`.
- [x] 4.5 Grep `mockup1/src` for user-visible `\bCenters?\b` (exclude CSS
      `text-center`, `items-center`, etc.) and fix stragglers.

## 5. Frontend: Children page title (match Teachers)

- [x] 5.1 In `DataPage.jsx`, replace gradient `<h1>Data</h1>` with Teachers-
      matching structure: `text-3xl font-bold text-base-content mb-2` title
      "Children" plus a muted subtitle (role-aware per design §D4).
- [x] 5.2 Verify sidebar still shows "Children" and highlights on `/data`.

## 6. Verification

- [x] 6.1 `cd backend && node --test tests/unit/*.test.js` — green including
      new school-alias tests.
- [x] 6.2 `cd mockup1 && npm run test:unit && npm run lint && npm run build`.
- [ ] 6.3 Manual smoke (deferred to user): sidebar Schools opens list; legacy
      `/centers` redirects; child/teacher forms say School; `/data` hero reads
      "Children" matching Teachers typography; API POST with `school` works.
- [x] 6.4 `openspec validate center-to-school-nomenclature`.

## 7. Archive (post-deploy)

- [ ] 7.1 After production deploy, `/opsx-archive center-to-school-nomenclature`.
