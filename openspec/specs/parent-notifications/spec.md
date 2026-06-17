# parent-notifications Specification

## Purpose
TBD - created by archiving change streamline-classroom-add-and-notify-parents. Update Purpose after archive.
## Requirements
### Requirement: Notification model with 10-day TTL

The system SHALL persist each in-app notification as a document in a
top-level MongoDB `notifications` collection. Every document SHALL have:

- `recipientId` (ObjectId, indexed): the `_id` of the user who should see
  the notification (Parent / Teacher / Admin User).
- `recipientRole` (string): one of `"parent"`, `"teacher"`, `"admin"`,
  denormalized for fast filtering at fetch time.
- `type` (string): the event kind. This change supports
  `"classroom-added"` (a user was added to a classroom) and
  `"classroom-removed"` (a parent was removed from a classroom). The
  field SHALL be present so future event types do not require a schema
  migration.
- `classroomId` (ObjectId, nullable): the classroom the notification refers
  to. Required for both supported types.
- `classroomName` (string): a snapshot of the classroom name at the moment
  the notification was created, so renames or deletions do not strand the
  notification.
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

### Requirement: Notification is created when a user is added to a classroom

The backend SHALL create exactly ONE `Notification` document with
`type: "classroom-added"` for every recipient who is newly added to a
classroom by an admin or teacher action. The recipients SHALL be:

- Every parent in the `addedParents` set of the invite write whose
  membership in `Classroom.parents` did NOT already exist before the
  write.
- The classroom's lead teacher and assistant teacher, but only when this
  is the first time they receive a `classroom-added` notification for
  that classroom (idempotency window aligns with the 10-day TTL; see
  scenarios below).

The fan-out SHALL run AFTER the membership and AccessGrant writes have
succeeded, and any error during notification creation MUST NOT roll back
the membership write.

#### Scenario: Newly invited parent gets a notification
- **WHEN** an admin or teacher invites a parent P (not already in the
  classroom) via `POST /api/classrooms/:id/invite`
- **THEN** exactly one `Notification` document exists for P with
  `type: "classroom-added"`, the correct `classroomId`, and a message
  matching `You have been added to a classroom: "<name>"`

#### Scenario: Re-inviting the same parent does not duplicate
- **WHEN** the same parent P is included in a second invite call to a
  classroom they are ALREADY a member of
- **THEN** no additional `Notification` document is created for P

#### Scenario: Lead teacher is notified on first assignment
- **WHEN** a classroom is created with teacher T as lead, OR an admin
  reassigns lead to T for the first time
- **THEN** exactly one `Notification` is created for T

#### Scenario: Lead teacher is not re-notified by follow-up invites
- **WHEN** another invite call is made on the same classroom while T's
  prior `classroom-added` notification still exists in the collection
- **THEN** no second notification is created for T

#### Scenario: Assistant teacher notification follows the same rule
- **WHEN** a classroom is created or updated with assistant teacher A for
  the first time
- **THEN** A receives one `classroom-added` notification

#### Scenario: Membership write succeeds even when notification write fails
- **WHEN** the `Notification.create` call throws for any reason (DB hiccup,
  validation, etc.)
- **THEN** the parent / teacher are still added to the classroom, the
  invite response is still 200, and the error is logged server-side

### Requirement: Notification is created when a parent is removed from a classroom

The backend SHALL create exactly ONE `Notification` document with
`type: "classroom-removed"` for each parent whose last enrollment in a
classroom was just removed by an admin or lead teacher via
`DELETE /api/classrooms/:id/children/:childId`. The notification SHALL
be created only when the remove operation prunes the parent from
`Classroom.parents[]` (i.e., when the removed child was the parent's
last child in that classroom). Teachers SHALL NOT receive a
`classroom-removed` notification on per-child removals — the room
itself is not going away.

The message SHALL read `You have been removed from classroom: "<name>"`,
mirroring the wording of `classroom-added`. The fan-out SHALL run AFTER
the membership mutation succeeds, and any error during notification
creation MUST NOT roll back the removal.

