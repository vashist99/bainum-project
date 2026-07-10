# parent-notifications Specification (Delta)

## ADDED Requirements

### Requirement: Notification is created when staff requests home view access

The `Notification.type` enum SHALL include `"home-access-requested"`. When a teacher or admin successfully creates a new pending home view access request for a child via `POST /api/home-access/child/:childId/request`, the backend SHALL create exactly ONE `Notification` document per accepted parent linked to that child (`Child.parents[]`), with:

- `type: "home-access-requested"`
- `recipientId` / `recipientRole: "parent"` for each parent
- `childId` and `childName` (snapshot of the child's name)
- `message` identifying the requester and child, e.g. `<Staff name> (teacher) requested access to <Child>'s home talk data`
- the standard 10-day `expiresAt` TTL

The fan-out SHALL run AFTER the grant request write succeeds, and any notification error MUST NOT roll back the request. An idempotent repeat request (pending or active grant already exists) SHALL NOT create additional notifications.

#### Scenario: Parent is notified of a teacher's request

- **WHEN** teacher T requests home view access for child C whose accepted parent is P
- **THEN** exactly one `Notification` exists for P with `type: "home-access-requested"`, C's id and name, and a message naming T

#### Scenario: Repeat request does not duplicate the notification

- **WHEN** T clicks "Request access" again while the pending request exists
- **THEN** no additional notification is created for P

#### Scenario: Notification failure does not roll back the request

- **WHEN** the `Notification.create` call throws after the pending grant is written
- **THEN** the pending grant remains, the request response is still successful, and the error is logged server-side

### Requirement: Bell routes home-access-requested notifications to the child's page

Clicking a `home-access-requested` notification row in the `NotificationBell` dropdown SHALL navigate the parent to `/data/child/<childId>` (the child data page containing the home view sharing controls) and close the dropdown.

#### Scenario: Parent clicks the request notification

- **WHEN** parent P clicks a `home-access-requested` notification referencing child C
- **THEN** the app navigates to `/data/child/<C>` and the dropdown closes
