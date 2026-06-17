## MODIFIED Requirements

### Requirement: Classroom homepage layout
The classroom homepage SHALL display the classroom name as the page title with the center name and teacher-in-charge name directly below in smaller text, plus the assistant teacher's name when one is set. It SHALL be accessible to admins (any classroom), to the classroom's lead teacher and assistant teacher in **manage** mode, and to any parent enrolled in the classroom (i.e., present in `classroom.parents`) in **read** mode. Other users SHALL be denied.

The same React route (`/classrooms/:id`) SHALL render both modes. The
backend SHALL signal the mode via the `role` field on the
`GET /api/classrooms/:id` response (`"admin" | "lead" | "assistant" | "parent"`).
Parent (read) mode MUST hide every write affordance — Add Parents,
Delete classroom, the (now removed) Add child block, and the Record
button — and MUST display only the subset of children and recordings
scoped to that parent's own child(ren).

#### Scenario: Header content
- **WHEN** an authorized user opens a classroom homepage
- **THEN** the classroom name appears as the title with center and lead teacher names beneath it, and the assistant teacher's name when one is assigned

#### Scenario: Assistant teacher granted access
- **WHEN** the classroom's assistant teacher opens its homepage
- **THEN** the page loads with the same capabilities as the lead teacher

#### Scenario: Enrolled parent granted read-only access
- **WHEN** a parent whose `_id` appears in `classroom.parents` opens the
  classroom homepage
- **THEN** the page loads with `role: "parent"`, the header, classroom
  member list (filtered to their own children), and the recording /
  transcript sections rendered
- **AND** the "Add Parents", "Delete classroom", and Record buttons are
  absent

#### Scenario: Unauthorized parent denied
- **WHEN** a parent who is NOT in `classroom.parents` opens the
  classroom homepage
- **THEN** access is denied (redirect or 403 message)

#### Scenario: Unauthorized teacher denied
- **WHEN** a teacher who is neither the classroom's lead nor its assistant opens its homepage
- **THEN** access is denied (redirect or 403 message)

### Requirement: Invite parents to classroom

The classroom homepage SHALL have an **Add Parents** button (visible to
admins, the classroom's lead teacher, and its assistant teacher in
manage mode only) that opens an Add Parents panel. The panel SHALL list
only parents who have accepted their primary invitation, each rendered
as "Parent of <child name(s)>" with the parent's children's names listed.
For a parent with multiple children, the operator SHALL be able to
choose WHICH of that parent's children to enroll (default: all eligible
children selected). The panel's confirm button SHALL read **Add** and
SHALL add the parent and only the selected children to the classroom,
subject to the same-center rule. Classroom recording data is reflected
on exactly the enrolled children's data pages. The endpoint backing
this flow SHALL remain `POST /api/classrooms/:id/invite`.

A successful Add Parents call SHALL also create an in-app notification
for every newly-added parent recipient as described in the
`parent-notifications` capability; this requirement governs only the UI
copy and behavior.

#### Scenario: Button label is "Add Parents"
- **WHEN** an admin or teacher opens the classroom homepage in manage mode
- **THEN** the visible primary affordance for enrolling reads
  "Add Parents", not "Invite Parents"

#### Scenario: Confirm button label is "Add"
- **WHEN** the Add Parents panel opens
- **THEN** its confirmation button reads "Add", not "Send Invite"

#### Scenario: Panel lists accepted parents
- **WHEN** the Add Parents panel opens
- **THEN** only parents with `invitationAccepted: true` are listed, labelled "Parent of <child name(s)>" with their children shown

#### Scenario: Operator selects which children to enroll
- **WHEN** an operator selects a parent with multiple children and unchecks one child before confirming
- **THEN** the parent and only the checked children are added to the classroom; the unchecked child is not enrolled

#### Scenario: Add Parents enrolls parent and selected children
- **WHEN** an admin, the lead teacher, or the assistant teacher adds a listed parent with the default selection
- **THEN** the parent and all their eligible same-center children become associated with the classroom and the panel reflects the new membership

#### Scenario: Cross-center child excluded
- **WHEN** a selected child's center differs from the classroom's center
- **THEN** that child is not added to the classroom

