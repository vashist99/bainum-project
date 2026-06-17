## ADDED Requirements

### Requirement: Children list toolbar is mobile-friendly

The `/data` page Children section SHALL use the shared responsive toolbar
pattern from `responsive-ui-polish` for any search or action controls in the
page header and list card header (Add Child, Tiles/Table toggle, bulk-invite
controls). Page padding SHALL use `p-4 sm:p-6` at the page root to match
Classrooms and avoid edge clipping on narrow phones.

#### Scenario: Children header on phone
- **WHEN** an admin opens `/data` at 375px width
- **THEN** the page title, Add Child button, and Children list toolbar stack
  or wrap without overlapping

#### Scenario: Children table contained on phone
- **WHEN** the Children list is in Table mode at 375px width
- **THEN** the table scrolls inside its card via `overflow-x-auto` without
  horizontal scroll on the page body

#### Scenario: Children tiles on phone
- **WHEN** the Children list is in Tile mode at 375px width
- **THEN** each child tile card uses full available width with badges and
  action buttons wrapping inside the card
