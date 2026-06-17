## MODIFIED Requirements

### Requirement: Content fits beside the sidebar

Pages gaining the sidebar SHALL remain usable at desktop and mobile widths: no
horizontal overflow of the app shell (`body` or main content column), and wide
content (tables, charts, transcript lists) adapts to the reduced content width
on desktop. On viewports below the `sm` breakpoint (~640px), the page body
SHALL NOT introduce horizontal scrolling; any table or equally wide block MUST
scroll inside its own `overflow-x-auto` container bounded by the page/card
padding.

#### Scenario: Wide content adapts
- **WHEN** the Children table or a child's charts render on a desktop viewport
  with the sidebar visible
- **THEN** content fits the remaining width without horizontal scrolling of
  the page body

#### Scenario: Phone viewport has no shell overflow
- **WHEN** an admin opens `/data` in Table mode at 375px width
- **THEN** the app shell does not scroll horizontally
- **AND** the children table scrolls inside its card/container if columns exceed
  the viewport width

#### Scenario: Schools table on phone
- **WHEN** an admin opens `/schools` in Table view at 375px width
- **THEN** the schools table scrolls inside a bounded container without
  shifting the navbar or sidebar overlay

## ADDED Requirements

### Requirement: Navbar avatar is visually aligned with shell controls

The shared Navbar user-menu avatar SHALL meet the centered-icon rules defined
in the `responsive-ui-polish` capability and SHALL align vertically with the
notification bell and brand controls in the same navbar row.

#### Scenario: Bell and avatar share baseline
- **WHEN** an authenticated user views `/home` at 375px or 1280px width
- **THEN** the notification bell and user-menu avatar appear on the same
  horizontal alignment band without one control sitting higher than the other
