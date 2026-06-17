## Context

Child notes today:
- Mongo `Note` documents with required `childId`, `content`, `author`,
  optional `authorId`, `timestamp`.
- Routes at `/api/notes` with **no JWT middleware** (security gap this change
  closes).
- `ChildDataPage` loads `GET /api/notes/child/:childId`, posts `POST /api/notes`,
  deletes via `DELETE /api/notes/:noteId`. UI is a card with textarea, note
  list, author + timestamp, delete button.

Classroom homepage (`ClassroomHomePage`) has transcripts, children roster,
charts — no notes.

Parent notifications today:
- `Notification` model with types `classroom-added` | `classroom-removed`,
  10-day TTL, `classroomId` + `classroomName` snapshots.
- `notificationService.js` creates rows; failures never roll back business
  writes.
- Bell uses `routeTargetForNotification()` for navigation.

## Goals / Non-Goals

**Goals:**

- Classroom homepage notes section visually and behaviorally aligned with child
  data page notes.
- One note collection with discriminated scope: `childId` XOR `classroomId`.
- Staff (admin / teacher) note creation fans out `child-note-added` or
  `classroom-note-added` notifications to relevant parents only.
- Parents enrolled in a classroom can **read** classroom notes in read mode;
  manage-mode staff can add/delete.
- Bell navigates note notifications to the correct child or classroom page.
- Notification failures logged; note save still succeeds.

**Non-Goals:**

- Email or push notifications (in-app bell only, same as existing pattern).
- Notifying teachers when parents add notes.
- Notifying parents when other parents add notes (parents are not note authors
  on classroom pages in manage mode).
- Editing notes beyond existing `PUT` (out of scope unless trivial to keep).
- Real-time WebSocket delivery.

## Decisions

### D1 — Extend `Note` schema rather than a second collection

**Choice:** Add optional `classroomId` ref; relax `childId` to optional;
application validates exactly one scope is set on create.

**Rationale:** Same list UI, same author/timestamp shape, one controller module.

### D2 — Secure all note routes

**Choice:** Mount `protect` middleware on `noteRoutes`; controller checks:

| Action | Child note | Classroom note |
|--------|------------|----------------|
| Read child note | parent of child, supervising teacher, admin | — |
| Read classroom note | enrolled parent (read), manage staff, admin | |
| Create | parent of child, supervising teacher w/ grant, admin | manage staff, admin |
| Delete | same as create + author match optional | manage staff, admin |

Reuse existing helpers: `parentMayAccessChild`, classroom `findAuthorizedClassroom`
mode, `hasActiveTeacherChildGrant`, `getSupervisedChildrenForTeacher` patterns.

**Rationale:** Closes unauthenticated gap; aligns with rest of API.

### D3 — Notification types and snapshots

**Choice:** Add to `Notification.type` enum:

- `child-note-added` — fields: `childId`, `childName` (snapshot), optional
  `classroomId` null; message: `New note on <child name>'s page`
- `classroom-note-added` — fields: `classroomId`, `classroomName`; message:
  `New note in classroom: "<name>"`

Same 10-day TTL. No read/unread tracking.

**Fan-out rules:**

- `POST` child note + `req.user.role` in `admin|teacher` → all `Parent` docs
  linked to `childId` (via `child.parents` or `Parent.childIds` containing
  child).
- `POST` classroom note + staff → all parents in `Classroom.parents[]` for
  that room.
- Skip notification when `req.user.role === 'parent'` (parent-authored notes).

**Alternatives:** Single generic `note-added` type — rejected; bell routing
needs distinct targets.

### D4 — Shared `NotesSection` component

**Choice:** Extract presentational + data hooks from `ChildDataPage` into
`NotesSection.jsx`:

```jsx
<NotesSection
  scope={{ type: 'child', id: childId }}
  canWrite={...}
  apiBase="/api/notes"
/>
```

Classroom page passes `scope={{ type: 'classroom', id }}` and `canWrite` from
`role !== 'parent'`.

**Rationale:** Avoid duplicating 80+ lines of markup; keeps parity.

### D5 — Classroom parent read mode

**Choice:** Parents in read mode see the notes list but **no** add/delete
controls (matches hiding Record / Add Parents). Staff in manage mode get full
notes UI.

### D6 — Bell routing

Extend `routeTargetForNotification`:

- `child-note-added` + `childId` → `/data/child/<childId>`
- `classroom-note-added` + `classroomId` → `/classrooms/<classroomId>`

## Risks / Trade-offs

- **[Risk] Adding auth breaks anonymous note calls** → Mitigation: frontend
  already uses axios with JWT; audit any other callers.
- **[Risk] Parent spam if staff bulk-add notes** → Mitigation: one notification
  per note create (expected); TTL auto-expires in 10 days.
- **[Risk] Mongoose enum migration for Notification.type** → Mitigation: additive
  enum values only; deploy backend before frontend bell routing update.

## Migration Plan

1. Deploy backend: schema + enum + secured routes + fan-out (frontend child
   notes keep working with auth header already present).
2. Deploy frontend: shared `NotesSection`, classroom homepage section, bell
   routing.
3. Rollback: revert commits; orphaned notifications TTL out naturally.

## Open Questions

- None blocking. Per-note edit UI for classroom notes can reuse existing `PUT`
  if already authorized.
