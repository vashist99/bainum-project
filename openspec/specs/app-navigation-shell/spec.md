# app-navigation-shell Specification

## Purpose
TBD - created by archiving change consistent-sidebar-navigation. Update Purpose after archive.
## Requirements
### Requirement: Sidebar present on every authenticated page

Every authenticated page SHALL render the same navigation shell: the role-appropriate sidebar (collapsible on mobile via the navbar hamburger) plus the top navbar. This includes the Children list, child detail, teacher profile/detail, and all add/edit form pages. Unauthenticated pages (login, registration, password reset) SHALL keep their standalone layouts.

#### Scenario: Children list keeps the sidebar
- **WHEN** an admin or teacher navigates from the homepage to the Children list (`/data`)
- **THEN** the same sidebar remains visible (desktop) or reachable via the hamburger (mobile), with "Children" marked active

#### Scenario: Forms keep the sidebar
- **WHEN** a user opens any add/edit form (child, school, teacher, data)
- **THEN** the sidebar shell is present, identical to the rest of the app

#### Scenario: Parent sees sidebar on child page
- **WHEN** a parent opens their child's data page
- **THEN** the parent-scoped sidebar (no admin/teacher entries) is present

#### Scenario: Login page unaffected
- **WHEN** an unauthenticated visitor opens the login page
- **THEN** no sidebar or app navbar shell is rendered

### Requirement: Single shared layout component
Authenticated pages SHALL compose a single shared layout component (sidebar + navbar + content area) rather than hand-wiring Sidebar/Navbar per page. The layout SHALL derive the active sidebar item from the current route automatically.

#### Scenario: Active item follows the route
- **WHEN** the user is on any route under `/classrooms`
- **THEN** the Classrooms sidebar item is highlighted without the page passing a hardcoded path

#### Scenario: One implementation
- **WHEN** the navigation shell needs a change (e.g., a new sidebar entry)
- **THEN** it is made in one component and appears on every authenticated page

### Requirement: Legacy top tabs removed

The navbar SHALL NOT render the horizontal navigation tabs (My Profile / Schools / Teachers / Children) or their mobile dropdown equivalent on any page. The navbar retains the brand link, breadcrumbs, notifications, and the user menu.

#### Scenario: No tabs anywhere
- **WHEN** any authenticated page is rendered at any viewport size
- **THEN** the top navigation tabs and the legacy mobile dropdown are absent; navigation happens through the sidebar

### Requirement: Content fits beside the sidebar

Pages gaining the sidebar SHALL remain usable at desktop and mobile widths: no horizontal overflow, and wide content (tables, charts) adapts to the reduced content width on desktop.

#### Scenario: Wide content adapts
- **WHEN** the Children table or a child's charts render on a desktop viewport with the sidebar visible
- **THEN** content fits the remaining width without horizontal scrolling of the page body

### Requirement: Notification bell in the navbar

The shared navigation shell's Navbar SHALL render a `NotificationBell`
affordance to the right of the breadcrumbs and to the left of the user
menu, on every authenticated page. The bell SHALL show a badge with the
count of the signed-in user's unexpired notifications (omitted when
zero) and SHALL open a dropdown listing those notifications on click.
The bell SHALL NOT be rendered on unauthenticated pages.

The bell SHALL coexist with all other navbar elements named in the
"Legacy top tabs removed" requirement (brand link, breadcrumbs, user
menu); adding the bell does not re-introduce the removed horizontal
tabs.

#### Scenario: Bell visible on every authenticated page
- **WHEN** an authenticated user visits `/home`, `/data`, `/teachers`,
  or `/classrooms/<id>`
- **THEN** the same `NotificationBell` is rendered in the navbar on
  every one of those pages

#### Scenario: Bell hidden on login
- **WHEN** an unauthenticated visitor opens `/login`, `/register`, or
  any standalone (no-shell) page
- **THEN** the bell is not rendered

#### Scenario: Badge reflects unexpired notification count
- **WHEN** the signed-in user has N (N > 0) unexpired notifications in
  the `notifications` collection
- **THEN** the bell shows a badge with the number N
- **AND WHEN** N = 0
- **THEN** the bell renders without a number badge

