## Context

Two pages render transcripts from very similar payloads but with
disjoint JSX:

- `mockup1/src/pages/TeacherProfilePage.jsx` (lines 148–298) renders a
  rich `<div className="card bg-base-200 …">` per assessment with
  `highlightRAGSegments(assessment.transcript, …)`, a duration chip, a
  WPM badge, a compact per-category WPM tooltip, and four per-category
  word-count badges. It also has a per-row Delete button calling
  `DELETE /api/assessments/teacher/:assessmentId`.
- `mockup1/src/pages/ClassroomHomePage.jsx` (lines 549–648) renders a
  zebra `<table>` with a collapsible `<details>` block for the
  transcript text, no RAG highlights, no per-category metrics, no
  delete.

Both pages already have the data they need:

- `GET /api/assessments/teacher/:id` returns `assessments[]` with
  `ragSegments`, `categoryWPM`, `categoryWordCount`, `durationSeconds`,
  `transcript`, `date`, `activity`, `activityContext`, `uploadedBy`,
  `wordCount`, `wordsPerMinute`.
- `GET /api/classrooms/:id/transcripts` (controller verified in
  `backend/controllers/classroomController.js` ~line 580) returns
  `recordings[]` with the **exact same fields plus** a `source`
  discriminator (`"child" | "teacher"`), `teacherId`/`teacherName`, and
  `childId`/`childName`.

So the work is purely on the frontend: extract a shared card, drop the
zebra table, and replace the `.txt` blob with an `.xlsx` builder.

## Goals / Non-Goals

**Goals:**

- Both pages render identical-looking transcript cards (same JSX, same
  RAG highlight, same badge palette, same date formatting).
- Per-recording Delete is shown on the Classroom card only when the
  viewer is authorized.
- The Teacher-Profile "Download All" produces a structured `.xlsx` with
  a single sheet (one row per recording).
- The Classroom "Download as Excel" continues to produce its existing
  two-sheet workbook with no behavioral change.

**Non-Goals:**

- No backend changes — no new endpoints, no schema migrations.
- No change to the RAG-highlighting algorithm or color palette.
- No new retention rules — the 365-day classroom retention from
  `evolve-classroom-membership-and-transcripts` stays exactly as it is.
- No mobile-specific redesign — the existing card already collapses
  gracefully on narrow viewports.

## Decisions

### D1. One shared component, two callers

Build `mockup1/src/components/TranscriptRecordCard.jsx` taking these
normalized props (everything beyond `id`, `date`, `transcript` is
optional and falls back gracefully when missing):

```text
{
  id: string,                            // unique row key
  date: string|Date,                     // ISO or Date
  activity?: string,
  activityContext?: "home"|"school",
  uploadedBy?: string,
  attribution?: string,                  // e.g. "Recorded for: Alice" or "Teacher: Bob"
  durationSeconds?: number,
  wordCount?: number,
  wordsPerMinute?: number,
  categoryWPM?: { science, social, literature, language },
  categoryWordCount?: { science, social, literature, language },
  transcript: string,
  ragSegments?: Array,                   // pass-through to highlightRAGSegments
  onDelete?: () => void,                 // omit to hide the Delete button
}
```

The component is purely presentational — no fetching, no axios. The
caller owns the data shape transform and the auth check that decides
whether `onDelete` is set. This keeps the component testable in
isolation (no AuthContext mocking needed).

**Why one component instead of two near-identical ones**: spec
Requirement #1 (identical look) is structurally enforced — there's
nothing to drift.

### D2. Delete authority is computed by the caller

`TranscriptRecordCard` shows the Delete button iff `typeof onDelete ===
"function"`. The two callers do the auth check:

- `TeacherProfilePage`: always sets `onDelete` (the page itself is
  scoped to the signed-in teacher's own data; every recording belongs
  to them by construction).
