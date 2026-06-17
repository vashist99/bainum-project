## Context

Parents today open **Record Activity** from the Dashboard (`HomePage.jsx`). `ActivityRecordingModal` fans recordings to **every** child linked to the parent via `resolveTargetChildren` in `activityRecordingController.js`. Activity and location pickers already exist with grouped home activities (`activities.js`) and flat geographic home locations (`locations.js`), both AI-vetted through shared validators and `VettedLabelSelect`.

Stakeholders want a dedicated **Home** sidebar destination, single-child targeting, and home **location** labels that describe daily routines/settings (mealtime, free play, screen time) rather than geographic places (Park, Museum).

## Goals / Non-Goals

**Goals:**

- Parent-only **Home** nav item and page for record/upload home-context audio.
- Required **child selector** when a parent has one or more linked children; assessments saved for the selected child only.
- Replace the parent (`home`) **location** predefined catalog with the stakeholder routine/setting list; keep school locations and all vetting rules unchanged.
- Confirm the parent (`home`) **activity** grouped catalog matches the stakeholder list (already largely implemented; sync and test).
- Remove the Dashboard **Record Activity** card so Home is the single entry point.

**Non-Goals:**

- Changing teacher/admin classroom recording flow or school activity/location catalogs.
- Remembering previously accepted custom labels across sessions.
- Parent multi-child batch upload (one recording → many children) — explicitly replaced by single-child selection.
- Analytics/filter UI by location or activity.

## Decisions

1. **Route and nav: `/home/recording` with sidebar label "Home".**
   - Dashboard stays `/home` labelled **Dashboard** (classrooms overview).
   - **Home** uses a distinct icon (`Radio` or `Mic`) to avoid duplicating the Dashboard `Home` icon confusion.
   - Alternative — embed recording on Dashboard — rejected: stakeholders asked for a dedicated tab.

2. **Page vs modal: full page hosting the existing recording form.**
   - Extract the form body from `ActivityRecordingModal` into a shared component (e.g. `ActivityRecordingForm`) used by the new `ParentHomeRecordingPage` and optionally kept for teacher reuse later.
   - Alternative — keep modal opened from Home tab — rejected: a tab should land on a page, not a hidden modal.

3. **Child selection is required for parents and enforced server-side.**
   - Upload/accept bodies include `childId` (Mongo ObjectId string).
   - `resolveTargetChildren` for parents: if `childId` present, verify via `getResolvedChildIdStringsForParent` + `parentHasAccessToChild`; return that one child. If missing → 400.
   - Teacher flow unchanged (still fans out to supervised children).
   - Alternative — optional childId defaulting to primary — rejected: explicit choice avoids mis-attribution.

4. **Replace home location catalog; default to first list item.**
   - New predefined home locations (exact strings):
     - Mealtime or snacks
     - Personal Care (e.g., dressing, bathing, brushing teeth)
     - Play/free play (e.g., blocks, puzzles, cars & trucks)
     - Screen time (e.g., show, iPad / tablet / video games)
     - Reading or looking at books
     - Outdoor play (e.g., playing soccer, swinging)
     - Clean up (e.g., picking up toys)
     - Structured Activities (non-free play activities such as circle time, art, small group)
   - Plus UI sentinel **Other (please specify)** → AI vetting (unchanged mechanism).
   - Default picker value: **Play/free play (e.g., blocks, puzzles, cars & trucks)** (most common home recording context).
   - Legacy assessments retaining geographic labels (e.g., "Park") continue to display; they are simply no longer predefined in the picker.

5. **Home activity catalog: align backend/frontend with stakeholder groups (already in code).**
   - Eight categories with the exact activity strings from the request; global **Other (please specify)** via existing `CUSTOM_ACTIVITY_VALUE` (not per-category Other rows except where "Other" is itself a predefined structured-activity label).
   - Unit test asserts backend `PREDEFINED_ACTIVITY_GROUPS.home` matches the spec list.

6. **Dashboard cleanup.**
   - Remove parent "Recording Tools" / Record Activity card from `HomePage.jsx`.
   - Keep "View My Child's Data" shortcut or rely on existing **My Child's Data** sidebar item (keep shortcut if low cost).

## Risks / Trade-offs

- **[Parents with one child still must confirm selection]** → Pre-select the only linked child in the UI; still send `childId` on submit.
- **[Breaking change for API clients sending parent recordings without childId]** → Return clear 400; only parent role affected; teachers unchanged.
- **[Geographic locations on historical data vs new routine labels]** → Display-only legacy strings; no migration.
- **[Catalog drift backend/frontend]** → Existing cross-file comments + catalog parity unit tests extended for locations.
- **[Long location strings in narrow UI]** → Reuse `VettedLabelSelect` with truncation/wrap; page layout scrollable.

## Migration Plan

1. Deploy backend first (accepts optional `childId`; required for new parent uploads once frontend ships).
2. Deploy frontend with Home tab, updated catalogs, child selector.
3. No database migration; existing multi-child fan-out recordings remain on all linked children.
4. Rollback: revert frontend nav; backend tolerates missing `childId` only if rollback restores old fan-out behavior (coordinate both or feature-flag).

## Open Questions

- Should the Home page also list recent home recordings for the selected child? **Deferred** — out of scope; child data page already lists assessments.
- Icon label collision: sidebar shows both "Dashboard" and "Home" — confirm with stakeholders in usability pass.
