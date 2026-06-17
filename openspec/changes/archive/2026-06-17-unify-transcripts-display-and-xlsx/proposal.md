## Why

The two places that surface raw transcripts today look and behave very
differently:

- **`/teacher-profile`** renders one rich card per recording — calendar
  icon, activity badge, **RAG-color highlighted transcript** body, audio
  duration, total + per-category WPM, per-category word-count badges
  (Science / Social / Literature / Language), and a Delete button.
- **`/classrooms/:id`** renders a compact zebra `<table>` (Date · Activity
  · Uploaded By · Words · WPM · collapsible `<details>` block) with no
  RAG highlights, no per-category badges, no per-recording delete.

Teachers viewing both pages in the same week have to mentally translate
between the two layouts. The classroom recordings carry *exactly* the
same fields (`ragSegments`, `categoryWPM`, `categoryWordCount`,
`durationSeconds`, …) — the difference is purely presentational and
has been confusing in user testing.

Separately, the Teacher-Profile "Download All" button currently produces
a flat `.txt` file by concatenating transcripts as strings. That's
strictly worse than the Classroom page's `.xlsx` export, which is sortable
and filterable in Excel and includes structured per-category metrics.

## What Changes

- **Unify the visual display**: the Classroom transcripts section adopts
  the Teacher-Profile card layout (one card per recording, RAG-highlighted
  transcript, per-category badges, audio length, total + per-category WPM).
- **Extract a shared component** `<TranscriptRecordCard />` so both pages
  render the exact same JSX. Pages map their data into one normalized
  shape (`{ id, source, date, activity, activityContext, uploadedBy,
  transcript, ragSegments, durationSeconds, wordCount, wordsPerMinute,
  categoryWPM, categoryWordCount, canDelete, onDelete }`) and feed it in.
- **Per-recording Delete on the Classroom card** is shown when the viewer
  is admin OR (for teacher-source recordings) the original uploading
  teacher. Child-source recordings allow delete only to admins. The card
  calls the appropriate existing endpoint based on `source`:
  - `source === "teacher"` → `DELETE /api/assessments/teacher/:id`
  - `source === "child"`   → `DELETE /api/assessments/:id` (admin-only)
- **Teacher-Profile Download All switches from `.txt` to `.xlsx`** using
  a single combined sheet (one row per recording, every metric + the
  transcript text as the last column). Internally we generalize the
  existing `buildClassroomWorkbook` helper into a transcript-neutral
  `buildTranscriptsWorkbook(title, recordings, { layout })` that
  supports both the existing classroom two-sheet layout and the new
  single-sheet layout.
- **No backend changes.** `GET /api/classrooms/:id/transcripts` already
  returns every field the rich card needs (verified — see design.md).
  The existing `DELETE /api/assessments/teacher/:id` and
  `DELETE /api/assessments/:id` endpoints stay as-is.

## Capabilities

### New Capabilities

- `transcripts-display-and-export`: shared transcript card component
  used by both Teacher-Profile and Classroom pages, plus the unified
  XLSX export contract that both pages now use.

### Modified Capabilities

- (none — neither the Classroom nor the Teacher-Profile page has an
  existing OpenSpec capability that describes its transcript display
  in baseline specs today; this change introduces the shared one for
  the first time.)

## Impact

- **Frontend**:
  - New `mockup1/src/components/TranscriptRecordCard.jsx` — shared per-recording card with RAG highlighting, badges, optional Delete.
  - Refactor `mockup1/src/utils/classroomExcel.js` → renamed/extended `buildTranscriptsWorkbook(title, recordings, { layout: "two-sheet" | "single-sheet" })`. Keep `buildClassroomWorkbook` as a thin re-export for compatibility.
  - `mockup1/src/pages/TeacherProfilePage.jsx` — replace inline transcript-card JSX with `<TranscriptRecordCard />`, swap the `.txt` blob download for the `.xlsx` builder.
  - `mockup1/src/pages/ClassroomHomePage.jsx` — replace the zebra-table section with a list of `<TranscriptRecordCard />`s. The "Download as Excel" button is unchanged.
- **Backend**: none.
- **Tests**:
  - Update `mockup1/tests/unit/classroomExcel.test.js` to cover both layouts of the renamed helper (existing tests stay green via the compatibility wrapper; add tests for the single-sheet layout).
  - Add unit tests for `<TranscriptRecordCard />`'s authority logic (when `onDelete` is omitted, the button is not rendered).
- **Risk**: low–medium. The Classroom transcripts list can be long (365 days of recordings); switching from a single `<table>` to N rich cards may impact render performance on very busy classrooms. Mitigation: keep the transcript body inside the same collapsible affordance, render at most the most recent N (≈50) cards eagerly with a "Show older recordings" expand button if the count exceeds that threshold. Detailed thresholds live in design.md.