#### Scenario: Parent's last child removed → parent gets notification
- **WHEN** an admin (or the lead teacher) removes parent P's only
  remaining child C from classroom R via
  `DELETE /api/classrooms/<R>/children/<C>`
- **AND** the removal prunes P from `Classroom.parents[]`
- **THEN** exactly one new `Notification` is created for P with
  `type: "classroom-removed"`, `classroomId: R`, `classroomName: "<R name>"`,
  and `message: 'You have been removed from classroom: "<R name>"'`

#### Scenario: Per-child removal that does NOT prune the parent
- **WHEN** an admin removes one of parent P's children from classroom R
  but P still has at least one other child in R
- **THEN** P is NOT pruned from `Classroom.parents[]`
- **AND** no `classroom-removed` notification is created for P

#### Scenario: Removal-notification failure does not roll back the removal
- **WHEN** the membership pull succeeds but the subsequent
  `Notification.create` for `classroom-removed` throws
- **THEN** the child is still removed from the classroom, the DELETE
  response is still 200, and the error is logged server-side

#### Scenario: Re-adding a removed parent re-issues classroom-added
- **WHEN** parent P was removed from classroom R (and got the
  `classroom-removed` notification) and is later added back via the
  Add Parents flow
- **THEN** a fresh `classroom-added` notification is created for P
- **AND** the prior `classroom-removed` row is left untouched (it will
  TTL-purge on its own schedule)

### Requirement: Authenticated users can list and dismiss their notifications

The backend SHALL expose:

- `GET /api/notifications` — returns the calling user's `Notification`
  documents whose `expiresAt > now`, sorted by `createdAt DESC`, capped
  at 50 results.
- `DELETE /api/notifications/:id` — hard-deletes the specified
  notification if and only if the caller is its `recipientId`. Anyone
  else receives 403. A non-existent id returns 404.

Unauthenticated callers MUST receive 401 on either endpoint.

#### Scenario: Parent lists their notifications
- **WHEN** an authenticated parent calls `GET /api/notifications`
- **THEN** the response is 200 with their unexpired `classroom-added`
  notifications, newest first

#### Scenario: Cross-user fetch is impossible
- **WHEN** parent A is authenticated and calls `GET /api/notifications`
- **THEN** no notification belonging to any other user appears in the
  response

#### Scenario: Dismiss removes a single notification
- **WHEN** a user calls `DELETE /api/notifications/<id>` for a
  notification they own
- **THEN** the document is removed and the response is 200

#### Scenario: Dismiss someone else's notification fails
- **WHEN** parent A calls `DELETE /api/notifications/<id>` for a
  notification owned by parent B
- **THEN** the response is 403 and the document remains

#### Scenario: Unauthenticated request denied
- **WHEN** a request without a valid JWT hits either endpoint
- **THEN** the response is 401

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
  `classroom-removed` rows go to `/home` (the removed parent no
  longer has access to the classroom page and would otherwise see
  403) — and closes the dropdown.
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

#### Scenario: Dismiss removes the row
- **WHEN** the user clicks the X on a notification row
- **THEN** the row disappears from the dropdown immediately and the
  badge decreases by one
- **AND** a `DELETE /api/notifications/<id>` request is sent

#### Scenario: Login page has no bell
- **WHEN** an unauthenticated visitor opens any standalone page (login,
  register, password reset)
- **THEN** no bell is rendered

### Requirement: Notifications do not introduce real-time push

Notifications SHALL be delivered via plain REST polling on the existing
JWT-protected `/api/notifications` endpoint. The system MUST NOT open a
WebSocket, SSE channel, or similar push transport as part of this change.

#### Scenario: New notification visible after route change
- **WHEN** parent P is added to a classroom while their browser is open
  on `/home`
- **AND** P navigates to `/data`
- **THEN** the bell on the destination page reflects the new
  notification (badge increments, dropdown lists the new row)

#### Scenario: No push connection opened
- **WHEN** an authenticated session is observed end-to-end
- **THEN** no WebSocket or SSE connection is established by the bell

