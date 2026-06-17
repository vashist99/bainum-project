## MODIFIED Requirements

### Requirement: Parent homepage shows enrolled classrooms
The parent homepage SHALL be simplified to a list of classroom cards for the classrooms their children are enrolled in, replacing the dashboard stat cards. Each card SHALL show the classroom name, teacher-in-charge, and center, plus which of the parent's children are enrolled. Tapping an enrolled child SHALL open that child's data page (parents do not get access to the classroom administration homepage). Home-context recording SHALL be available from the **Home** sidebar tab, not from the Dashboard.

#### Scenario: Parent sees enrolled classroom cards
- **WHEN** a parent opens the Dashboard with enrolled classrooms
- **THEN** classroom cards are shown with enrolled-child chips linking to child data pages

#### Scenario: No recording entry on Dashboard
- **WHEN** a parent views the Dashboard
- **THEN** no Record Activity card is present
