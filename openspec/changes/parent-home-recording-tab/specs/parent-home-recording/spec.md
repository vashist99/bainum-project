## ADDED Requirements

### Requirement: Parent Home sidebar tab and recording page
The system SHALL expose a parent-only sidebar item labelled **Home** that navigates to a dedicated home-recording page (route under `/home/recording`). The page SHALL be available only to authenticated parents with at least one linked child and SHALL render inside the standard app navigation shell. The page SHALL provide the full home-context recording workflow: child selection, activity picker, location picker, date, live record or file upload, transcript review, and accept — reusing the same transcribe/accept API pipeline as the former Dashboard Record Activity flow.

#### Scenario: Parent sees Home tab
- **WHEN** a parent with linked children opens any authenticated page
- **THEN** the sidebar shows **Home** alongside **Dashboard** and **My Child's Data**
- **AND** **Home** is highlighted when the current route is the home-recording page

#### Scenario: Parent opens Home recording page
- **WHEN** a parent clicks **Home** in the sidebar
- **THEN** the home-recording page loads with activity, location, date, and audio controls visible

#### Scenario: Parent without linked children
- **WHEN** a parent with zero linked children navigates to the home-recording page
- **THEN** the page shows an empty state explaining they must accept an invitation before recording
- **AND** recording controls are disabled

#### Scenario: Non-parent denied
- **WHEN** a teacher or admin navigates to the home-recording page
- **THEN** they are redirected or shown an access-denied state (recording remains on classroom flows)

### Requirement: Parent selects target child for home recording
The home-recording page SHALL require the parent to choose exactly one linked child before upload or accept. The UI SHALL list every child linked to the parent account by display name. When only one child is linked, that child SHALL be pre-selected. The chosen `childId` SHALL be sent on transcribe and accept requests. The server SHALL verify the parent is linked to that child and SHALL create assessments for that child only (no fan-out to other linked children).

#### Scenario: Multi-child parent must choose
- **WHEN** a parent with two linked children opens the Home recording page
- **THEN** a child selector lists both children by name
- **AND** upload/accept is blocked until one child is selected

#### Scenario: Single child pre-selected
- **WHEN** a parent with one linked child opens the Home recording page
- **THEN** that child is pre-selected in the selector

#### Scenario: Recording saved to selected child only
- **WHEN** a parent with children A and B records for child A and accepts the transcript
- **THEN** an assessment is created for child A only
- **AND** no new assessment is created for child B

#### Scenario: Server rejects foreign childId
- **WHEN** a parent submits a transcribe or accept request with a `childId` not linked to their account
- **THEN** the request is rejected with 403 or 400 and nothing is saved

#### Scenario: Server rejects missing childId for parent
- **WHEN** a parent submits a transcribe or accept request without `childId`
- **THEN** the request is rejected with a message to select a child

### Requirement: Dashboard no longer hosts parent recording entry
The parent Dashboard (`/home`) SHALL NOT include a Record Activity card or other primary recording entry point. Home-context recording SHALL be initiated only from the **Home** sidebar tab.

#### Scenario: No Record Activity on Dashboard
- **WHEN** a parent views the Dashboard
- **THEN** no Record Activity card or equivalent recording CTA is shown
