## 1. Shared layout

- [x] 1.1 Create `mockup1/src/components/AppLayout.jsx`: owns sidebar open/close state, renders Sidebar (currentPath from `useLocation()`) + Navbar (breadcrumbs prop) + standard flex skeleton with children in `<main>`
- [x] 1.2 Refactor the 6 existing sidebar pages (`HomePage`, `ClassroomsPage`, `ClassroomHomePage`, `CreateClassroomForm`, `CentersPage`, `TeachersPage`) onto `AppLayout`, removing their hand-wired Sidebar/Navbar/state

## 2. Sidebar everywhere

- [x] 2.1 Wrap `DataPage`, `ChildDataPage`, `TeacherProfilePage`, `TeacherDataDetailPage` in `AppLayout` (keep page content untouched; preserve existing breadcrumbs)
- [x] 2.2 Wrap the add/edit forms (`AddDataForm`, `AddChildForm`, `EditChildForm`, `AddCenterForm`, `EditCenterForm`, `AddTeacherForm`, `EditTeacherForm`) in `AppLayout`
- [x] 2.3 Remove the legacy top tabs and mobile dropdown from `Navbar.jsx` entirely (plus unused imports); navbar keeps brand, breadcrumbs, notifications, user menu

## 3. Verification (local only — do not deploy)

- [x] 3.1 `npm run lint` and `npm run build` clean
- [ ] 3.2 Click through every authenticated route as admin, teacher, and parent at desktop + mobile widths: sidebar present and correct item highlighted, no top tabs anywhere, no horizontal overflow on DataPage table or ChildDataPage charts, parent child-page shows the minimal parent sidebar
