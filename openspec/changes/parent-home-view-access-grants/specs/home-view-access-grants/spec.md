# home-view-access-grants Specification

## ADDED Requirements

### Requirement: HomeViewGrant model records parent-controlled home data access

The system SHALL persist home view access in a `homeviewgrants` MongoDB collection (`backend/models/HomeViewGrant.js`). Each document SHALL have:

- `childId` (ObjectId → Child, required, indexed)
- `scope` (string): `"user"` (a single staff member) or `"all-staff"` (all teachers and admins)
- `granteeId` (ObjectId, required when `scope: "user"`, absent for `"all-staff"`): the Teacher or Admin user's `_id`
- `granteeRole` (string, required when `scope: "user"`): `"teacher"` or `"admin"`
- `classroomId` (ObjectId → Classroom, optional): set when the grant was issued via a per-classroom button, for display purposes
- `status` (string): `"pending"`, `"active"`, or `"revoked"`; default `"pending"`, indexed
- `initiatedBy` (string, required): `"parent"` or `"staff"`
- timestamps

The collection SHALL enforce a unique index on `(childId, scope, granteeId)` so re-granting reactivates the existing document rather than duplicating it.

#### Scenario: Re-grant after revoke reuses the document

- **WHEN** a parent grants access to teacher T for child C, later revokes it, and grants again
- **THEN** a single `HomeViewGrant` document exists for `(C, "user", T)` with `status: "active"`

#### Scenario: Grants are never auto-created by other flows

- **WHEN** a parent accepts an invitation, a classroom is created, or an `AccessGrant` becomes active
- **THEN** no `HomeViewGrant` document is created as a side effect

### Requirement: Parent can grant home view access per classroom lead teacher

The child data page SHALL show the child's parent, within the Home talk view, one grant control per classroom the child is enrolled in. Activating it SHALL call `POST /api/home-access/child/:childId/grant` with `{ classroomId }`; the server SHALL verify the caller is an accepted parent of the child and that the classroom is one of the child's classrooms, resolve the classroom's **current lead teacher**, and upsert an `active` `HomeViewGrant` with `scope: "user"`, that teacher as grantee, and the `classroomId` recorded. The grant SHALL bind to that teacher permanently; a later lead-teacher reassignment SHALL NOT transfer access to the new lead.

#### Scenario: Parent grants a classroom's lead teacher

- **WHEN** a parent of child C clicks "Grant access" on the row for classroom R whose lead teacher is T
- **THEN** an active `HomeViewGrant` exists for `(C, "user", T)` with `classroomId: R`
- **AND** the row's control changes to a revoke affordance

#### Scenario: Lead teacher reassignment does not transfer the grant

- **WHEN** teacher T holds an active per-classroom grant for child C and classroom R's lead is reassigned to teacher U
- **THEN** T retains home view access to C and U has none
- **AND** the parent's row for classroom R offers "Grant access" again (reflecting U's status)

#### Scenario: Non-parent cannot grant

- **WHEN** a teacher, admin, or a parent not linked to child C calls the grant endpoint for C
- **THEN** the response is 403 and no grant is written

#### Scenario: Classroom not linked to the child is rejected

- **WHEN** a parent calls the grant endpoint with a `classroomId` that is not in child C's `classrooms[]`
- **THEN** the response is 400/404 and no grant is written

### Requirement: Parent master grant covers all teachers and admins

The child's Home talk view SHALL offer the parent a master "Grant access to all" control, labeled to make clear it covers **all teachers and admins**. Activating it SHALL upsert an `active` `HomeViewGrant` with `scope: "all-staff"` for the child. While an all-staff grant is active, every teacher and admin who can otherwise access the child SHALL pass the home view access check regardless of individual grants.

#### Scenario: Master grant gives an ungranted teacher access

- **WHEN** the parent of child C activates the master grant and teacher T (supervising C, no individual grant) requests C's assessments
- **THEN** the response includes C's home-context assessments

#### Scenario: Master revoke restores individual-grant behavior

- **WHEN** the parent revokes the all-staff grant while teacher T still holds an individual active grant
- **THEN** T retains home view access and staff without individual grants lose it on their next request

### Requirement: Parent can revoke any grant with immediate effect

