## ADDED Requirements

### Requirement: child-note-added notification type

The `Notification` model SHALL support `type: "child-note-added"`. Each
document MUST include `childId` (ObjectId), `childName` (string snapshot),
`classroomId` null, `classroomName` empty or omitted, and a `message` of the
form `New note on <child name>'s page`. Rows MUST use the existing 10-day
TTL on `expiresAt`.

#### Scenario: Notification shape on child note
- **WHEN** a teacher creates a child note for child C named "Alice"
- **THEN** each parent notification has `type: "child-note-added"`,
  `childId` matching C, `childName: "Alice"`, and the prescribed message

### Requirement: classroom-note-added notification type

The `Notification` model SHALL support `type: "classroom-note-added"`. Each
document MUST include `classroomId`, `classroomName` (snapshot), `childId`
null, and `message` of the form `New note in classroom: "<name>"`. Rows MUST
use the existing 10-day TTL.

#### Scenario: Notification shape on classroom note
- **WHEN** an admin creates a classroom note for room R named "Pre-K Owls"
- **THEN** each parent notification has `type: "classroom-note-added"`,
  `classroomId` matching R, `classroomName: "Pre-K Owls"`, and the prescribed
  message

### Requirement: Staff classroom notes notify enrolled parents

The system SHALL create one `classroom-note-added` notification per parent
in `Classroom.parents[]` when an admin or teacher successfully creates a
classroom-scoped note. Fan-out MUST not roll back the note on notification
failure. Parent-authored classroom notes MUST NOT occur (403).

#### Scenario: Two parents enrolled
- **WHEN** a lead teacher adds a note to classroom R with parents P1 and P2
  in `parents[]`
- **THEN** exactly two `classroom-note-added` notifications are created

#### Scenario: Notification failure preserves note
- **WHEN** the classroom note is saved but notification insert fails
- **THEN** the note remains and the API returns 201

### Requirement: Bell routes note notifications to the right page

The notification bell SHALL navigate note notification rows as follows:

- `child-note-added` with `childId` → `/data/child/<childId>`
- `classroom-note-added` with `classroomId` → `/classrooms/<classroomId>`

#### Scenario: Parent clicks child note notification
- **WHEN** a parent clicks a `child-note-added` row for child C
- **THEN** the app navigates to `/data/child/<C>` and closes the dropdown

#### Scenario: Parent clicks classroom note notification
- **WHEN** a parent clicks a `classroom-note-added` row for classroom R
- **THEN** the app navigates to `/classrooms/<R>` and closes the dropdown

## MODIFIED Requirements

### Requirement: Notification model with 10-day TTL

The system SHALL persist each in-app notification as a document in a
top-level MongoDB `notifications` collection. Every document SHALL have:

- `recipientId` (ObjectId, indexed): the `_id` of the user who should see
  the notification (Parent / Teacher / Admin User).
- `recipientRole` (string): one of `"parent"`, `"teacher"`, `"admin"`,
  denormalized for fast filtering at fetch time.
- `type` (string): the event kind. This change supports
  `"classroom-added"` (a user was added to a classroom),
  `"classroom-removed"` (a parent was removed from a classroom),
  `"child-note-added"` (staff added a note on a child's page), and
  `"classroom-note-added"` (staff added a note on a classroom page). The
  field SHALL be present so future event types do not require a schema
  migration.
- `classroomId` (ObjectId, nullable): the classroom the notification refers
  to when applicable.
- `classroomName` (string): a snapshot of the classroom name at creation
  time when applicable.
- `childId` (ObjectId, nullable): the child a note notification refers to.
- `childName` (string): snapshot of the child's name for note notifications.
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

#### Scenario: childName is snapshotted on note notifications
- **WHEN** a `child-note-added` notification is created for child "Alice"
- **AND** the child is later renamed
- **THEN** the notification's `childName` still reads "Alice"
