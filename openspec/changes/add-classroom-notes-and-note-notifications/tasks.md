## 1. Backend — Note model and auth

- [x] 1.1 Extend `Note` schema: optional `classroomId`; validate exactly one of
      `childId` / `classroomId` on create.
- [x] 1.2 Add JWT `protect` middleware to all `/api/notes` routes.
- [x] 1.3 Implement authorization in `noteController` for child notes (parent
      link, teacher grant/supervision, admin).
- [x] 1.4 Add `GET /api/notes/classroom/:classroomId` with classroom access
      checks (manage + enrolled parent read).
- [x] 1.5 Extend `POST /api/notes` to accept `classroomId` for classroom-scoped
      creates with manage-mode authorization.

## 2. Backend — Note notifications

- [x] 2.1 Extend `Notification` model: enum values `child-note-added`,
      `classroom-note-added`; optional `childId`, `childName` fields.
- [x] 2.2 Add `createChildNoteAddedNotification` and
      `createClassroomNoteAddedNotification` in `notificationService.js`.
- [x] 2.3 On staff child note create, fan out to all parents linked to the child
      (skip when author is parent).
- [x] 2.4 On staff classroom note create, fan out to all parents in
      `Classroom.parents[]`.
- [x] 2.5 Unit tests: scope validation, auth 403 paths, fan-out counts, failure
      does not roll back note.

## 3. Frontend — Shared notes UI

- [x] 3.1 Extract `NotesSection.jsx` from `ChildDataPage` (list, add, delete,
      author/timestamp, `canWrite` prop).
- [x] 3.2 Refactor `ChildDataPage` to use `NotesSection` with child scope API
      paths (no visual regression).
- [x] 3.3 Add `NotesSection` to `ClassroomHomePage` with classroom scope;
      `canWrite` when `role !== 'parent'`.

## 4. Frontend — Bell routing

- [x] 4.1 Extend `routeTargetForNotification` for `child-note-added` and
      `classroom-note-added`.
- [x] 4.2 Unit tests for new routing cases in `notificationBell.test.js` (or
      `notifications.js` tests).

## 5. Verification

- [x] 5.1 Manual smoke: add classroom note as lead teacher; parent sees note on
      classroom page and bell notification navigates correctly.
- [x] 5.2 Manual smoke: teacher adds child note; linked parent gets notification
      linking to child data page.
- [x] 5.3 Run `npm run test:unit` in `mockup1` and backend unit tests.

## 6. Documentation

- [x] 6.1 Update user manual, FAQ, and usability testing protocol for notes and
      note notifications.
- [x] 6.2 Rebuild stakeholder docx deliverables.
