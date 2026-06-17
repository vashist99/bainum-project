## ADDED Requirements

### Requirement: User-visible Center nomenclature is School

The system SHALL present every physical site using the words **School** or
**Schools** in all user-facing UI and API error/success messages. Every
user-facing string that previously referred to a site as a "Center" or
"Centers" SHALL instead read "School" or "Schools".
This includes navigation labels, page titles, breadcrumbs, form field labels,
table column headers, filter controls, empty states, button text, toast
notifications, validation errors surfaced to the browser, aria-labels, and
tooltips.

Internal code identifiers, MongoDB field names, and CSS utility classes
(e.g. `text-center`) are explicitly excluded.

#### Scenario: Admin opens the schools list
- **WHEN** an admin opens the schools management page from the sidebar
- **THEN** the page title, breadcrumbs, and primary actions use the word
  "School" or "Schools" and never "Center" or "Centers"

#### Scenario: Teacher profile shows school affiliation
- **WHEN** a teacher's profile or card displays their site affiliation
- **THEN** the label reads "School" (not "Center")

#### Scenario: Classroom create form
- **WHEN** an admin creates a classroom and picks a site
- **THEN** every label and placeholder in that flow says "School"

#### Scenario: Cross-school enrollment error
- **WHEN** an API call fails because a child belongs to a different site than
  the classroom
- **THEN** the error message uses "school" (e.g. "different school") and not
  "center"

### Requirement: Frontend routes use /schools with legacy redirects

The canonical frontend routes for school CRUD SHALL be:
- `/schools` (list)
- `/schools/add` (create)
- `/schools/edit/:id` (edit)

Requests to the legacy `/centers`, `/centers/add`, or `/centers/edit/:id`
paths SHALL redirect to the equivalent `/schools` path without losing the
`:id` parameter.

#### Scenario: Bookmarked centers URL redirects
- **WHEN** a user navigates to `/centers/edit/abc123`
- **THEN** the browser is redirected to `/schools/edit/abc123`

#### Scenario: Sidebar links to schools
- **WHEN** an admin views the sidebar
- **THEN** the entry reads "Schools" and links to `/schools`

### Requirement: API exposes /api/schools with legacy alias

The backend SHALL mount school CRUD handlers at `/api/schools`. The same
handlers SHALL remain mounted at `/api/centers` so existing clients continue
to work during rollout.

User-visible error and success messages from these endpoints SHALL use
"school" nomenclature.

#### Scenario: List schools via new path
- **WHEN** an authenticated admin calls `GET /api/schools`
- **THEN** the response is 200 with a `schools` array (same data as the
  legacy centers list)

#### Scenario: Legacy API path still works
- **WHEN** an authenticated admin calls `GET /api/centers`
- **THEN** the response is 200 with the same payload shape as
  `GET /api/schools`

### Requirement: JSON uses school key on site affiliation fields

The API SHALL expose a `school` string on Teacher, Child, Classroom, and
School entity payloads, reflecting the stored site name. During the
transition period responses MAY also include the legacy `center` key with
the same value.

Create and update endpoints SHALL accept `school` in the request body and
store it in the existing `center` persistence field. They SHALL also accept
legacy `center` on writes (same normalization).

#### Scenario: Create child with school field
- **WHEN** an admin POSTs to create a child with `{ "school": "Sunrise Academy" }`
- **THEN** the saved document has `center: "Sunrise Academy"` internally
- **AND** the response includes `school: "Sunrise Academy"`

#### Scenario: Legacy center key still accepted on write
- **WHEN** a client POSTs with `{ "center": "Sunrise Academy" }` only
- **THEN** the write succeeds and the response includes both `school` and
  `center` with the same value
