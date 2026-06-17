## MODIFIED Requirements

### Requirement: Per-role location catalogs
The system SHALL define curated location catalogs per recording context: a home-context list for parents (Mealtime or snacks; Personal Care (e.g., dressing, bathing, brushing teeth); Play/free play (e.g., blocks, puzzles, cars & trucks); Screen time (e.g., show, iPad / tablet / video games); Reading or looking at books; Outdoor play (e.g., playing soccer, swinging); Clean up (e.g., picking up toys); Structured Activities (non-free play activities such as circle time, art, small group)) and a school-context list for teachers and admins (Classroom; Excursion; Playground; Lab; Library). Each list SHALL end with an "Other (please specify)" option. Catalogs SHALL be mirrored between backend validator and frontend picker (kept in sync like the activity catalogs).

#### Scenario: Parent sees home locations
- **WHEN** a parent opens the location picker on the Home recording page
- **THEN** the parent (home) routine/setting location list is shown, ending with "Other (please specify)"

#### Scenario: Teacher sees school locations
- **WHEN** a teacher or admin opens the location picker in the classroom recording modal
- **THEN** the school location list (Classroom, Excursion, Playground, Lab, Library) is shown, ending with "Other (please specify)"

#### Scenario: Context isolation
- **WHEN** a teacher submits a parent-only location (e.g., "Mealtime or snacks") as a predefined value
- **THEN** it is not treated as predefined for the school context and goes through custom-location vetting

### Requirement: Location persisted on recordings with server-side re-validation
Recordings SHALL store an optional `location` label on both child assessments and teacher assessments. Accept routes SHALL re-validate non-predefined locations server-side so the client-side vetting cannot be bypassed. Existing assessments without a location remain valid.

#### Scenario: Location saved on parent activity recording
- **WHEN** a parent records for a selected child with location "Outdoor play (e.g., playing soccer, swinging)" and accepts the transcript
- **THEN** the saved child assessment for that child carries that location label

#### Scenario: Location saved on classroom recording
- **WHEN** a classroom recording is accepted with location "Playground"
- **THEN** the teacher assessment and every fanned-out child assessment carry location "Playground"

#### Scenario: Custom location re-validated at accept time
- **WHEN** an accept request carries a non-predefined location that fails vetting
- **THEN** the accept request is rejected with the vetting reason and nothing is saved

#### Scenario: Legacy assessments unaffected
- **WHEN** an assessment saved before this change is read
- **THEN** it loads normally with no location or with a legacy geographic label (e.g., "Park") unchanged

### Requirement: Location selection UX
Both recording flows SHALL include a location picker defaulting to the most common value per role (parent → Play/free play (e.g., blocks, puzzles, cars & trucks); teacher/admin → Classroom). Choosing "Other (please specify)" SHALL reveal a free-text input that must pass vetting before the recording can be submitted, mirroring the custom-activity UX. Location SHALL be displayed alongside activity wherever activity is already shown.

#### Scenario: Default location preselected for parent
- **WHEN** a parent opens the Home recording page
- **THEN** the location picker defaults to "Play/free play (e.g., blocks, puzzles, cars & trucks)"

#### Scenario: Default location preselected for teacher
- **WHEN** a teacher opens the classroom recording modal
- **THEN** the location picker defaults to "Classroom"

#### Scenario: Custom location must be vetted before upload
- **WHEN** a user selects "Other (please specify)" and has not passed vetting
- **THEN** the upload button is blocked with a message to validate the location first

#### Scenario: Location displayed with assessments
- **WHEN** a saved assessment with a location is listed in the UI
- **THEN** the location is shown alongside the activity/recording metadata
