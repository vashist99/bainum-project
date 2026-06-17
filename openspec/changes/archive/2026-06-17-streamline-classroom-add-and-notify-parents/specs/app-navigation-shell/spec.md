## ADDED Requirements

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
