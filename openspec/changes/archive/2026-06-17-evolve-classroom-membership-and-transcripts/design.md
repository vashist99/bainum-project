## Context

After `add-classrooms` is applied, the system has a first-class `Classroom`
entity with `teacher`, `assistantTeacher`, `center`, `children[]`, and
`parents[]`. The parent-invite flow on the classroom homepage adds a parent
plus their selected children to the classroom. Recording fan-out, however,
still resolves "this teacher's children" by string-matching
`Child.leadTeacher` against `Teacher.name` (plus an `AccessGrant` fallback),
and transcripts are purged after 30 days regardless of where they came from.

This change pulls the rest of the data model into the classroom world and
extends retention to one year so educators can review a whole school year
in one place.

## Goals / Non-Goals

**Goals:**
- A classroom can be deleted, with predictable, safe cascade rules.
- Child membership is *only* expressed via classrooms. The old free-form
  `Child.leadTeacher` string disappears.
- The classroom homepage is the single place to read and export the
  classroom's transcripts, including per-category WPM.
- Every newly created transcript persists for one calendar year (one year
  from recording date) before being purged.
- The retention rule lives in exactly one place so future tweaks are one
  constant change away.

**Non-Goals:**
- Re-stamping historical assessments to extend their retention (out of
  scope; would surprise users who relied on the 30-day promise).
- A trash/restore feature for deleted classrooms (irreversible delete with
  a confirm dialog is enough for this iteration).
- Backfilling `Child.classrooms` from existing `Child.leadTeacher` values
  (we soft-deprecate and ask admins to re-enroll legacy children through
  the invite flow; auto-derivation would be heuristic and error-prone).
- Server-side Excel generation. Frontend `exceljs` is plenty for the
  expected row counts (hundreds at most).
- Changing the transcript purge cadence or visibility filter
  (`transcriptExpiresAt > now` still gates everything).

## Decisions

### D1. Delete-classroom semantics: severed, not cascaded

Deleting a classroom unlinks it from everything else but **does not delete
historical records**. Specifically:

- Each `Child.classrooms[]` array is pulled (`$pull`) of this classroom's id.
- The `Classroom` document itself is deleted.
- Existing `Assessment` / `TeacherAssessment` rows that were recorded
  through this classroom keep their text and metrics; we null out a
  forthcoming `classroomId` reference (if/when one is added — see D5) so
  the row is no longer mis-attributed.
- *Pending* `Invitation` rows targeting this classroom are **hard
  deleted** (`Invitation.deleteMany(...)`). They've never been accepted
  so there's no parent-side action to audit; keeping expired rows
  around would just clutter the invitation list and require special-
  casing the verify-token flow. *Accepted* invitations are left
  untouched because the parent already accepted; we just disassociate
  via the `Child.classrooms` pull and the `classroomId` null-out.
- `Teacher`, `Parent`, `Center`, and `Child` documents are untouched
  apart from the `classrooms[]` pull.

Rationale: per-child language-development charts and the teacher's
profile transcripts represent real recorded sessions that an
administrator shouldn't lose because a classroom was retired or renamed.
Deletion is about retiring the *grouping*, not the *evidence*.

