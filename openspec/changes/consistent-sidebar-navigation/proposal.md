## Why

Navigation is split-brained: 6 pages (Home, Classrooms, classroom detail, Create Classroom, Centers, Teachers) render the sidebar, while 11 others (Child Data list, child detail, teacher profile/detail, and all add/edit forms) have no sidebar and fall back to the legacy top tabs. Moving between pages makes the primary navigation appear, disappear, and change shape — disorienting and a guaranteed usability-test finding.

## What Changes

- **Sidebar on every authenticated page**: Child Data (`DataPage`), child detail (`ChildDataPage`), teacher profile (`TeacherProfilePage`), teacher detail (`TeacherDataDetailPage`), and the add/edit forms (`AddDataForm`, `AddChildForm`, `EditChildForm`, `AddCenterForm`, `EditCenterForm`, `AddTeacherForm`, `EditTeacherForm`) gain the same sidebar + navbar shell as the homepage. Parents see their (smaller) role-appropriate sidebar on child pages too.
- **Shared `AppLayout` component**: extract the repeated Sidebar + Navbar + mobile-overlay wiring (currently copy-pasted in 6 pages) into one layout component that derives the active item from the current route; all 17 authenticated pages adopt it so consistency is structural, not per-page discipline.
- **Remove the legacy top tabs entirely (BREAKING for current UI)**: the `navbar-center` tab row and its mobile dropdown twin in `Navbar.jsx` are deleted — with the sidebar everywhere, the "no sidebar → show tabs" fallback has no remaining audience.
- Login/registration/password pages (unauthenticated) keep their standalone layouts.
- No deployment as part of this change; verify locally.

## Capabilities

### New Capabilities
- `app-navigation-shell`: a single authenticated layout (sidebar + navbar) used by every authenticated page, with route-derived active state and no duplicate top-tab navigation.

### Modified Capabilities
<!-- None: the classroom-dashboard sidebar-entry requirements (in the active add-classrooms change) are unaffected; this change standardizes where the sidebar appears, not its contents. -->

## Impact

- **Frontend only**: new `mockup1/src/components/AppLayout.jsx`; `Navbar.jsx` simplified (tabs + mobile dropdown removed); 17 page components refactored to use the layout (11 gain a sidebar, 6 swap hand-rolled wiring for the shared layout).
- **No backend, API, or data changes.**
- **Risk surface**: pages whose content assumed full width (e.g., wide tables on `DataPage`, charts on `ChildDataPage`) now share the row with a 18rem sidebar on desktop — needs visual verification.
