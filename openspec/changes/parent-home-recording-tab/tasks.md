## 1. Backend — home location catalog

- [x] 1.1 Update `backend/lib/locationValidator.js` `PREDEFINED_LOCATION_GROUPS.home` to the eight routine/setting locations from the spec; keep school list unchanged
- [x] 1.2 Mirror the same home location list in `mockup1/src/utils/locations.js`; set parent default to "Play/free play (e.g., blocks, puzzles, cars & trucks)"
- [x] 1.3 Add/extend unit tests asserting backend home locations match the spec list exactly

## 2. Backend — parent single-child recording

- [x] 2.1 Extend `resolveTargetChildren` (or parent branch) in `activityRecordingController.js` to require `childId` for parents, verify linkage, and return one child
- [x] 2.2 Pass `childId` through transcribe and accept handlers; reject missing/unauthorized `childId` with clear 400/403
- [x] 2.3 Update accept path so parent recordings create assessments for the selected child only (no fan-out)
- [x] 2.4 Add unit tests: parent with valid childId, missing childId, foreign childId, teacher flow unchanged

## 3. Backend — home activity catalog parity

- [x] 3.1 Verify `backend/lib/activityValidator.js` `PREDEFINED_ACTIVITY_GROUPS.home` matches the spec grouped list; adjust if any string drift
- [x] 3.2 Verify `mockup1/src/utils/activities.js` mirror matches backend; add parity test if missing

## 4. Frontend — shared recording form

- [x] 4.1 Extract recording form from `ActivityRecordingModal.jsx` into a reusable component (e.g. `ActivityRecordingForm`) supporting `role="parent"` with required `childId` + `onChildIdChange`
- [x] 4.2 Add child selector UI: fetch/display linked children by name; pre-select when only one; block submit until selected
- [x] 4.3 Send `childId` on transcribe and accept API calls for parent role
- [x] 4.4 Wire updated home location default and catalogs via existing `VettedLabelSelect` pickers

## 5. Frontend — Home page and navigation

- [x] 5.1 Add `ParentHomeRecordingPage` at `/home/recording` composing `ActivityRecordingForm`; empty state when no linked children; redirect/deny non-parents
- [x] 5.2 Register route in `App.jsx`
- [x] 5.3 Add parent **Home** sidebar item in `Sidebar.jsx` (distinct icon); adjust Dashboard vs Home active states per `app-navigation-shell` spec
- [x] 5.4 Remove parent Record Activity card and modal from `HomePage.jsx`; keep classroom overview and optional child-data shortcut

## 6. Tests and manual verification

- [x] 6.1 Frontend unit test: child selector renders all linked children; single-child pre-select
- [x] 6.2 Manual check: parent with two children records for each separately; assessments appear on correct child only
- [x] 6.3 Manual check: predefined and custom activity/location vetting on Home page; teacher classroom flow unaffected

## 7. Docs (follow-up)

- [x] 7.1 Update FAQ / user manual parent recording section: Home tab, child selection, new location list
