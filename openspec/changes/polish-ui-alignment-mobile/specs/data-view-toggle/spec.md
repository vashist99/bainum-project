## ADDED Requirements

### Requirement: Table mode confines horizontal scroll on narrow viewports

The system SHALL keep Table mode available on viewports below the `sm`
breakpoint (~640px) and MUST NOT auto-switch to Tile mode solely because of
viewport width. The table MUST be wrapped in a container with
`overflow-x-auto` and `min-w-0` so horizontal scrolling is confined to the
table card and the app shell does not scroll horizontally. Persisted
view-mode and sort preferences MUST remain honored.

#### Scenario: Children table on phone keeps Table mode
- **WHEN** a viewer has persisted Children to Table mode and opens `/data`
  at 375px width
- **THEN** the list renders as a table
- **AND** horizontal scroll appears only inside the table container if
  needed

#### Scenario: Teachers table on phone
- **WHEN** a viewer opens `/teachers` in Table mode at 375px width
- **THEN** the teachers table scrolls inside its bounded container without
  page-level horizontal overflow

#### Scenario: Toggle still works on phone
- **WHEN** a viewer on a 375px viewport switches from Table to Tiles on
  `/data`
- **THEN** the list re-renders as tiles without re-fetching
- **AND** the choice persists per existing `data-view-mode` rules
