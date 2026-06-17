## Why

Teachers and admins already capture observations on the child data page via
**Notes & Observations**, but classroom homepages have no equivalent — staff
must leave the classroom context to record room-level updates. Parents have no
signal when new notes appear on their child's page or on a classroom they are
enrolled in; they only discover updates by revisiting pages manually.

## What Changes

- Add a **Notes & Observations** section to `/classrooms/:id` matching the
  child data page pattern (list, add, delete; author + timestamp on each note).
- Extend the notes backend to support **classroom-scoped** notes
  (`classroomId`) alongside existing child-scoped notes (`childId`).
- Harden notes APIs with authentication and role checks aligned to child /
  classroom access rules.
- When an **admin or teacher** creates a note on a child page, create in-app
  notifications for every linked parent of that child.
- When an **admin or teacher** creates a note on a classroom page, create
  in-app notifications for every parent enrolled in that classroom
  (`Classroom.parents[]`).
- Extend the notification model and bell routing for two new types:
  `child-note-added` and `classroom-note-added`.
- Parents SHALL NOT receive a notification for notes they author themselves;
  staff-authored notes only.

## Capabilities

### New Capabilities

- `classroom-notes`: classroom-scoped notes API and UI on the classroom
  homepage, mirroring the child notes experience.
- `child-notes`: secured child-scoped notes API and parent notification fan-out
  when staff add a note (child UI already exists on `/data/child/:id`).

### Modified Capabilities

- `classroom-homepage`: notes section on the classroom homepage in manage and
  read modes.
- `parent-notifications`: new notification types, optional `childId` /
  `childName` snapshot fields, fan-out rules, and bell navigation targets.

## Impact

- **Backend**:
  - `backend/models/Note.js` — optional `classroomId`; scope validation.
  - `backend/models/Notification.js` — new `type` values; optional `childId`,
    `childName` snapshots.
  - `backend/controllers/noteController.js` — auth, classroom CRUD, notification
    fan-out on staff creates.
  - `backend/lib/notificationService.js` — note notification helpers.
  - `backend/routes/noteRoutes.js` — JWT protection; classroom list route.
- **Frontend**:
  - Shared notes UI component for `ChildDataPage` and `ClassroomHomePage`.
  - `mockup1/src/utils/notifications.js` — routing for note notification types.
- **Tests**: backend unit tests for validation + fan-out; frontend routing tests.
- **Risk**: medium — notes routes gain auth (currently unprotected); notification
  enum extension is additive.