`POST /api/home-access/child/:childId/revoke` SHALL allow only an accepted parent of the child to set the targeted grant's status to `"revoked"`. The system SHALL NOT cache grant decisions: the next staff API request after revocation SHALL be evaluated against current grant state.

#### Scenario: Revocation takes effect on the next request

- **WHEN** a parent revokes teacher T's grant for child C and T subsequently calls `GET /api/assessments/child/C`
- **THEN** the response excludes all home-context assessments

### Requirement: Staff home view access check gates home data

The system SHALL provide a single authorization check (`staffHasHomeViewAccess` in `backend/lib/talkDataAccess.js`) that returns true for a staff user and child if and only if an `active` `HomeViewGrant` exists for that child with `scope: "all-staff"`, or with `scope: "user"` and the caller as grantee. This check SHALL gate inclusion of home-context assessments for staff on the child assessment endpoints. Home view access SHALL be read-only: staff with an active grant SHALL still be unable to delete home-context assessments, and classroom-level endpoints and cohort statistics SHALL continue to exclude home data unconditionally.

#### Scenario: Granted teacher may not delete a home assessment

- **WHEN** teacher T holds an active grant for child C and calls `DELETE /api/assessments/child/:assessmentId` on a home-context assessment of C
- **THEN** the request is rejected and the assessment remains

#### Scenario: Classroom endpoints ignore grants

- **WHEN** teacher T holds an active grant for child C and fetches classroom assessments via `GET /api/classrooms/:id/assessments`
- **THEN** the response contains no home-context assessments

### Requirement: Staff can request home view access

`POST /api/home-access/child/:childId/request` SHALL allow a teacher who passes the existing child access check (`teacherMayAccessChild`) or any admin to create a `pending` `HomeViewGrant` (`scope: "user"`, `initiatedBy: "staff"`) for themselves. The endpoint SHALL be idempotent: if the caller already has a pending or active grant for the child, no new document and no new notification is created. When the parent grants a per-classroom or matching individual grant, a pending request from that same staff member SHALL become `active` (one document, no duplicates).

#### Scenario: Teacher requests access

- **WHEN** teacher T, who supervises child C and has no grant, calls the request endpoint
- **THEN** a `pending` `HomeViewGrant` exists for `(C, "user", T)` with `initiatedBy: "staff"`

#### Scenario: Duplicate request is a no-op

- **WHEN** T calls the request endpoint again while the pending grant exists
- **THEN** no additional grant document or notification is created and the response indicates the request is already pending

#### Scenario: Unrelated teacher cannot request

- **WHEN** a teacher with no classroom supervision of C and no `AccessGrant` for C calls the request endpoint
- **THEN** the response is 403 and nothing is written

### Requirement: Grant state endpoint powers the UI

`GET /api/home-access/child/:childId` SHALL return, for an accepted parent of the child: the all-staff grant status, one row per enrolled classroom (classroom id/name, current lead teacher id/name, and that teacher's grant status), and the list of pending staff requests (requester name and role). For a teacher or admin caller it SHALL return only their own effective status: `"granted"` (individual active grant or active all-staff grant), `"pending"`, or `"none"`. Other callers SHALL receive 403.

#### Scenario: Parent sees full sharing state

- **WHEN** a parent of child C (enrolled in classrooms R1, R2) fetches the endpoint after granting R1's lead
- **THEN** the response shows R1's lead as granted, R2's lead as not granted, the all-staff status, and any pending requests

#### Scenario: Staff sees only own status

- **WHEN** teacher T with a pending request fetches the endpoint for C
- **THEN** the response is their own status `"pending"` with no other grantees' information

### Requirement: Parent sharing panel on the Home talk view

For parents, the Home talk view on `ChildDataPage` SHALL render a sharing panel containing: the master grant/revoke control, per-classroom rows (classroom name, current lead teacher name, grant or revoke button per state), and any pending staff requests each with an approve action that activates the corresponding grant. Grant and revoke actions SHALL update the panel without a full page reload.

#### Scenario: Parent approves a pending request from the panel

- **WHEN** the parent sees a pending request from admin A and clicks its approve action
- **THEN** A's grant becomes active, the request disappears from the pending list, and A appears as granted
