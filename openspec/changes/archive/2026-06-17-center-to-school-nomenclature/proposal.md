## Why

Stakeholders refer to physical sites as **schools**, not "centers," and the
product UI still uses Center/Centers in navigation, forms, filters, and API
error messages. That mismatch confuses admins during onboarding and makes the
app feel misaligned with how centers describe themselves in the field.

Separately, the `/data` page (sidebar label already reads **Children**) still
shows a large gradient **Data** page title that does not match the **Teachers**
page heading style — inconsistent hierarchy between the two primary admin list
pages.

## What Changes

- Replace every **user-visible** "Center" / "Centers" string in the frontend
  with **School** / **Schools** (sidebar, breadcrumbs, page titles, form
  labels, table headers, filter dropdowns, empty states, toast messages,
  confirmation dialogs, aria-labels, and tooltips).
- Replace user-facing "center" / "centers" strings in backend HTTP responses
  (400/404 messages, validation errors, success toasts surfaced via API
  `message` fields) with "school" / "schools".
- **BREAKING (routes):** Frontend paths `/centers`, `/centers/add`,
  `/centers/edit/:id` become `/schools`, `/schools/add`, `/schools/edit/:id`.
  Old paths SHALL redirect to the new ones so bookmarked links keep working.
- **BREAKING (API):** `GET/POST/PUT/DELETE /api/centers` becomes
  `/api/schools`. The old mount SHALL answer with the same handlers (alias) for
  at least one release so deployed clients do not 404 during rollout.
- JSON field names in API responses and request bodies: expose `school` as the
  canonical key on Teacher, Child, Classroom, and School-entity payloads.
  Accept `school` on writes; continue accepting legacy `center` on writes as a
  silent alias for one release (logged deprecation), then drop the alias.
- MongoDB collection `centers` and document field `center` on embedded schemas
  are **not** renamed in this change — only the outward nomenclature changes.
  (Avoids a production data migration; see design.md.)
- Rename frontend components/files where the name is user-facing in dev
  (`CentersPage` → `SchoolsPage`, etc.) for maintainability; internal-only
  helper names (`centerNames.js`) may keep their filename with a re-export
  alias if the diff would be enormous.
- **`/data` page title:** Replace the gradient **Data** `<h1>` with **Children**
  using the same heading pattern as `/teachers` (`text-3xl font-bold
  text-base-content` plus a short muted subtitle). Remove the gradient title
  treatment on this page.

## Capabilities

### New Capabilities
- `school-nomenclature`: User-visible Center→School rename across UI, API
  messages, routes, and JSON field aliasing; backward-compatible redirects and
  legacy API alias behavior.
- `children-list-page`: `/data` page shell — page title reads "Children" with
  Teachers-matching typography; sidebar label remains "Children".

### Modified Capabilities
- `app-navigation-shell`: Sidebar entry "Centers" becomes "Schools"; route
  targets `/schools`; "Child Data" requirement text updated to "Children" to
  match the already-shipped sidebar label.

## Impact

**Frontend (`mockup1/`)**
- `Sidebar.jsx`, `CentersPage.jsx` (→ `SchoolsPage`), add/edit center forms,
  `DataPage.jsx`, `TeachersPage.jsx`, `CreateClassroomForm.jsx`,
  `ClassroomHomePage.jsx`, `AddChildForm.jsx`, `EditChildForm.jsx`,
  `AddTeacherForm.jsx`, `DashboardStats.jsx`, `LoadingStates.jsx`,
  `ClassroomUploadModal.jsx`, `App.jsx` routes, e2e specs (`centers.spec.js`).

**Backend (`backend/`)**
- `centerController.js` messages, `centerRoutes.js` + new `schoolRoutes` alias,
  `classroomController.js` validation messages, `classroomHelpers.js`,
  `centerNames.js` (comparison helpers may rename to `schoolNames` with
  re-export), whisper/location validators, OpenAPI-less but Playwright API tests
  under `tests/api/centers.test.js`.

**Out of scope**
- Renaming the Mongoose model `Center` or MongoDB field `center` on stored
  documents.
- Changing the Anita Zucker **Center** name in repo metadata or deployment
  hostnames.
- OpenSpec archive folder text (historical proposals stay as-is).
