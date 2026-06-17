# data-view-toggle Specification

## Purpose
TBD - created by archiving change add-data-view-toggle. Update Purpose after archive.
## Requirements
### Requirement: View-mode toggle is visible on Children list and Teachers list

The system SHALL render a "Tiles | Table" view-mode toggle at the top of every visible list of children and teachers. The toggle MUST appear on the Children section of /data, the Teachers section of /data, and the Teachers section of /teachers, whenever the corresponding list is visible to the viewer.

#### Scenario: Admin opens /data
- **WHEN** an admin opens `/data`
- **THEN** the Children section header shows a two-segment toggle labelled
  "Tiles | Table"
- **AND** the Teachers section header shows the same toggle
- **AND** the active segment is highlighted

#### Scenario: Admin opens /teachers
- **WHEN** an admin opens `/teachers`
- **THEN** the Teachers list shows the same "Tiles | Table" toggle at the top
  of the list

#### Scenario: Teacher opens /data
- **WHEN** a teacher with backend access opens `/data`
- **THEN** the same toggles are shown on the lists they are allowed to see

### Requirement: Switching view mode re-renders without re-fetching

When the viewer clicks the alternate segment of the toggle, the list SHALL
re-render in the new mode using the data already in memory. The system
MUST NOT issue a new request to `GET /api/children` or `GET /api/teachers`
solely because of a view-mode change.

#### Scenario: Toggle from Tiles to Table
- **WHEN** the children list is in Tile mode and the viewer clicks "Table"
- **THEN** the same children appear as a sortable table
- **AND** no network request is sent to `/api/children`

#### Scenario: Toggle from Table to Tiles
- **WHEN** the children list is in Table mode and the viewer clicks "Tiles"
- **THEN** the same children appear as tile cards
- **AND** no network request is sent to `/api/children`

### Requirement: Default view mode is Tiles

The system SHALL render every list (Children and Teachers) in Tile mode by default whenever the viewer has no persisted preference for that page.

#### Scenario: First-ever visit
- **WHEN** a viewer opens `/data` or `/teachers` and `localStorage` contains
  no `data-view-mode:children` or `data-view-mode:teachers` value
- **THEN** the corresponding list renders in Tile mode

### Requirement: View-mode choice persists per page across reloads

When the viewer toggles to a new view mode, the system SHALL persist that
choice in `localStorage` under a page-specific key (`data-view-mode:children`,
`data-view-mode:teachers`) and apply it on subsequent visits in the same
browser.

#### Scenario: Reload picks up persisted mode
- **WHEN** the viewer switches Teachers to Table mode and reloads the page
- **THEN** the Teachers list renders in Table mode on reload

#### Scenario: Per-page independence
- **WHEN** the viewer sets Children to Table mode and Teachers to Tile mode
- **THEN** opening `/data` keeps Children in Table and Teachers in Tile

#### Scenario: localStorage is unavailable
- **WHEN** `localStorage` is disabled or throws (e.g., private browsing)
- **THEN** the page silently falls back to Tile mode without erroring
- **AND** the toggle still works for the current session

### Requirement: Table mode supports per-column sorting

In Table mode, each column header declared as sortable SHALL act as a sort
button. Clicking a sortable header cycles its state through: ascending →
descending → cleared. Only one column may be the active sort at a time;
clicking a different sortable header makes it the new active sort
(ascending). Non-sortable cells (e.g., avatar, action buttons) MUST NOT
respond to clicks as sort triggers.

#### Scenario: Click a sortable header
- **WHEN** the viewer clicks the "Name" header in Table mode
- **THEN** the rows reorder ascending by name and the header shows an
  ascending indicator (e.g., ▲)

#### Scenario: Click the same header again
- **WHEN** the active sort is "Name ascending" and the viewer clicks "Name"
- **THEN** the rows reorder descending by name and the header shows a
  descending indicator (e.g., ▼)

#### Scenario: Click the same header a third time
- **WHEN** the active sort is "Name descending" and the viewer clicks "Name"
- **THEN** the active sort is cleared, the rows return to their default
  order (server response order), and no header shows an indicator

#### Scenario: Switch to a different sortable column
- **WHEN** the active sort is "Lead teacher ascending" and the viewer clicks
  "Center"
- **THEN** "Center" becomes the active sort ascending and "Lead teacher"
  loses its indicator

#### Scenario: Non-sortable cell
- **WHEN** the viewer clicks the avatar column header (or an action column)
- **THEN** the sort does not change

### Requirement: Active sort persists per page across reloads

The active sort column and direction SHALL be persisted in `localStorage`
under page-specific keys (`data-sort:children`, `data-sort:teachers`) when
set and removed when cleared, and SHALL be restored on next visit in the
same browser.

#### Scenario: Reload restores sort
- **WHEN** the viewer sorts Children by "Last recording" descending and
  reloads
- **THEN** the table opens with Children already sorted by "Last recording"
  descending and the indicator is on that header

#### Scenario: Unknown column key in storage
- **WHEN** the persisted sort references a column key that no longer exists
  in the current build
- **THEN** the page renders Table mode with no active sort and overwrites
  the stored value to a cleared state

### Requirement: Toggle and sort are shared between pages

The Children list and the Teachers list SHALL use the same toggle component
and the same view-mode + sort hook so that the visual presentation and
interaction model are identical across `/data` and `/teachers`.

#### Scenario: Consistent UI
- **WHEN** the viewer alternates between `/data` and `/teachers`
- **THEN** the toggle control looks and behaves identically, including
  segment labels ("Tiles", "Table") and click feedback

### Requirement: Switching mode does not change filters or pagination

Switching the toggle MUST preserve any active search, filter, or pagination
state on the page; only the rendering of the visible items changes.

#### Scenario: Filtered list, mode change
- **WHEN** the viewer has typed a search term that filters Children to 3 of
  120, and the toggle is switched from Tiles to Table
- **THEN** Table mode shows exactly those 3 children
- **AND** the search input retains its value
