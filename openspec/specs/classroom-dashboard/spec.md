# classroom-dashboard Specification

## Purpose
TBD - created by archiving change add-classrooms. Update Purpose after archive.
## Requirements
### Requirement: Teacher and admin homepage shows classrooms instead of stat cards
The homepage for teachers and admins SHALL no longer render the dashboard stat cards or the "Recording Tools" card grid. Teachers SHALL see a card for every classroom where they are lead OR assistant — assisted classrooms marked with a small "Assistant" badge — and a "Create Classroom" button. Admins SHALL see a "Create Classroom" button (the full classroom list lives on the Classrooms page).

#### Scenario: Teacher homepage
- **WHEN** a teacher opens the homepage
- **THEN** no dashboard stat cards or recording-tool cards are shown, and cards for every classroom the teacher leads or assists plus a "Create Classroom" button are shown

#### Scenario: Assistant badge
- **WHEN** a teacher views the homepage card of a classroom where they are the assistant (not the lead)
- **THEN** the card displays a small "Assistant" badge

#### Scenario: Teacher with no classroom
- **WHEN** a teacher with no classroom opens the homepage
- **THEN** an empty state with the "Create Classroom" button is shown

#### Scenario: Admin homepage
- **WHEN** an admin opens the homepage
- **THEN** no dashboard stat cards or recording-tool cards are shown, and a "Create Classroom" button is visible

### Requirement: Parent homepage shows enrolled classrooms
The parent homepage SHALL be simplified to a list of classroom cards for the classrooms their children are enrolled in, replacing the dashboard stat cards. Each card SHALL show the classroom name, teacher-in-charge, and center, plus which of the parent's children are enrolled. Tapping an enrolled child SHALL open that child's data page (parents do not get access to the classroom administration homepage). The "Record Activity" action SHALL remain available.

#### Scenario: Parent sees enrolled classroom cards
- **WHEN** a parent whose child is enrolled in a classroom opens the homepage
- **THEN** a card for that classroom is shown with the classroom name, teacher, center, and the enrolled child's name; no dashboard stat cards are rendered

#### Scenario: Child link opens child data page
- **WHEN** the parent taps an enrolled child on a classroom card
- **THEN** the app navigates to that child's data page (where classroom recordings are reflected)

#### Scenario: Parent with no enrollments
- **WHEN** a parent whose children are in no classrooms opens the homepage
- **THEN** an empty state explains that classrooms appear once a teacher or admin enrolls their child

#### Scenario: Parent cannot open classroom administration
- **WHEN** a parent attempts to open a classroom's administration homepage directly
- **THEN** access is denied as before

### Requirement: Create Classroom form
Clicking "Create Classroom" SHALL open a form with a classroom-name field and an optional assistant-teacher selector. For teachers, the lead teacher and center SHALL be displayed pre-populated (read-only) from the logged-in teacher. For admins, the form SHALL provide a center selector and a teacher selector whose options are limited to teachers of the selected center. The assistant-teacher selector SHALL list only teachers of the classroom's center, excluding the selected lead.

#### Scenario: Teacher form auto-populated
- **WHEN** a teacher opens the Create Classroom form
- **THEN** the lead teacher and center fields show the teacher's own name and center and cannot be edited

#### Scenario: Admin teacher options follow center
- **WHEN** an admin selects a center in the form
- **THEN** the teacher dropdown lists only teachers belonging to that center

#### Scenario: Assistant options exclude lead
- **WHEN** a lead teacher is selected (or implied for teacher users) and the assistant dropdown is opened
- **THEN** it lists teachers of the classroom's center excluding the lead, and may be left empty

#### Scenario: Successful creation navigates to classroom
- **WHEN** the form is submitted successfully
- **THEN** the user is taken to the new classroom's homepage (or the classroom list) and sees a success toast

### Requirement: Admin Classrooms page
The system SHALL provide a Classrooms page for admins showing all classrooms as a responsive card grid. Each card SHALL show the classroom name prominently with the teacher-in-charge name and center name in smaller text below. Clicking a card SHALL navigate to that classroom's homepage.

#### Scenario: Admin views classrooms page
- **WHEN** an admin opens the Classrooms page
- **THEN** every classroom is shown as a card with name, teacher, and center

#### Scenario: Card click navigates
- **WHEN** a user clicks a classroom card
- **THEN** the app navigates to that classroom's homepage route

### Requirement: Sidebar classrooms navigation
The sidebar SHALL include a "Classrooms" navigation entry associated with the Dashboard area. For admins it SHALL link to the Classrooms page; for teachers it SHALL link to their classrooms view on the homepage. Parents SHALL NOT see the entry.

#### Scenario: Admin sidebar
- **WHEN** an admin views the sidebar
- **THEN** a Classrooms entry is visible and navigates to the Classrooms page

#### Scenario: Parent sidebar
- **WHEN** a parent views the sidebar
- **THEN** no Classrooms entry is shown

### Requirement: Responsive, consistent styling
All new dashboard components (classroom cards, Create Classroom form, Classrooms page) SHALL be responsive from mobile (~360px) to desktop and match the existing Tailwind/DaisyUI visual language (cards, buttons, spacing, dark/light theme tokens).

#### Scenario: Mobile layout
- **WHEN** the Classrooms page or homepage is viewed at a mobile viewport
- **THEN** classroom cards stack in a single column without horizontal overflow

