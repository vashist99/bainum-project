## ADDED Requirements

### Requirement: Shared search field aligns icon and input

The frontend SHALL provide a single shared search-field component (e.g.
`SearchField`) used on every list page that offers text search. The component
MUST render the search icon and text input inside one bordered control with
`flex items-center` alignment so the icon is vertically centered with the
input baseline at all viewport widths. The input MUST use `grow min-w-0` so
long placeholder text does not overflow the control. List pages that search
today (Schools, Teachers, Classrooms) MUST use this component rather than
ad hoc `input-group` markup.

#### Scenario: Schools page search alignment
- **WHEN** an admin opens `/schools` at any viewport width
- **THEN** the search icon sits centered inside the left edge of the search
  control, aligned with the typed text

#### Scenario: Teachers page search alignment
- **WHEN** an admin opens `/teachers` at any viewport width
- **THEN** the search field uses the same shared component and alignment as
  Schools and Classrooms

#### Scenario: Classrooms page uses shared component
- **WHEN** an admin opens `/classrooms`
- **THEN** the search field is rendered via the shared component with
  identical markup/classes to Schools and Teachers

### Requirement: Navbar user avatar icon is centered

The navbar user-menu trigger SHALL render the profile icon inside a circular
`bg-primary` background with the icon optically centered horizontally and
vertically. The implementation MUST NOT rely on DaisyUI `.avatar` placeholder
rules that conflict with custom sizing on the inner circle.

#### Scenario: Desktop navbar avatar
- **WHEN** an authenticated user views any page at ≥1024px width
- **THEN** the `Users` icon appears centered inside the primary-colored circle
  in the navbar user-menu button

#### Scenario: Mobile navbar avatar
- **WHEN** an authenticated user views any page at &lt;1024px width with the
  hamburger menu visible
- **THEN** the same centered avatar appears beside the notification bell without
  vertical offset relative to neighboring navbar controls

### Requirement: List page toolbars stack on narrow viewports

The system SHALL require entity list pages with a search field, view-mode
toggle, and primary action (Schools, Teachers, Children on `/data`,
Classrooms) to use a responsive toolbar layout that stacks controls in a
column below the `sm` breakpoint (~640px) and arranges them in a row or
wrapped row at wider widths. On narrow viewports each control MUST be full
width of the toolbar (`w-full`) so controls do not overlap or clip.

#### Scenario: Teachers toolbar on phone
- **WHEN** an admin opens `/teachers` at 375px width
- **THEN** the search field, Tiles/Table toggle, and Add Teacher button appear
  in a vertical stack with no horizontal overlap

#### Scenario: Schools toolbar on phone
- **WHEN** an admin opens `/schools` at 375px width
- **THEN** the search field, view toggle, and Add School button stack without
  clipping

#### Scenario: Teachers toolbar on desktop
- **WHEN** an admin opens `/teachers` at ≥1024px width
- **THEN** the toolbar controls appear on one row (or wrapped row) to the
  right of the page title without forcing page-level horizontal scroll
