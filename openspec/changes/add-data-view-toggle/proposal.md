## Why

Today the Children & Data page (`/data`) shows children and teachers as dense
tables, while the Teachers page (`/teachers`) shows teachers as tile cards
with portraits, badges, and quick links. Each layout has its strengths — tiles
are friendlier for browsing a handful of people, tables make it easier to scan
dozens of rows and compare values (lead teacher, center, recording counts,
last seen) at a glance. Admins and teachers ask for both depending on how
they're using the page, so the page should let the viewer pick.

## What Changes

- Add a "view mode" toggle (Tiles / Table) at the top of both:
  - the children list on `/data`
  - the teachers list on `/data` and on `/teachers`
- Render the same list in either mode without re-fetching data.
- In Table mode every column header is sortable (asc/desc/none) and the
  active sort persists per-page across a session.
- The selected view mode persists per-user-per-page in `localStorage`
  (key `data-view-mode:children`, `data-view-mode:teachers`) and survives
  reloads.
- Tile mode is the default on first visit (matches today's `/teachers`).
- No backend changes — the toggle is purely client-side rendering of the
  data already returned by `GET /api/children` and `GET /api/teachers`.
- No change to filters, search, or pagination semantics; the same in-memory
  list flows into both views.

## Capabilities

### New Capabilities

- `data-view-toggle`: visual toggle between Tiles and Table layouts for the
  shared Children and Teachers lists, including persistent sort state in
  Table mode and persistent layout choice per page.

### Modified Capabilities

- (none — no existing OpenSpec capability covers these lists today; nothing
  else changes in behavior of the underlying data fetches.)

## Impact

- **Frontend**:
  - `mockup1/src/pages/DataPage.jsx` — gains the toggle, table↔tile switch
    for children and (the embedded) teachers list, column sort state.
  - `mockup1/src/pages/TeachersPage.jsx` — gains the toggle and Table mode
    for the main teacher list; the existing children-per-teacher embedded
    table is unaffected.
  - New shared component `mockup1/src/components/ViewModeToggle.jsx` (or
    inline hook) — keeps the two pages consistent.
- **Backend**: none. No new endpoints, no schema changes.
- **Tests**: frontend unit/integration tests for sorting and toggle
  persistence (`localStorage` round-trip, default value, asc/desc/none
  cycle on click).
- **Risk**: low. Purely additive, no data path change. Worst case the
  toggle defaults to the existing view and the feature is invisible.
