## Why

Parents enrolled in a classroom have no in-app signal when staff save a new
classroom recording (after transcript review). They must revisit the classroom
homepage manually to discover new transcripts. Separately, the classroom
children list shows names as plain text while other surfaces (dashboard cards,
children list) already link to child profile pages.

## What Changes

- When an **admin or teacher** successfully accepts a **classroom-scoped**
  recording (`POST /api/assessments/teacher/accept` with `classroomId`), fan out
  one in-app notification per parent in `Classroom.parents[]`.
- New notification type `classroom-recording-added` with message
  `New recording in classroom: "<name>"` and bell navigation to
  `/classrooms/<classroomId>` (transcripts on the classroom homepage).
- Notifications fire only on **accept** (saved assessment), not on upload or
  transcript reject.
- On the classroom homepage **children list**, each child name SHALL link to
  `/data/child/<childId>` for authorized viewers (staff and enrolled parents;
  parent read mode already scopes the list to their own children).

## Capabilities

### New Capabilities

_None — behavior extends existing notification and classroom homepage
capabilities._

### Modified Capabilities

- `parent-notifications`: new `classroom-recording-added` type, fan-out on
  classroom recording accept, bell routing to classroom homepage.
- `classroom-homepage`: children list entries link to child data pages.
- `classroom-recording-activity`: parent notification fan-out when a classroom
  recording is accepted.

## Impact

- **Backend**:
  - `backend/models/Notification.js` — enum value `classroom-recording-added`.
  - `backend/lib/notificationService.js` — create + fan-out helpers.
  - `backend/routes/whisperRoutes.js` — hook after successful classroom-scoped
    `teacher/accept` when author is admin or teacher.
- **Frontend**:
  - `mockup1/src/utils/notifications.js` — route `classroom-recording-added`.
  - `mockup1/src/pages/ClassroomHomePage.jsx` — child name links.
- **Docs**: user manual, FAQ, usability protocol (recording notification +
  child links).
- **Tests**: notificationService payload, bell routing, optional accept-hook
  test.
- **Risk**: low — additive enum; notification failure must not roll back
  assessment save (same pattern as note notifications).
