## 1. Shared frontend primitives

- [ ] 1.1 Create `mockup1/src/components/ViewModeToggle.jsx` — two-segment "Tiles | Table" pill controlled component (`value`, `onChange`).
- [ ] 1.2 Create `mockup1/src/hooks/useViewMode.js` — `useViewMode(pageKey)` reads/writes `localStorage` key `data-view-mode:<pageKey>`, defaults to `"tiles"`, wraps reads/writes in try/catch.
- [ ] 1.3 Create `mockup1/src/hooks/useSortableList.js` — `useSortableList(items, pageKey, columns)` reads/writes `localStorage` key `data-sort:<pageKey>`, exposes `{ sortedItems, activeSort, cycleSort(columnKey) }` cycling asc → desc → cleared.
- [ ] 1.4 Unit test the hooks: default value, persistence round-trip, asc/desc/cleared cycle, unknown column key falls back to cleared state.

## 2. Children list (`/data`)

- [ ] 2.1 In `mockup1/src/pages/DataPage.jsx`, factor the existing children renderer so the *outer card* is shared and the body can switch between a tile renderer and a table renderer.
- [ ] 2.2 Add the new tile renderer for Children mirroring the look of the current Teachers tile cards (name, lead teacher chip, last recording date, action buttons).
- [ ] 2.3 Wire `<ViewModeToggle>` into the Children section header using `useViewMode("children")`.
- [ ] 2.4 Define `childrenColumns` (key, label, getter, sortable) and pass to `useSortableList` so the existing table headers become sort buttons with asc/desc/cleared indicators (▲/▼/none). Non-sortable columns (avatar, actions) are opted out.
- [ ] 2.5 Confirm filters/search/pagination already on the page continue to work in both modes.

## 3. Teachers list

- [ ] 3.1 In `mockup1/src/pages/TeachersPage.jsx`, wrap the existing teacher tile grid behind a renderer switch identical in shape to the Children one (do NOT touch the embedded children-per-teacher table).
- [ ] 3.2 Add the new table renderer for Teachers (name, center, education, lead-of count, assistant-of count, last recording — adjust to match the current tile fields).
- [ ] 3.3 Wire `<ViewModeToggle>` into the Teachers section header using `useViewMode("teachers")`.
- [ ] 3.4 Define `teachersColumns` and pass to `useSortableList`.
- [ ] 3.5 Apply the same view-mode + sort behavior to the Teachers list rendered on `/data` (DataPage.jsx) using the same `pageKey: "teachers"` so the choice carries across pages.

## 4. Visual / accessibility polish

- [ ] 4.1 Toggle uses `role="tablist"` with `aria-selected` on segments and reacts to ←/→ arrow keys.
- [ ] 4.2 Sortable headers are buttons with `aria-sort="ascending|descending|none"` and a visible indicator.
- [ ] 4.3 Active segment, focus rings, and hover states match existing project styling (DaisyUI `btn`/`badge` primitives, `forest` theme).

## 5. Verification

- [ ] 5.1 Run `npm run lint` in `mockup1/` — passes.
- [ ] 5.2 Manually verify in `npm run dev`:
        - First load defaults to Tiles on both pages.
        - Switching to Table on Children persists across reload.
        - Sorting Children by "Last recording" desc persists across reload.
        - Switching `/data` Teachers to Table is reflected on `/teachers` Teachers list and vice-versa.
        - Disabling `localStorage` (DevTools → Application → Local storage → Clear, or private window) falls back to Tiles without console errors.
        - Search/filter still narrow the list in both modes.
- [ ] 5.3 Confirm no new network requests are issued by the toggle (DevTools Network tab).
