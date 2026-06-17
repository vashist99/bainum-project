## 1. Backend — Notification model and service

- [x] 1.1 Add `classroom-recording-added` to `Notification.type` enum.
- [x] 1.2 Add `createClassroomRecordingAddedNotification` and
      `fanOutClassroomRecordingAddedNotifications` in
      `notificationService.js` (message: `New recording in classroom: "<name>"`).
- [x] 1.3 Unit tests: payload shape, fan-out count, graceful failure on
      `Notification.create` error.

## 2. Backend — Accept hook

- [x] 2.1 After successful classroom-scoped `teacher/accept` when
      `req.user` is admin or teacher, fan out to `classroom.parents[]`.
- [x] 2.2 Wrap fan-out in try/catch so assessment save still returns 201 on
      notification failure.
- [x] 2.3 Unit or integration test: accept with mocked parents verifies fan-out
      invoked (or notificationService test coverage).

## 3. Frontend — Bell routing

- [x] 3.1 Extend `routeTargetForNotification` for `classroom-recording-added` →
      `/classrooms/<classroomId>`.
- [x] 3.2 Unit tests in `notificationBell.test.js` for new routing case.

## 4. Frontend — Classroom children links

- [x] 4.1 In `ClassroomHomePage`, link each child name to
      `/data/child/<childId>` (match `ClassroomCard` / `DataPage` pattern).
- [x] 4.2 Preserve Remove control layout; parent read mode links only scoped
      children (already backend-filtered).

## 5. Documentation

- [x] 5.1 Update user manual, FAQ, and usability testing protocol (recording
      notifications + child profile links from classroom page).
- [x] 5.2 Rebuild stakeholder docx via `docs/stakeholder-deliverables/build-docx.sh`.

## 6. Verification

- [x] 6.1 Manual smoke: teacher accepts classroom recording; parent sees bell
      notification and navigates to classroom homepage transcripts.
- [x] 6.2 Manual smoke: child name on classroom page opens child data page.
- [x] 6.3 Run `npm run test:unit` in `mockup1` and backend unit tests for
      touched modules.
