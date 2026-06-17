## Why

Parents currently record home audio from a card buried on the Dashboard, and every recording is automatically fanned out to **all** linked children with geographic home locations (Park, Museum, etc.) that do not match how families think about daily routines. Stakeholders want a dedicated **Home** tab where parents choose **which child** the recording is for, pick from research-aligned **activity** and **location** catalogs (same AI-vetting rules as teachers/admins), and upload or record in one focused flow.

## What Changes

- **New parent "Home" sidebar tab and route** (`/home/record` or similar): a dedicated page for home-context recording, separate from the classroom-focused Dashboard.
- **Child selector**: parents with multiple linked children choose exactly one target child before upload/accept; recordings attach only to that child (replacing the current fan-out-to-all-children behavior for parent home recordings).
- **Home activity catalog update**: replace the parent (`home`) predefined activity groups with the stakeholder-provided grouped list (Play time, Personal care, Outdoor play, Eating & drinking, Outings, Household chores, Books & literacy, Structured activities), each ending with **Other (please specify)** handled by existing AI vetting.
- **Home location catalog update**: replace the parent (`home`) geographic location list with the stakeholder-provided routine/setting list (Mealtime or snacks; Personal Care; Play/free play; Screen time; Reading or looking at books; Outdoor play; Clean up; Structured Activities; **Other (please specify)**), using the same predefined + AI-vetted custom pattern as school locations for teachers/admins.
- **Move recording UI off Dashboard**: remove (or demote) the "Record Activity" card from the parent Dashboard; primary entry becomes the Home tab.
- **Backend scoping**: parent activity upload/accept accepts an optional `childId`; server verifies the parent is linked to that child and creates assessments for that child only.
- **Catalog sync**: update `backend/lib/activityValidator.js`, `backend/lib/locationValidator.js`, and frontend mirrors (`activities.js`, `locations.js`) to stay in sync; school-context catalogs for teachers/admins are unchanged.

## Capabilities

### New Capabilities

- `parent-home-recording`: Dedicated parent Home tab, child selector, and home recording page reusing the existing activity/location vetting and transcribe/accept pipeline scoped to one child.

### Modified Capabilities

- `app-navigation-shell`: Add a parent-only **Home** sidebar item and route; adjust Dashboard active-state rules so Home and Dashboard are distinct.
- `recording-location`: Replace the parent (`home`) predefined location catalog with the new routine/setting list; keep school catalog and custom-location AI vetting unchanged.
- `classroom-recording-activity`: Extend the parent home activity catalog requirements to the stakeholder-provided grouped list (school catalog unchanged).

## Impact

- **Frontend**: `Sidebar.jsx`, `App.jsx` (new route), new `ParentHomeRecordingPage` (or similar), refactor `ActivityRecordingModal` or extract shared recording form with `childId` prop; update `HomePage.jsx` (remove parent Record Activity card); `activities.js`, `locations.js`.
- **Backend**: `activityRecordingController.js` (accept `childId` for parents, single-child resolve), `activityValidator.js`, `locationValidator.js`, optional route validation; unit tests for parent child scoping and updated catalogs.
- **Data**: Existing parent recordings fanned out to multiple children remain as-is; new recordings are single-child only.
- **Docs**: FAQ / user manual updates for parent Home tab and child selection (follow-up, not blocking implementation).
