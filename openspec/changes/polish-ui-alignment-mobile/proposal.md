## Why

Several authenticated pages show small but visible layout defects — the navbar
profile icon sits off-center inside its colored circle, and search icons on
Schools and Teachers pages misalign with their input fields because those pages
use a different markup pattern than Classrooms. On phone-sized viewports,
entity list headers crowd together, wide tables can force page-level horizontal
scroll, and transcript cards crowd badges and metadata. These issues make the app
feel unfinished and harder to use on mobile, which parents and teachers
increasingly rely on.

## What Changes

- Center the navbar user-menu avatar icon inside its circular background and
  align it visually with the notification bell.
- Introduce a shared search-field pattern (icon + input) and apply it everywhere
  list pages offer search (Schools, Teachers; Classrooms already uses the
  correct pattern).
- Make list-page toolbars responsive: search, view-mode toggle, and primary
  actions stack or wrap cleanly below ~640px without clipping or overflow.
- Ensure Table mode on Children, Teachers, and Schools lists scrolls inside a
  bounded container on narrow viewports so the page shell stays fixed-width.
- Polish `TranscriptRecordCard` and transcript list sections for narrow
  screens: wrapping metadata, readable transcript body, and non-overlapping
  delete controls.
- Audit Schools and Classrooms list headers for the same responsive spacing
  patterns already used on ClassroomsPage.
- No backend or API changes.

## Capabilities

### New Capabilities

- `responsive-ui-polish`: shared UI patterns (search field, avatar circle,
  responsive list toolbars) and mobile layout rules for entity tables and
  transcript cards.

### Modified Capabilities

- `app-navigation-shell`: navbar avatar alignment and mobile shell overflow
  rules (extend existing "Content fits beside the sidebar" behavior).
- `children-list-page`: mobile-friendly Children list toolbar and table
  container behavior on `/data`.
- `transcripts-display-and-export`: mobile presentation rules for shared
  transcript cards on classroom and teacher-profile pages.
- `data-view-toggle`: mobile behavior when Table mode is active on narrow
  viewports.

## Impact

- **Frontend**:
  - `mockup1/src/components/Navbar.jsx` — avatar centering.
  - New `mockup1/src/components/SearchField.jsx` (or equivalent shared
    wrapper).
  - `mockup1/src/pages/SchoolsPage.jsx`, `TeachersPage.jsx` — search + header
    toolbar responsiveness.
  - `mockup1/src/pages/DataPage.jsx` — Children table container + toolbar.
  - `mockup1/src/components/TranscriptRecordCard.jsx` — mobile card layout.
  - `ClassroomHomePage.jsx`, `TeacherProfilePage.jsx`, `ChildDataPage.jsx` —
    transcript list wrappers if needed.
- **Backend**: none.
- **Tests**: frontend unit tests for `SearchField` markup/classes; snapshot or
  DOM tests for navbar avatar flex centering; transcript card narrow-layout
  assertions where practical.
- **Risk**: low — CSS/markup only; no data-path changes.
