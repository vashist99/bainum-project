## Context

Classroom recordings use a two-step flow: `POST /api/whisper/classroom`
transcribes and returns a draft; `POST /api/assessments/teacher/accept` with
`classroomId` persists `TeacherAssessment` and fans out per-child `Assessment`
rows. Only staff (admin / teacher) can run this accept path via
`ClassroomUploadModal`.

Parent notifications already support `classroom-added`, `classroom-removed`,
`child-note-added`, and `classroom-note-added` with 10-day TTL, REST polling
bell, and `notificationService.js` fan-out helpers.

`ClassroomCard` already links enrolled children to `/data/child/:id` for
parents; `ClassroomHomePage` children list still uses plain text.

## Goals / Non-Goals

**Goals:**

- Notify every parent in `classroom.parents[]` when staff accept a classroom
  recording.
- Message: `New recording in classroom: "<classroomName>"`.
- Bell click navigates to `/classrooms/<classroomId>` (transcripts section on
  same page).
- Child names on classroom homepage link to `/data/child/<childId>`.
- Notification errors never roll back the assessment write.

**Non-Goals:**

- Notify teachers or admins about recordings they just saved.
- Notify on whisper upload, reject, or non-classroom teacher accepts.
- Per-child notification rows (one per recording event, not per fan-out child).
- Deep-link to a specific transcript row or child page from the notification.
- Archive the completed `add-classroom-notes-and-note-notifications` change.

## Decisions

### D1 — Trigger on `teacher/accept` with `classroomDoc`

**Choice:** After `TeacherAssessment.save()` and child fan-out succeed inside
`POST /api/assessments/teacher/accept`, when `classroomDoc` is non-null and
`req.user.role` is `admin` or `teacher`, call
`fanOutClassroomRecordingAddedNotifications`.

**Rationale:** Matches “recording added” semantics (saved after review).
Reject path never hits accept.

**Alternatives:** Hook on whisper upload — wrong moment; parents would be
notified before transcript is confirmed.

### D2 — Recipients and message

**Choice:** One notification per parent in `classroom.parents[]`;
`recipientRole: "parent"`; `type: "classroom-recording-added"`; message
`New recording in classroom: "<name>"`; snapshot `classroomName` at create
time.

**Rationale:** Same audience as `classroom-note-added`; user chose this wording
and classroom homepage as navigation target.

### D3 — No idempotency dedupe

**Choice:** Each accept emits fresh notifications (no `Notification.exists`
check).

**Rationale:** Every saved recording is a distinct event; unlike
`classroom-added`, re-recording is intentional.

### D4 — Failure isolation

**Choice:** Wrap fan-out in try/catch; log errors; still return 201 from accept.

**Rationale:** Same as note notifications — assessment is the primary write.

### D5 — Child list links

**Choice:** Replace plain `<span>` with a `Link` or `button` + `navigate` to
`/data/child/${childId}`, styled as `link link-hover` or subtle button; keep
Remove control layout unchanged.

**Rationale:** Matches `ClassroomCard` and `DataPage`. Parent read mode only
lists their own children (backend-scoped), so all visible names are safe to
link.

**Access edge case:** Teacher without grant may see access-denied on child page
— existing behavior, not introduced by this change.

### D6 — Bell routing

Extend `routeTargetForNotification`:

```text
classroom-recording-added + classroomId → /classrooms/<classroomId>
```

Same target as `classroom-note-added` and `classroom-added`.

## Risks / Trade-offs

- **[Risk] Multiple recordings spam parents** → Mitigation: 10-day TTL;
  expected product behavior.
- **[Risk] Classroom with parents but zero children** → Still notify parents
  (recording is classroom-level).
- **[Risk] Mongoose enum extension** → Additive only; deploy backend before
  frontend routing update.

## Migration Plan

1. Deploy backend: enum + service + accept hook.
2. Deploy frontend: routing + child links.
3. Update stakeholder markdown + rebuild docx.
4. Rollback: revert commits; orphaned notifications TTL out.

## Open Questions

_None — user confirmed message wording, navigation target, single bundled
change, and no archive of notes change._
