## Context

`/data` (DataPage.jsx) currently renders children and teachers as
zebra-striped HTML tables (`<table className="table table-zebra">`).
`/teachers` (TeachersPage.jsx) renders teachers as tile cards
(`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6` of `card bg-base-100`
elements). Some users prefer tiles for browsing a small set of people with
avatars and badges; others prefer the table for scanning, sorting, and
comparing dozens of rows at once. Today each page hard-codes one mode and
the other isn't reachable.

The data fetches are unchanged: `GET /api/children` and `GET /api/teachers`
both return arrays that already have everything we need (name, lead teacher,
center, last assessment, etc.). We do not need new backend endpoints.

## Goals / Non-Goals

**Goals:**
- Let an authenticated viewer flip the children list and the teachers list
  between Tile mode and Table mode.
- Table mode supports column sorting (ascending → descending → cleared) with
  a single click on any sortable header.
- The viewer's preferred mode and active sort persist across reloads on the
  same browser (per page).
- Both pages share the same toggle component and the same view-mode hook so
  behavior stays identical.

**Non-Goals:**
- No server-side preference storage (no User schema changes, no extra API
  calls).
- No multi-column / nested sorting in Table mode (single primary column is
  enough).
- No re-skin of the existing tile cards or table cells — only the *container*
  switches; cells/cards are reused as-is.
- No mobile-only behavior change. Tables already scroll horizontally on
  narrow viewports today; same here.

## Decisions

### D1. Toggle is a small two-segment control, not a dropdown

A two-segment "Tiles | Table" pill button is cheaper to scan than a select.
It mirrors existing toggles on `ChildDataPage` (Dot matrix / Semicircular)
so the UI vocabulary is consistent.

Alternatives considered: a select (more verbose), a single icon-only
button that cycles (less discoverable).

### D2. Persist with localStorage, keyed per page

- `data-view-mode:children` → `"tiles" | "table"`
- `data-view-mode:teachers` → `"tiles" | "table"`
- `data-sort:children` → `{ column: string, direction: "asc" | "desc" } | null`
- `data-sort:teachers` → same shape

`localStorage` is enough — the preference is cosmetic, per-device, and
doesn't need to follow the user across machines. Server-side storage would
require a User-schema migration disproportionate to the feature.

Alternatives considered: sessionStorage (lost on tab close — too short),
React context only (lost on reload — same problem).

### D3. Shared `useViewMode(pageKey)` hook + `ViewModeToggle` component

Both pages call the same hook to read/write `localStorage` so we don't have
to keep them in sync by copy-paste. Same for the toggle UI — one component
takes a `value` and `onChange`. The sorting logic also goes into a tiny
`useSortableList(items, sortKey)` hook that returns a stable comparator and
the current sort state.

Alternatives considered: inline state in each page (works, but doubles the
risk of drift the next time someone tweaks the UX).

### D4. Default view: Tiles

Matches today's `/teachers` default and gives users with no preference the
friendliest first impression. The toggle is visible from the start so the
preference is one click away.

### D5. Sortable columns are explicit, not auto-derived

Each table mode declares a static `columns` array (key, label, getter,
sortable: boolean) so non-sortable cells (avatar, action buttons) can be
opted out cleanly. Keeps the implementation predictable.

## Risks / Trade-offs

- **Sort state stored as a column key string**: if we rename a column key
  later we silently lose persisted sort state. → Mitigation: keys are
  documented in the spec, and the hook falls back to "no sort" when it
  encounters an unknown key.
- **localStorage quota / privacy mode**: storage may throw or be disabled. →
  Mitigation: wrap reads/writes in try/catch; on failure, default to Tiles
  and no sort (graceful degradation).
- **Visual jank when switching modes on a large list**: re-mounting a few
  hundred children might flicker. → Mitigation: keep the parent component
  mounted and only swap the inner renderer; React's reconciliation handles
  the rest.

## Migration Plan

Pure feature flag → no migration. Ship the component, ship the toggles on
both pages, done. Rollback is to delete the toggle and revert each page to
its single-mode renderer.