Alternatives considered: hard delete everything (data loss too easy);
soft-delete with `deletedAt` flag (more correct long-term, but doubles
every query's branching with little payoff today).

### D2. Authorization on deletion: admin + lead teacher only

- Admin: always allowed.
- Lead teacher of the classroom: allowed (they own the classroom).
- Assistant teacher: NOT allowed (asymmetric authority is intentional;
  they can record, not retire).
- Parents: never.

Frontend hides the button for users who can't act; backend re-checks.

### D3. `Child.classrooms` is parent-invitation-driven, with an admin override

The default path: a child joins a classroom when **a parent of that
child accepts a classroom invitation that listed that child in its
selection**. The parent-acceptance step is the consent gate for the
ordinary flow, so teachers and assistant teachers never modify
membership directly — they invite, the parent accepts, the membership
records itself.

Admins get a manual override so the system isn't trapped in the
"the parent must do everything" failure mode (mis-enrollments,
mid-year transfers, demo data, sibling moves). The override is
intentionally narrow:

- Only `req.user.role === "admin"` can hit
  `PATCH /api/classrooms/:id/children`.
- The endpoint accepts exactly one of `{ addChildId, removeChildId }`
  per call; both together is a 400.
- Same-center rule still applies on `addChildId` — the child's
  effective center must match the classroom's center, otherwise 409.
- The cascade mirrors the invite-acceptance path:
  add → `$addToSet { classrooms: classroomId }` on `Child` and
  `$addToSet { children: childId }` on `Classroom`;
  remove → `$pull` on both.
- The endpoint does NOT add or remove parents — parent membership
  follows from the invitation flow and is unaffected.
- The endpoint emits a small audit field on the response so the
  frontend can toast something like "Admin manually enrolled
  <child>".

Teachers (lead or assistant) do NOT get this affordance even on
classrooms they own. Rationale: in the daily-use case the consent
gate matters; admin-only override is a recovery / setup tool.

Concretely:

- When `POST /api/invitations/accept` succeeds AND the invitation carries
  a `classroomId`, every accepted child in the invitation has the
  classroom id pushed into `Child.classrooms` (`$addToSet`) and added to
  `Classroom.children` and `Classroom.parents` (`$addToSet`).
- When the classroom is deleted (D1), every member child has the id
  pulled.
- When an admin removes a parent from a classroom (a future capability —
  out of scope here), the corresponding pull happens then.

Edge case: an invitation that does NOT carry a `classroomId` (legacy
invitation flow that just links a parent to children without enrolling
in a classroom) does not touch `Child.classrooms`. Backward compatible.

Alternatives considered:
- Admin-only manual enrollment: gives more control but adds an
  inconsistency with the classroom invite flow already speced in
  add-classrooms.
- Auto-derive from `child.leadTeacher` at first read: brittle, see D4.

### D4. `Child.leadTeacher` is removed (soft-deprecated for one release)

The Mongoose schema drops `leadTeacher` as a required field. To avoid a
hard migration:

- The schema keeps `leadTeacher_deprecated: { type: String, default: null }`
  for one release so admins can audit the old value via the API/DB.
- All code paths read from `Child.classrooms` →
  `Classroom.teacher`/`Classroom.assistantTeacher`.
- `getSupervisedChildrenForTeacher(teacher)` becomes:
  ```js
  const rooms = await Classroom.find({
    $or: [{ teacher: teacher._id }, { assistantTeacher: teacher._id }]
  }).select("children").lean();
  const childIds = [...new Set(rooms.flatMap((r) => r.children.map(String)))];
  return Child.find({ _id: { $in: childIds } });
  ```
- The `AccessGrant` fallback path stays — a teacher with an active grant
  for a child still gets that child in the fan-out even if the child
  isn't in any of their classrooms yet.
- `AddChildForm` no longer asks for a lead teacher; the form now shows a
  note that "Classrooms are set when a parent accepts an invitation".

Alternatives considered:
- Keeping `leadTeacher` as a `Classroom._id` reference instead of removing
  it: confusing, since a child can be in multiple classrooms.
- Hard-removing on the same release without `leadTeacher_deprecated`: no
  audit trail for surprise data quality issues.

### D5. New `classroomId` on Assessment/TeacherAssessment (optional)

To make per-classroom transcript queries cheap and to make the deletion
cascade meaningful, add an optional `classroomId: ObjectId, ref: "Classroom"`
field to both `Assessment` and `TeacherAssessment` (default `null`).
Classroom-scoped recordings (today, the "Aggregated classroom recording"
from add-classrooms) set this at save time. Per-child / per-teacher
recordings that don't run through a classroom flow leave it null.

This makes:
- `GET /api/classrooms/:id/transcripts` a single indexed query
  (`{ classroomId, ...visibility }`).
- D1's "null out the reference on delete" precise and indexed.

Indexes:
- `Assessment.classroomId` (sparse)
- `TeacherAssessment.classroomId` (sparse)

### D6. Excel export is built on the client with exceljs

The frontend already holds the data needed for the export (it just
fetched it to render the Transcripts card), so building the xlsx in the
browser keeps:

- Backend simple — no `Content-Type: application/vnd.openxmlformats-...`
  plumbing, no temp-file handling.
- Latency low — no extra round-trip.
- Permissions clean — whoever could read the card can export it.

`exceljs` ships an in-browser bundle; we add it as a frontend dep and
trigger a `Blob` download from the Transcripts card's "Download as
Excel" button.

Sheet layout:

| Sheet | Columns |
| --- | --- |
| Recordings | Date, Uploaded By, Activity, Audio Length, Total Words, Total WPM, Science Words, Science WPM, Social-Emotional Words, Social-Emotional WPM, Literacy Words, Literacy WPM, Language Words, Language WPM |
| Transcripts | Date, Uploaded By, Activity, Transcript |

Per-category word counts come from `Assessment.categoryWordCount`
(already computed at recording time); WPMs come from
`Assessment.categoryWPM`. The total words and total WPM use
`Assessment.wordCount` and `Assessment.wordsPerMinute`.

Date is rendered as a true Excel date (`worksheet.getCell(...).numFmt`)
so users can re-sort in Excel.

Alternatives considered: server-side generation with `exceljs` on Node
(more reusable but more code paths); CSV instead of XLSX (loses date
formatting and multi-sheet structure that the user asked for).

### D7. Retention rule lives in one module

`backend/lib/transcriptRetention.js` exports:
```js
export const TRANSCRIPT_RETENTION_DAYS = 365;
export function transcriptExpiryFrom(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + TRANSCRIPT_RETENTION_DAYS);
  return d;
}
```

Both controllers/routes import from this module instead of defining
their own `addOneMonth`. The function uses `setDate(+365)` rather than
`setFullYear(+1)` so a recording on Feb 29 simply lands on Feb 28 of
the next year rather than throwing.

Alternative considered: "until end of next calendar year" (e.g., a
recording made Jan 1 lasts ~2 years, a recording made Dec 31 lasts ~1
year). Rejected — the user confirmed 365 days from recording date —
because it makes the rule harder to explain and reason about.

## Risks / Trade-offs

- **[Risk] Recording fan-out drops legacy children whose only signal was
  `Child.leadTeacher`** (no classrooms, no AccessGrant). →
  Mitigation: keep the AccessGrant fallback in
  `getSupervisedChildrenForTeacher`; document that admins need to send a
  classroom invitation to (re-)enroll legacy children. The deprecated
  string remains visible in the DB for audit.
- **[Risk] Deleting a classroom looks "free" but cascades touch every
  member child** (`$pull` in `Child.classrooms`). For very large
  classrooms this is many writes. → Mitigation: do the pull as a single
  `updateMany({ _id: { $in: members } }, { $pull: { classrooms: id } })`
  rather than per-child writes.
- **[Risk] Storage growth.** Holding transcripts for a full year extends
  retention 12× from today. → Mitigation: accepted; estimated worst-case
  growth is still modest at this scale (recordings are short text
  blobs). Re-evaluate if total storage ever exceeds the hosting tier's
  free allotment.
- **[Risk] Excel export of very large classrooms could lock the browser.**
  → Mitigation: 100s of rows expected, well within exceljs's
  client-side capacity; if it ever becomes an issue we move generation
  server-side.
- **[Trade-off] Soft-deprecating `leadTeacher` for one release means
  there are *two* fields with related semantics for a window.** Worth
  it to give administrators a way to audit old data before fully
  removing the field.

## Migration Plan

1. Ship `backend/lib/transcriptRetention.js` and switch both call sites
   to use it — pure refactor, zero behavior change at this point.
2. Bump the constant to 365 in the same commit so deployment of step 1
   immediately starts giving new transcripts a one-year lifetime.
3. Add `classroomId` to `Assessment` and `TeacherAssessment`
   schemas with default `null` and sparse indexes (additive migration).
4. Ship the `DELETE /api/classrooms/:id` endpoint and Delete UI behind
   role gates. No data migration required.
5. Add `Child.classrooms` field. In the same release, change
   `getSupervisedChildrenForTeacher` to read from `Classroom`s. Keep
   the AccessGrant fallback.
6. Wire the classroom-invite acceptance path to write
   `Child.classrooms`. Existing accepted invitations are NOT
   back-filled; admins re-enroll legacy children by re-sending an
   invitation.
7. Hide the Lead Teacher dropdown in `AddChildForm` / `EditChildForm`.
   Rename `Child.leadTeacher` to `Child.leadTeacher_deprecated` in the
   schema. Update any reader still referencing the field to a no-op or
   to `leadTeacher_deprecated` for audit only.
8. Ship `GET /api/classrooms/:id/transcripts` and the Transcripts card +
   "Download as Excel" button.

Rollback: revert in reverse order. Steps 1–4 are independently
reversible; step 5+ requires re-adding `Child.leadTeacher` as required
and reverting the fan-out helper to its current shape.

## Resolved Open Questions

All four questions raised during proposal review have been answered;
they remain logged here for posterity.

- **Q1 (retention semantics)** → **Resolved**: 365 days from recording
  date (`setDate(d + 365)`). Captured in D7.
- **Q2 (Excel columns)** → **Resolved**: include per-category word
  counts alongside the WPMs (Recordings sheet gains Science Words,
  Social-Emotional Words, Literacy Words, Language Words). Captured
  in D6.
- **Q3 (pending invitations on classroom delete)** → **Resolved**:
  hard delete pending invitations on classroom delete. Captured in
  D1. Accepted invitations are not touched.
- **Q4 (manual admin enrollment)** → **Resolved**: in scope, admin
  only (not lead or assistant teacher). New endpoint
  `PATCH /api/classrooms/:id/children` with `{ addChildId |
  removeChildId }` payload, gated by `req.user.role === "admin"` and
  same-center on add. Captured in D3.
