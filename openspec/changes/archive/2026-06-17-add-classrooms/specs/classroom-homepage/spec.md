## ADDED Requirements

### Requirement: Classroom homepage layout
The classroom homepage SHALL display the classroom name as the page title with the center name and teacher-in-charge name directly below in smaller text, plus the assistant teacher's name when one is set. It SHALL be accessible to admins (any classroom) and to the classroom's lead teacher and assistant teacher; other users SHALL be denied.

#### Scenario: Header content
- **WHEN** an authorized user opens a classroom homepage
- **THEN** the classroom name appears as the title with center and lead teacher names beneath it, and the assistant teacher's name when one is assigned

#### Scenario: Assistant teacher granted access
- **WHEN** the classroom's assistant teacher opens its homepage
- **THEN** the page loads with the same capabilities as the lead teacher

#### Scenario: Unauthorized teacher denied
- **WHEN** a teacher who is neither the classroom's lead nor its assistant opens its homepage
- **THEN** access is denied (redirect or 403 message)

### Requirement: Invite parents to classroom
The classroom homepage SHALL have an Invite button (visible to admins, the classroom's lead teacher, and its assistant teacher) that opens an invite panel. The panel SHALL list only parents who have accepted their primary invitation, each rendered as "Parent of <child name(s)>" with the parent's children's names listed. For a parent with multiple children, the inviter SHALL be able to choose WHICH of that parent's children to enroll (default: all eligible children selected). Confirming SHALL add the parent and only the selected children to the classroom, subject to the same-center rule. Classroom recording data is reflected on exactly the enrolled children's data pages.

#### Scenario: Panel lists accepted parents
- **WHEN** the invite panel opens
- **THEN** only parents with `invitationAccepted: true` are listed, labelled "Parent of <child name(s)>" with their children shown

#### Scenario: Inviter selects which children to enroll
- **WHEN** an inviter selects a parent with multiple children and unchecks one child before confirming
- **THEN** the parent and only the checked children are added to the classroom; the unchecked child is not enrolled

#### Scenario: Invite adds parent and selected children to classroom
- **WHEN** an admin, the lead teacher, or the assistant teacher invites a listed parent with the default selection
- **THEN** the parent and all their eligible same-center children become associated with the classroom and the panel reflects the new membership

#### Scenario: Cross-center child excluded
- **WHEN** a selected child's center differs from the classroom's center
- **THEN** that child is not added to the classroom

#### Scenario: Enrollment scopes recording fan-out
- **WHEN** a classroom recording is accepted after a partial enrollment
- **THEN** assessments are created only for the children enrolled in the classroom (the unenrolled sibling's data page shows nothing from this recording)

### Requirement: Classroom children list
The classroom homepage SHALL display a list of the children in the classroom — i.e., the children added via parents who accepted the invite to the classroom. Each entry SHALL show the child's name and the name(s) of their parent(s) in the classroom. An empty state SHALL prompt the viewer to invite parents.

#### Scenario: Children listed with their parents
- **WHEN** an authorized user opens a classroom homepage with members
- **THEN** every child in the classroom is listed by name with their classroom parent name(s) shown alongside

#### Scenario: Empty classroom
- **WHEN** a classroom has no children yet
- **THEN** the list area shows an empty state prompting the user to invite parents

#### Scenario: List updates after invite
- **WHEN** a parent is invited and their same-center children are added
- **THEN** the children list reflects the new members without a page reload

### Requirement: Aggregated classroom recording
The classroom homepage SHALL provide a Record button (available to admins, the lead teacher, and the assistant teacher) that uploads/records a classroom session for that specific classroom. The resulting assessment data SHALL be attributed to all children currently in the classroom. Aggregated classroom visualizations SHALL show the SUM of WPM per category (science, social-emotional, literacy, language) in the dot-matrix representation, and the AVERAGE values for the blue, green, and red markers on the semicircular dials.

#### Scenario: Recording scoped to classroom members
- **WHEN** a recording is completed from a classroom homepage
- **THEN** the assessment is linked to that classroom and to each child who is a member at recording time (not all children the teacher supervises)

#### Scenario: Dot matrix shows summed WPM
- **WHEN** the classroom homepage renders aggregated results
- **THEN** each category's dot matrix reflects the sum of per-category WPM across the classroom's children

#### Scenario: Dials show averaged markers
- **WHEN** the classroom homepage renders the semicircular dials
- **THEN** the blue, green, and red markers are positioned using averages across the classroom's children

### Requirement: Responsive classroom homepage
The classroom homepage, invite panel, and recording controls SHALL be responsive from mobile to desktop and consistent with the existing Tailwind/DaisyUI design system.

#### Scenario: Mobile invite panel
- **WHEN** the invite panel is opened on a mobile viewport
- **THEN** it renders as a usable full-width modal/sheet without horizontal overflow