#### Scenario: Enrollment scopes recording fan-out
- **WHEN** a classroom recording is accepted after a partial enrollment
- **THEN** assessments are created only for the children enrolled in the classroom (the unenrolled sibling's data page shows nothing from this recording)

#### Scenario: Parent mode hides the button
- **WHEN** an enrolled parent opens the classroom homepage
- **THEN** the Add Parents button is not rendered anywhere on the page

### Requirement: Classroom children list
The classroom homepage SHALL display a list of the children in the classroom — i.e., the children added via parents who accepted being added to the classroom. Each entry SHALL show the child's name and the name(s) of their parent(s) in the classroom. An empty state SHALL prompt the viewer to add parents (when in manage mode).

In parent (read) mode the list SHALL show only the calling parent's own
child(ren) and SHALL omit other parents' names; the empty-state prompt
SHALL NOT mention "add parents" (parents cannot initiate enrollment).

#### Scenario: Children listed with their parents
- **WHEN** an authorized user opens a classroom homepage with members
- **THEN** every child in the classroom is listed by name with their classroom parent name(s) shown alongside

#### Scenario: Empty classroom in manage mode
- **WHEN** a classroom has no children yet and an admin or teacher views it
- **THEN** the list area shows an empty state prompting the user to add parents

#### Scenario: Parent sees only their own children
- **WHEN** a parent enrolled in classroom C opens its homepage
- **THEN** the children list shows only that parent's own child(ren)
  enrolled in C, with no other parents' names visible

#### Scenario: List updates after Add Parents
- **WHEN** a parent is added and their same-center children are added
- **THEN** the children list reflects the new members without a page reload

## ADDED Requirements

### Requirement: Remove child from classroom

The classroom homepage SHALL render a per-child Remove control (a Trash
icon next to each child's row in the classroom children list) visible
ONLY to admins AND the classroom's lead teacher. Assistant teachers and
parents SHALL NOT see the control.

Clicking the control SHALL open a confirmation dialog that names the
child being removed, names the classroom, and explicitly states:

- The child will no longer appear in this classroom's roster, recordings,
  or aggregated charts going forward.
- This action is reversible by re-adding the child's parent via the
  "Add Parents" flow.
- Historical recordings and assessments for this child stay attributed
  to this classroom (they are NOT deleted or re-attributed).
- If this is the last of the parent's children in the classroom, the
  parent will also be removed from the classroom and will receive an
  in-app notification.

Confirming SHALL call `DELETE /api/classrooms/:id/children/:childId`.
On success the page SHALL refetch the classroom, the children list
SHALL no longer show the removed child, and a success toast SHALL
appear.

#### Scenario: Admin sees Remove on every child
- **WHEN** an admin opens the classroom homepage
- **THEN** every row in the classroom children list shows a Trash
  affordance

#### Scenario: Lead teacher sees Remove on every child
- **WHEN** the classroom's lead teacher opens the classroom homepage
- **THEN** every row in the classroom children list shows a Trash
  affordance

#### Scenario: Assistant teacher does NOT see Remove
- **WHEN** the classroom's assistant teacher opens the classroom
  homepage
- **THEN** no Trash affordance is rendered on any child row

#### Scenario: Parent does NOT see Remove
- **WHEN** an enrolled parent opens the classroom homepage in read mode
- **THEN** no Trash affordance is rendered on any child row

#### Scenario: Remove asks for confirmation
- **WHEN** an authorized viewer clicks the Trash icon on child C
- **THEN** a confirmation dialog appears naming C and stating the
  consequences listed in this requirement
- **AND** clicking Cancel closes the dialog with no API call

#### Scenario: Confirmed remove drops the child from the list
- **WHEN** the viewer confirms the remove dialog
- **THEN** the app calls
  `DELETE /api/classrooms/<id>/children/<C>`
- **AND** on `{ changed: true }` the children list rerenders without C
- **AND** a success toast appears

#### Scenario: Remove that prunes the parent shows the right copy
- **WHEN** C is the last child of parent P in this classroom
- **THEN** the confirmation dialog includes the parent-pruning sentence
  AND the response payload's `parentPruned` field equals P's id
