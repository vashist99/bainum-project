## ADDED Requirements

### Requirement: Classroom homepage includes Notes and Observations

The classroom homepage SHALL include a **Notes & Observations** section
as specified in the `classroom-notes` capability: visible in both manage
and parent read modes, with write affordances limited to manage mode.

#### Scenario: Notes appear below classroom content
- **WHEN** an authorized user opens `/classrooms/:id`
- **THEN** a Notes & Observations card is rendered on the page
- **AND** its layout matches the child data page notes card (title, badge
  count, divider, list styling)

#### Scenario: Manage mode shows write controls
- **WHEN** an admin or the classroom's lead or assistant teacher views the
  homepage in manage mode
- **THEN** the Notes section includes add and delete controls

#### Scenario: Parent read mode hides write controls
- **WHEN** an enrolled parent views the homepage
- **THEN** the Notes section does not show Add Note or Delete controls
