# children-list-page Specification

## Purpose
TBD - created by archiving change center-to-school-nomenclature. Update Purpose after archive.
## Requirements
### Requirement: Children list page title matches Teachers page style

The `/data` page (Children tab) SHALL display a page-level heading **Children**
using the same typographic pattern as the `/teachers` page:
- `<h1>` with classes `text-3xl font-bold text-base-content mb-2`
- A muted subtitle paragraph directly below (`text-base-content/70`)

The page SHALL NOT use the gradient hero title ("Data" with
`bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`).

The sidebar label for this section SHALL remain **Children** (not "Child Data"
or "Data").

#### Scenario: Admin opens the Children tab
- **WHEN** an admin navigates to `/data`
- **THEN** the top-of-page `<h1>` reads "Children" in plain bold text matching
  the Teachers page weight and size
- **AND** a short descriptive subtitle appears beneath the title
- **AND** no gradient text treatment is applied to the page title

#### Scenario: Teacher opens the Children tab
- **WHEN** a teacher with backend access opens `/data`
- **THEN** the same "Children" heading and subtitle pattern is shown
- **AND** the inner list card title (e.g. "All Children") remains separate
  from the page-level hero

#### Scenario: Sidebar consistency
- **WHEN** the user is on `/data`
- **THEN** the sidebar highlights the item labelled "Children"

