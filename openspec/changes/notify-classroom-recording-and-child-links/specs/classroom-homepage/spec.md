## MODIFIED Requirements

### Requirement: Classroom children list

The classroom homepage SHALL display a list of the children in the classroom —
i.e., the children added via parents who accepted being added to the classroom.
Each entry SHALL show the child's name as a link to that child's data page at
`/data/child/<childId>` and the name(s) of their parent(s) in the classroom
(when visible in manage mode). An empty state SHALL prompt the viewer to add
parents (when in manage mode).

In parent (read) mode the list SHALL show only the calling parent's own
child(ren), each name linked to `/data/child/<childId>`, and SHALL omit other
parents' names; the empty-state prompt SHALL NOT mention "add parents" (parents
cannot initiate enrollment).

#### Scenario: Children listed with their parents
- **WHEN** an authorized user opens a classroom homepage with members
- **THEN** every child in the classroom is listed by name with their classroom
  parent name(s) shown alongside in manage mode
- **AND** each child name is a navigable link to `/data/child/<childId>`

#### Scenario: Empty classroom in manage mode
- **WHEN** a classroom has no children yet and an admin or teacher views it
- **THEN** the list area shows an empty state prompting the user to add parents

#### Scenario: Parent sees only their own children
- **WHEN** a parent enrolled in classroom C opens its homepage
- **THEN** the children list shows only that parent's own child(ren) enrolled
  in C, with each name linked to the child's data page
- **AND** no other parents' names are visible

#### Scenario: List updates after Add Parents
- **WHEN** a parent is added and their same-center children are added
- **THEN** the children list reflects the new members without a page reload

#### Scenario: Parent clicks child name from classroom list
- **WHEN** a parent clicks their child's name in the classroom children list
- **THEN** the app navigates to `/data/child/<childId>` for that child
