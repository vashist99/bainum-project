## Context

The mockup frontend uses DaisyUI + Tailwind. List pages evolved independently:
`ClassroomsPage` wraps search in `label.input.flex.items-center.gap-2`, while
`SchoolsPage` and `TeachersPage` use DaisyUI `input-group` with a bare
`<span>` around the Lucide `Search` icon — the span lacks flex centering and
height matching, so the icon floats above or beside the input baseline.

The navbar user menu combines `btn btn-circle avatar` with a nested
`w-10 rounded-full flex` div. DaisyUI's `.avatar` rules set unequal padding
and image sizing on the placeholder, which nudges the `Users` icon off-center
relative to the green (`bg-primary`) circle.

`AppLayout` already sets `min-w-0` on the content column so tables can shrink,
but several page roots use fixed `p-6` and header rows with `flex items-center
gap-3` that do not wrap, and some tables sit outside an explicit
`overflow-x-auto` card boundary on Schools.

`TranscriptRecordCard` is shared between classroom and teacher-profile pages.
Its header row is `flex justify-between items-start` with badges in a flex-wrap
title; on ~320px widths the delete button can sit tight against long badge rows
unless `gap` and `min-w-0` are enforced.

## Goals / Non-Goals

**Goals:**

- One canonical search-field component used on every searchable list page.
- Navbar avatar icon optically centered in its circle at all breakpoints.
- Phone viewports (320–639px): no horizontal scroll on `body`/app shell;
  tables scroll inside their card; toolbars stack without overlap.
- Transcript cards remain readable: body text wraps, badges stack, delete
  control stays tappable (≥44px target) without covering content.
- Preserve existing view-mode persistence, sort behavior, and transcript
  visual parity across pages.

**Non-Goals:**

- Redesigning color palette, typography scale, or sidebar structure.
- Changing default Tiles vs Table preference or sort keys.
- Building a separate mobile-only navigation pattern.
- Backend pagination or new breakpoints beyond standard Tailwind `sm`/`lg`.

## Decisions

### D1 — Shared `SearchField` component

**Choice:** Add `SearchField.jsx` with:

```jsx
<label className="input input-bordered flex items-center gap-2 w-full sm:w-64">
  <Search className="w-4 h-4 shrink-0 opacity-50" aria-hidden />
  <input type="search" className="grow min-w-0" … />
</label>
```

**Rationale:** Matches the working ClassroomsPage pattern; `items-center` on
the label aligns icon and text baseline; `grow min-w-0` prevents flex overflow.

**Alternatives:** Fix `input-group` spans with `flex items-center justify-center
px-3` per page — rejected because it duplicates markup three times.

### D2 — Navbar avatar markup

**Choice:** Remove conflicting DaisyUI `avatar` class from the button; use:

```jsx
<button className="btn btn-ghost btn-circle" …>
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content">
    <Users className="h-5 w-5 shrink-0" strokeWidth={2} />
  </span>
</button>
```

**Rationale:** Explicit square flex box centers the SVG; `shrink-0` prevents
Lucide default sizing quirks; `btn-circle` on outer button keeps hit area round.

**Alternatives:** DaisyUI `avatar placeholder` — rejected; still fights custom
primary background.

### D3 — Responsive list toolbars

**Choice:** Standard toolbar wrapper:

`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end`

with search `w-full sm:w-auto`, toggle group and primary button
`w-full sm:w-auto` on Schools/Teachers/Data headers.

**Rationale:** Mirrors ClassroomsPage header; full-width tap targets on mobile.

### D4 — Table mode on narrow viewports

**Choice:** Keep Table mode available on phones; wrap every data table in:

`div.overflow-x-auto.-mx-…` inside the card **or** `overflow-x-auto w-full
min-w-0` without negative margin if padding already adequate. Optionally add
`table-sm` below `sm` via responsive class if row height is excessive.

Do **not** auto-switch to Tiles on resize — persisted preference stays honored;
horizontal scroll is scoped to the table card only.

**Rationale:** Spec-level requirement in `data-view-toggle` says viewer picks
mode; auto-switch would violate persistence expectations.

**Alternatives:** Force Tiles below `sm` — rejected.

### D5 — Transcript card mobile layout

**Choice:** Header becomes `flex flex-col gap-2 sm:flex-row sm:justify-between
sm:items-start`; delete button row-aligned `self-end sm:self-start`; metadata
footer keeps `flex-wrap gap-2`; transcript body keeps `max-h-64 overflow-y-auto`
with `text-sm leading-relaxed break-words`.

**Rationale:** Column stack on mobile separates delete from badge cluster;
`break-words` handles long tokens in transcripts.

### D6 — Page padding consistency

**Choice:** Use `p-4 sm:p-6` on Schools and Teachers page roots to match
ClassroomsPage and reduce edge clipping on 320px devices.

## Risks / Trade-offs

- **[Risk] Horizontal table scroll is still required on very narrow phones** →
  Mitigation: confine scroll to card; sticky first column deferred unless user
  feedback demands it.
- **[Risk] `SearchField` width `sm:w-64` may feel short on tablet** →
  Mitigation: parent toolbar is full width; can use `sm:max-w-md w-full`.
- **[Risk] Visual regression on desktop** → Mitigation: limit class changes to
  responsive prefixes and shared component; manual smoke at 1280px and 375px.

## Migration Plan

Deploy as a frontend-only release. No migrations. Rollback is a single revert
of mockup1 CSS/markup changes.

## Open Questions

- None blocking implementation. Sticky first table column can be a follow-up if
  field testing on iPhone SE shows confusion during horizontal scroll.
