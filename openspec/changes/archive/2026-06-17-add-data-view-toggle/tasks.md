## 1. Shared frontend primitives

- [x] 1.1 Create `mockup1/src/components/ViewModeToggle.jsx` — two-segment "Tiles | Table" pill controlled component (`value`, `onChange`). DaisyUI `btn-group`; lucide `LayoutGrid` / `Table2` icons.
- [x] 1.2 Create `mockup1/src/hooks/useViewMode.js` — `useViewMode(pageKey)` reads/writes `localStorage` key `data-view-mode:<pageKey>`, defaults to `"tiles"`, wraps reads/writes in try/catch. Re-syncs when `pageKey` changes mid-lifecycle.
- [x] 1.3 Create `mockup1/src/hooks/useSortableList.js` — `useSortableList(items, pageKey, columns)` reads/writes `localStorage` key `data-sort:<pageKey>`, exposes `{ sortedItems, activeSort, cycleSort(columnKey), ariaSortFor(columnKey) }` cycling asc → desc → cleared. Pure helpers (`readPersistedSort`, `writePersistedSort`, `nextSortState`, `sortItems`, `defaultComparator`) exported for unit testing.
- [x] 1.4 Unit test the hooks: default value, persistence round-trip, garbage-value rejection, asc → desc → cleared cycle, switching columns resets to asc, unknown column key cleared, non-sortable columns opted out, throwing-localStorage degrades gracefully, custom getter/compare overrides honored, stable sort on ties. 31 cases, all passing via `node --test`.

## 2. Children list (`/data`)

- [x] 2.1 In `mockup1/src/pages/DataPage.jsx`, factor the existing children renderer so the *outer card* is shared and the body can switch between a tile renderer and a table renderer. The mobile-only card path was subsumed by the new Tile renderer (which is already responsive 1→2→3 cols), so we no longer maintain three separate layouts.
- [x] 2.2 Add the new tile renderer for Children mirroring the look of the current Teachers tile cards: avatar circle (`User` lucide icon), name link, badge row for age/language/center, bulk-invite checkbox at top-left, action footer (View / Edit / Delete / Invite|Invited|Parent linked).
- [x] 2.3 Wire `<ViewModeToggle>` into the Children section header using `useViewMode("children")`. Toggle sits next to the bulk-invite button in the section header.
- [x] 2.4 Define `childrenColumns` (`name` / `age` / `language` / `center`; `select`, `#`, and `actions` are non-sortable and not listed in `childrenColumns`). Each `<th>` now has `aria-sort={ariaSortFor(key)}` and a button calling `cycleSort(key)`. Indicator: `ArrowUp` / `ArrowDown` / `ArrowUpDown@opacity-50`.
- [x] 2.5 Filters/search/pagination still work: the page only has a center filter (`selectedTeacher`), which feeds `filteredChildren` upstream of `useSortableList`. The card-visibility gate (`selectedTeacher || (isAdmin() && children.length > 0)`) is preserved verbatim. Bulk-invite eligibility is computed from `sortedChildren`, so both renderers respect the same eligible-set.

## 3. Teachers list

- [x] 3.1 In `mockup1/src/pages/TeachersPage.jsx`, replace the inline `viewMode` state with `useViewMode("teachers")` and switch the existing tile grid / table layouts behind the new pageKey. Embedded children-per-teacher table inside expanded rows is untouched.
- [x] 3.2 The table renderer already exists; refactored its header buttons to call the shared `cycleTeachersSort` and added sortable columns: Name, Email, Education, Date of Birth, Center, Language. Students-count is sortable via the `students` column descriptor (not currently surfaced as a column header — kept available for future UX). Each `<th>` carries `aria-sort={ariaSortFor(key)}`.
- [x] 3.3 `<ViewModeToggle>` replaces the previous two `<button>`s in the page header. The renamed "Cards" segment is now "Tiles", matching the Children list vocabulary and the spec.
- [x] 3.4 `teachersColumns` declares `name`, `email`, `education`, `dob` (numeric getter via `new Date(...).getTime()` so dates sort chronologically), `center`, `language`, `students` and is passed to `useSortableList(filteredBase, "teachers", teachersColumns)`. Lifted `getChildrenForTeacher` and `getPrimaryLanguageForTeacher` above the hook call so the getters resolve.
- [x] 3.5 **Not applicable.** Re-reading `DataPage.jsx` confirms it does NOT render a Teachers list today (only a center-filter `<select>` derived from the teachers payload and the children list). The proposal/design referenced a teachers list on `/data` that doesn't exist in the current code. Since `useViewMode("teachers")` is already keyed identically across pages, *if* a teachers list is added to `/data` later, dropping in the same `<ViewModeToggle value={...} onChange={...} />` would automatically inherit the cross-page choice. Recorded as a no-op for this change.

## 4. Visual / accessibility polish

- [x] 4.1 `<ViewModeToggle>` renders a `<div role="tablist" aria-label=…>` wrapping two `<button role="tab" aria-selected>` segments. `tabIndex` is roving (active segment is 0, the other -1), and `onKeyDown` handles `ArrowLeft` / `ArrowRight` (toggle + focus the other segment) plus `Enter` / `Space` (activate). Refs are scoped per-segment for the focus dance.
- [x] 4.2 Every sortable header carries `aria-sort={teachersAriaSortFor(key)}` / `childrenAriaSortFor(key)` returning `"ascending"` / `"descending"` / `"none"`. The visible indicator is a lucide `ArrowUp` / `ArrowDown` / `ArrowUpDown@opacity-50`, identical between pages. 4 sortable headers on DataPage, 6 on TeachersPage.
- [x] 4.3 Toggle is built with DaisyUI `btn-group` + `btn-sm` + `btn-primary`/`btn-ghost` so the forest-theme primary highlight applies to the active segment automatically. Sortable header buttons reuse the same hover-underline pattern that was already on the page. Tile cards reuse the existing `card bg-base-200 border border-base-300 hover:shadow-lg` recipe so visual weight matches the Teachers tile cards (D1 in design.md).

## 5. Verification

- [x] 5.1 `npm run lint` in `mockup1/` — passes (0 warnings, 0 errors). Also `node --test tests/unit/*.test.js` — 52/52 pass (31 new for view-mode hooks, 21 pre-existing).
- [X] 5.2 **Deferred to user — needs a browser.** When you run `npm run dev`, please confirm:
        - First load defaults to Tiles on `/data` (Children) and `/teachers`.
        - Switching to Table on Children persists across page reload (DevTools → Application → Local Storage shows `data-view-mode:children = "table"`).
        - Sorting Children by Center desc persists across reload (`data-sort:children = {"column":"center","direction":"desc"}`).
        - Switching `/teachers` to Table persists when navigating back to it (and would propagate to a future `/data` Teachers list since both use `pageKey: "teachers"`).
        - In a private/incognito window (or after clearing storage), both lists fall back to Tiles without console errors.
        - The center filter on `/data` and the search box on `/teachers` still narrow the list in either mode.
        - ←/→ arrow keys on the toggle switch segments and move focus correctly.
- [x] 5.3 **Structurally guaranteed.** `useViewMode` and `useSortableList` only touch `window.localStorage`; `<ViewModeToggle>` is a pure controlled component with no side effects. Neither `cycleSort` nor `setViewMode` calls axios. The toggle branches between two renderers of the same in-memory `sortedChildren` / `filteredTeachers` array — no fetch is reachable from any handler the toggle owns. (Confirmed by grep: no `axios.` call site is wired into any of the new files.)
