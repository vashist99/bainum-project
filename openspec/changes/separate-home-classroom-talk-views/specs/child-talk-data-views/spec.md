# child-talk-data-views Specification (Delta)

## ADDED Requirements

### Requirement: Parent two-view toggle on the child data page

The child data page SHALL offer parents two mutually exclusive views — **Classroom talk** (default) and **Home talk** — selected via tabs. Charts, word-per-minute stats, the transcript list, and the "download all transcripts" export SHALL include only assessments belonging to the active view. Assessments with `activityContext: 'home'` belong to Home talk; all other assessments (including legacy rows with no `activityContext`) belong to Classroom talk.

#### Scenario: Parent switches to Home talk

- **WHEN** a parent viewing their child's data page selects the "Home talk" tab
- **THEN** the charts, stats, and transcript list re-render using only assessments with `activityContext: 'home'`
- **AND** the "download all transcripts" export contains only those home-context transcripts

#### Scenario: Parent default view is Classroom talk

- **WHEN** a parent opens their child's data page
- **THEN** the Classroom talk tab is active and shows only non-home assessments (school-context and legacy rows)

#### Scenario: A view with no data shows an empty state

- **WHEN** a parent opens a view (Home or Classroom) for which the child has no assessments
- **THEN** the page shows an empty-state message for that view instead of charts populated from the other context

### Requirement: Home talk data is invisible to teachers and admins

The child assessment APIs (`GET /api/assessments/child/:childId` and `GET /api/assessments/child/:childId/latest`) SHALL exclude assessments with `activityContext: 'home'` from responses to teacher and admin users, enforced in the database query. Parents SHALL continue to receive all of their child's assessments. Teachers and admins SHALL NOT be able to delete a home-context assessment.

#### Scenario: Teacher requests a child's assessments

- **WHEN** a teacher with access to a child requests `GET /api/assessments/child/:childId` and the child has both home and classroom assessments
- **THEN** the response contains only the non-home assessments

#### Scenario: Admin requests the latest assessment after a home upload

- **WHEN** the child's most recent assessment has `activityContext: 'home'` and an admin requests `GET /api/assessments/child/:childId/latest`
- **THEN** the response returns the most recent non-home assessment (or an empty result if none exists), never the home row

#### Scenario: Staff attempts to delete a home-context assessment

- **WHEN** a teacher or admin calls `DELETE /api/assessments/child/:assessmentId` for an assessment with `activityContext: 'home'`
- **THEN** the request is rejected without deleting the row

#### Scenario: Parent still receives both contexts

- **WHEN** a parent requests `GET /api/assessments/child/:childId` for their own child
- **THEN** the response contains both home-context and classroom-context assessments

### Requirement: Staff child pages render classroom data only

For teachers and admins, the child data page SHALL render without the Home/Classroom tabs and SHALL display only classroom talk data (the filtered API payload), including in the transcript list and transcript downloads.

#### Scenario: Teacher views a child with home recordings

- **WHEN** a teacher opens the data page of a supervised child who has parent home recordings
- **THEN** no Home talk tab, home transcript, or home-derived chart data is shown

### Requirement: Children cohort stats exclude home recordings

The children cohort statistics used for chart thresholds SHALL be computed from non-home assessments only (`activityContext` absent or `'school'`), so classroom baselines are unaffected by home recordings.

#### Scenario: Cohort recompute after a home upload

- **WHEN** a parent home recording is saved and children cohort stats are recomputed
- **THEN** the resulting thresholds are identical to what they would be if the home recording did not exist
