# child-talk-data-views Specification (Delta)

> Note: this capability is introduced by the pending `separate-home-classroom-talk-views` change. The MODIFIED requirements below supersede that change's versions of the same requirements.

## MODIFIED Requirements

### Requirement: Home talk data is invisible to teachers and admins

The child assessment APIs (`GET /api/assessments/child/:childId` and `GET /api/assessments/child/:childId/latest`) SHALL exclude assessments with `activityContext: 'home'` from responses to teacher and admin users, enforced in the database query, **unless the caller holds home view access for that child per `staffHasHomeViewAccess` (an active `HomeViewGrant` with `scope: "all-staff"`, or `scope: "user"` naming the caller)**. When the caller holds access, the response SHALL include home-context assessments exactly as it does for parents. Parents SHALL continue to receive all of their child's assessments. Teachers and admins SHALL NOT be able to delete a home-context assessment, regardless of any grant.

#### Scenario: Ungranted teacher requests a child's assessments

- **WHEN** a teacher with access to a child but no home view grant requests `GET /api/assessments/child/:childId` and the child has both home and classroom assessments
- **THEN** the response contains only the non-home assessments

#### Scenario: Granted teacher requests a child's assessments

- **WHEN** a teacher holding an active home view grant for the child requests `GET /api/assessments/child/:childId`
- **THEN** the response contains both home-context and classroom-context assessments

#### Scenario: Admin requests the latest assessment after a home upload

- **WHEN** the child's most recent assessment has `activityContext: 'home'` and an admin **without home view access** requests `GET /api/assessments/child/:childId/latest`
- **THEN** the response returns the most recent non-home assessment (or an empty result if none exists), never the home row

#### Scenario: Granted admin requests the latest assessment

- **WHEN** the child's most recent assessment has `activityContext: 'home'` and an admin covered by an active all-staff grant requests `GET /api/assessments/child/:childId/latest`
- **THEN** the response returns that home-context assessment

#### Scenario: Staff attempts to delete a home-context assessment

- **WHEN** a teacher or admin — with or without an active home view grant — calls `DELETE /api/assessments/child/:assessmentId` for an assessment with `activityContext: 'home'`
- **THEN** the request is rejected without deleting the row

#### Scenario: Parent still receives both contexts

- **WHEN** a parent requests `GET /api/assessments/child/:childId` for their own child
- **THEN** the response contains both home-context and classroom-context assessments

### Requirement: Staff child pages render classroom data only

For teachers and admins, the child data page SHALL render the Home talk / Classroom talk tabs. The Classroom talk tab SHALL behave as it does today. The Home talk tab SHALL branch on the caller's home view access status (from `GET /api/home-access/child/:childId`):

- **Granted:** charts, word-per-minute stats, the transcript list, and transcript downloads SHALL render from home-context assessments, partitioned client-side identically to the parent home view.
- **Not granted:** the tab SHALL show a message explaining that home recordings are private to the family, with a "Request access" button that calls `POST /api/home-access/child/:childId/request`. While a request is pending, the button SHALL be disabled and indicate the request was sent.

Home-derived data SHALL never appear in the staff Classroom talk view.

#### Scenario: Ungranted teacher views the Home talk tab

- **WHEN** a teacher without home view access opens the Home talk tab of a supervised child who has parent home recordings
- **THEN** no home transcript or home-derived chart data is shown
- **AND** a privacy message and a "Request access" button are shown

#### Scenario: Teacher sends a request from the tab

- **WHEN** the ungranted teacher clicks "Request access"
- **THEN** the request endpoint is called and the button changes to a disabled "Request sent" state

#### Scenario: Granted admin views the Home talk tab

- **WHEN** an admin covered by an active grant opens the Home talk tab of a child with home recordings
- **THEN** the tab renders home-context charts, stats, and transcripts, and the transcript export contains only home-context transcripts

#### Scenario: Home data stays out of the staff classroom view

- **WHEN** a granted teacher views the Classroom talk tab
- **THEN** charts, stats, transcripts, and exports include only non-home assessments