- `ClassroomHomePage`: sets `onDelete` when
  - `user.role === "admin"` (admin can delete any recording in the room), **or**
  - `record.source === "teacher" && String(record.teacherId) === String(user.id)` (the recording's original uploading teacher).
  - For `record.source === "child"`, only admins get `onDelete`. The original uploader of a child recording could be a teacher, a parent, or an admin; the payload doesn't carry a reliable `uploaderId` for child recordings, so we fall back to admin-only to avoid silent permission gaps.

The two callers also wire `onDelete` to the right endpoint:

- `TeacherProfilePage` → `DELETE /api/assessments/teacher/:id` (existing).
- `ClassroomHomePage` → `DELETE /api/assessments/teacher/:id` for `source === "teacher"`; `DELETE /api/assessments/:id` for `source === "child"` (admin path).

The card itself never names an endpoint; it just calls `onDelete`.

### D3. Confirm + optimistic-ish removal

Both callers wrap `onDelete` with a `window.confirm(...)` — matching
the existing Teacher-Profile behavior — and refresh their underlying
list on success rather than splice locally. The classroom needs a full
refetch anyway because the per-category aggregations behind the dot
matrix and dials depend on the same data.

### D4. XLSX layout: rename the helper, support both layouts

`mockup1/src/utils/classroomExcel.js` is renamed (file kept under the
same path for the migration window) to expose:

```js
export function buildTranscriptsWorkbook(title, recordings, { layout })
// layout: "two-sheet" (default; existing classroom export)
//       | "single-sheet" (new; one row per recording, transcript is
//                         the last column)
```

For source compatibility the old export name remains:

```js
export function buildClassroomWorkbook(title, recordings) {
    return buildTranscriptsWorkbook(title, recordings, { layout: "two-sheet" });
}
```

The single-sheet layout's columns (in order):

```
Date | Uploaded By | Activity | Activity Context | Audio Length |
Total Words | Total WPM |
Science Words | Science WPM | Social-Emotional Words |
Social-Emotional WPM | Literacy Words | Literacy WPM |
Language Words | Language WPM | Transcript
```

Date cells are real `Date` values formatted `mm/dd/yyyy`. The header
row is bold and frozen so users can scroll the transcript column
without losing column labels.

### D5. Mass: render-cost mitigation

A teacher with 365 days of weekly recordings hits ~50 rows. We keep all
of them mounted (React handles ~50 cards trivially) and rely on each
card's existing `max-h-64 overflow-y-auto` transcript clamp to keep the
DOM bounded. **No virtualization in v1.** If a single classroom ever
crosses ~150 recordings we'll add a "Show older" pagination — design
hook is just `recordings.slice(0, visibleCount)` plus a small
`useState`; mentioned in tasks.md as a deferred follow-up, not built.

### D6. Filename convention

- TeacherProfile: `<teacher-name>_transcripts_<YYYY-MM-DD>.xlsx`
  (falls back to `my_classroom_transcripts_<YYYY-MM-DD>.xlsx` if the
  teacher's name isn't loaded yet — keeping the historical name when
  the file is otherwise anonymous).
- Classroom: `<classroom-name>_transcripts_<YYYY-MM-DD>.xlsx` (unchanged).

Both use the same sanitizer (`/[^a-z0-9-_]+/gi → "_"`).

## Risks / Trade-offs

- **Risk: child-recording delete confusion.** A teacher who recorded
  for a specific child might expect to delete that recording from
  inside the classroom view, but D2 hides the button for them. They
  can still delete it via the child's profile page. Tradeoff accepted:
  reliably gated > convenient-but-leaky.
- **Risk: silently-untested authorization paths.** Until backend
  add an `uploaderId` to child recordings, we can't expose owner-based
  delete on `source === "child"` recordings without risking silent
  no-ops. Logged as a follow-up in `proposal.md` rather than shoehorned
  into this change.
- **Risk: long classroom list scroll-jank.** Mitigated by per-card
  transcript clamps; if it becomes an actual issue we'll add the
  "Show older" expansion (see D5).
- **Trade-off: helper rename window.** `buildClassroomWorkbook` stays
  exported as a back-compat alias so existing imports don't break in
  the same commit. We can remove the alias in a follow-up once all
  callers have migrated to `buildTranscriptsWorkbook`.

## Migration Plan

Pure feature flip — no schema migration. Ship the component + the
helper rename + both page refactors together. Rollback is to revert
the two page files (and the helper rename) in a single commit.
