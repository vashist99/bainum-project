## 1. Shared components

- [x] 1.1 Add `mockup1/src/components/SearchField.jsx` with bordered
      `label.input.flex.items-center.gap-2`, Lucide search icon (`shrink-0`),
      and `input` with `grow min-w-0`; support `className`, `placeholder`,
      `value`, `onChange`, optional `inputSize` (`input-sm` default).
- [x] 1.2 Add unit test asserting SearchField renders icon and input in one
      flex row with `items-center` on the label.

## 2. Navbar avatar alignment

- [x] 2.1 Update `Navbar.jsx` user-menu button: remove conflicting `avatar`
      class; use explicit `h-10 w-10 flex items-center justify-center
      rounded-full bg-primary` inner span with centered `Users` icon.
- [x] 2.2 Verify notification bell and avatar align on 375px and 1280px
      viewports (manual smoke).

## 3. Search field rollout

- [x] 3.1 Replace Schools page `input-group` search with `SearchField`.
- [x] 3.2 Replace Teachers page `input-group` search with `SearchField`.
- [x] 3.3 Replace Classrooms page inline search markup with `SearchField`
      (preserve placeholder text and styling).

## 4. Responsive list toolbars

- [x] 4.1 Schools page: `p-4 sm:p-6` root; header toolbar
      `flex-col sm:flex-row` with full-width controls below `sm`; wrap table
      in `overflow-x-auto min-w-0` card boundary.
- [x] 4.2 Teachers page: same toolbar and padding pattern as Schools; ensure
      stats grid and list header do not force shell overflow on 375px.
- [x] 4.3 Data page Children section: responsive page header; Children list
      card toolbar stacks on narrow viewports; table wrapper has
      `overflow-x-auto min-w-0`.

## 5. Transcript card mobile polish

- [x] 5.1 Update `TranscriptRecordCard.jsx`: responsive header
      (`flex-col gap-2 sm:flex-row`), `break-words` on body, wrapping badge
      rows, delete button `self-end sm:self-start` with ≥44px tap target.
- [x] 5.2 Spot-check transcript lists on `ClassroomHomePage`,
      `TeacherProfilePage`, and `ChildDataPage` at 375px — no page-level
      horizontal scroll.

## 6. Tests and validation

- [x] 6.1 Add or extend frontend unit test for TranscriptRecordCard narrow
      layout (badges wrap, delete button present, no required width class on
      card root).
- [x] 6.2 Run `npm test` in `mockup1` and fix any regressions.
- [x] 6.3 Manual smoke: `/schools`, `/teachers`, `/data` (Tiles + Table),
      `/classrooms`, classroom transcripts at 375px and 1280px — confirm
      centered avatar, aligned search icons, no shell horizontal scroll.
