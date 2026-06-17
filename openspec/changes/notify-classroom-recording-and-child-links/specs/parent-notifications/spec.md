## ADDED Requirements

### Requirement: classroom-recording-added notification type

The `Notification` model SHALL support `type: "classroom-recording-added"`.
Each document MUST include `classroomId`, `classroomName` (string snapshot),
`childId` null, `childName` empty, `recipientRole: "parent"`, and `message` of
the form `New recording in classroom: "<name>"`. Rows MUST use the existing
10-day TTL on `expiresAt`.

#### Scenario: Notification shape on classroom recording accept
- **WHEN** a teacher accepts a classroom recording for room R named "Pre-K Owls"
- **THEN** each parent notification has `type: "classroom-recording-added"`,
  `classroomId` matching R, `classroomName: "Pre-K Owls"`, and message
  `New recording in classroom: "Pre-K Owls"`

### Requirement: Staff classroom recording accept notifies enrolled parents

The system SHALL create one `classroom-recording-added` notification per parent
in `Classroom.parents[]` when an admin or teacher successfully accepts a
classroom-scoped recording (`POST /api/assessments/teacher/accept` with a valid
`classroomId`). Fan-out MUST run after the `TeacherAssessment` and child
`Assessment` writes succeed. Notification failure MUST NOT roll back the
assessment save. Upload and reject paths MUST NOT emit this notification.

#### Scenario: Two parents enrolled
- **WHEN** a lead teacher accepts a classroom recording for room R with parents
  P1 and P2 in `parents[]`
- **THEN** exactly two `classroom-recording-added` notifications are created

#### Scenario: Reject does not notify
- **WHEN** a teacher rejects the transcript in the classroom upload modal
- **THEN** no `classroom-recording-added` notifications are created

#### Scenario: Notification failure preserves assessment
- **WHEN** the classroom recording accept succeeds but notification insert fails
- **THEN** the assessments remain saved and the API returns 201

### Requirement: Bell routes classroom-recording-added to classroom homepage

The notification bell SHALL navigate `classroom-recording-added` rows with
`classroomId` to `/classrooms/<classroomId>` and close the dropdown.

#### Scenario: Parent clicks classroom recording notification
- **WHEN** a parent clicks a `classroom-recording-added` row for classroom R
- **THEN** the app navigates to `/classrooms/<R>` and closes the dropdown

## MODIFIED Requirements

### Requirement: Notification model with 10-day TTL

The system SHALL persist each in-app notification as a document in a
top-level MongoDB `notifications` collection. Every document SHALL have:

- `recipientId` (ObjectId, indexed): the `_id` of the user who should see
  the notification (Parent / Teacher / Admin User).
- `recipientRole` (string): one of `"parent"`, `"teacher"`, `"admin"`,
  denormalized for fast filtering at fetch time.
- `type` (string): the event kind. Supported types include
  `"classroom-added"`, `"classroom-removed"`, `"child-note-added"`,
  `"classroom-note-added"`, and `"classroom-recording-added"`. The field
  SHALL be present so future event types do not require a schema migration.
- `classroomId` (ObjectId, nullable): the classroom the notification refers
  to when applicable.
- `classroomName` (string): a snapshot of the classroom name at creation
  time when applicable.
- `childId` (ObjectId, nullable): the child a notification refers to when
  applicable.
- `childName` (string): snapshot of the child's name when applicable.
- `message` (string): the pre-rendered, human-readable body of the
  notification.
- `createdAt` (Date, defaults to now).
- `expiresAt` (Date): `createdAt + 10 days`. The collection SHALL declare a
  MongoDB TTL index on `expiresAt` with `expireAfterSeconds: 0` so the
  server auto-deletes expired notifications.

The model SHALL NOT track read/unread state. Auto-expiry IS the lifecycle.

#### Scenario: TTL index removes 10-day-old notifications
- **WHEN** a `Notification` row's `expiresAt` is more than now
- **THEN** the document continues to exist
- **AND WHEN** `expiresAt` falls into the past
- **THEN** MongoDB's TTL monitor removes the document within ~60 seconds
  without any application code running

#### Scenario: createdAt and expiresAt are correctly set
- **WHEN** a notification is created at instant T
- **THEN** the saved row has `createdAt = T` and
  `expiresAt = T + 10 * 24 * 60 * 60 * 1000` milliseconds

#### Scenario: classroomName is snapshotted
- **WHEN** a `classroom-added` notification is created referencing a
  classroom whose name is "Pre-K Owls"
- **AND** the classroom is later renamed to "Pre-K Foxes"
- **THEN** the saved notification's `classroomName` still reads
  "Pre-K Owls"

### Requirement: Navbar bell surfaces notifications on every authenticated page

The shared `AppLayout` Navbar SHALL render a `NotificationBell` affordance
visible to every authenticated user. The bell SHALL:

- Fetch `GET /api/notifications` on mount and on route change.
- Display a numeric badge equal to `notifications.length` when greater
  than zero, and be unbadged otherwise.
- Open a dropdown on click that lists each notification's message and a
  relative timestamp ("2 minutes ago" / "Yesterday" / "Mar 14").
- Treat each notification row as a button: clicking it navigates by
  type — `classroom-added` rows go to `/classrooms/<classroomId>`,
  `classroom-removed` rows go to `/home`,
  `child-note-added` rows with `childId` go to `/data/child/<childId>`,
  `classroom-note-added` and `classroom-recording-added` rows with
  `classroomId` go to `/classrooms/<classroomId>` — and closes the dropdown.
- Provide a per-row dismiss control (e.g., an X icon) that calls
  `DELETE /api/notifications/:id` and removes the row optimistically
  from the dropdown.

The bell SHALL NOT be rendered on unauthenticated pages (login,
register, password reset).

#### Scenario: Badge shows live count
- **WHEN** an authenticated user has 3 unexpired notifications
- **THEN** the bell shows the badge "3"

#### Scenario: Empty bell hides badge
- **WHEN** the user has 0 unexpired notifications
- **THEN** the bell renders without a number badge

#### Scenario: Click classroom-added row navigates to classroom
- **WHEN** the user clicks a `classroom-added` notification row
  referencing classroom C
- **THEN** the app navigates to `/classrooms/<C>` and the dropdown closes

#### Scenario: Click classroom-removed row navigates to /home
- **WHEN** the user clicks a `classroom-removed` notification row
- **THEN** the app navigates to `/home` (NOT to the classroom, which
  would 403 the now-removed parent) and the dropdown closes

#### Scenario: Click classroom-recording-added row navigates to classroom
- **WHEN** the user clicks a `classroom-recording-added` notification row
  referencing classroom C
- **THEN** the app navigates to `/classrooms/<C>` and the dropdown closes

#### Scenario: Dismiss removes the row
- **WHEN** the user clicks the X on a notification row
- **THEN** the row disappears from the dropdown immediately and the
  badge decreases by one
- **AND** a `DELETE /api/notifications/<id>` request is sent

#### Scenario: Login page has no bell
- **WHEN** an unauthenticated visitor opens any standalone page (login,
  register, password reset)
- **THEN** no bell is rendered
