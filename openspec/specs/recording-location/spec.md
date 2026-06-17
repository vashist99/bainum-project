# recording-location Specification

## Purpose
TBD - created by archiving change add-recording-location-activity. Update Purpose after archive.
## Requirements
### Requirement: Per-role location catalogs
The system SHALL define curated location catalogs per recording context: a home-context list for parents (Home; Park; Friend / relative's home; Museum; Athletic event / stadium; Restaurant; Library; Grocery / big box store; Medical or therapy office; Travel (e.g., car, bus); Faith-based organization; Community Center (e.g., pool)) and a school-context list for teachers and admins (Classroom; Excursion; Playground; Lab; Library). Each list SHALL end with an "Other (please specify)" option. Catalogs SHALL be mirrored between backend validator and frontend picker (kept in sync like the activity catalogs).

#### Scenario: Parent sees home locations
- **WHEN** a parent opens the location picker in the Record Activity modal
- **THEN** the parent (home) location list is shown, ending with "Other (please specify)"

#### Scenario: Teacher sees school locations
- **WHEN** a teacher or admin opens the location picker in the classroom recording modal
- **THEN** the school location list (Classroom, Excursion, Playground, Lab, Library) is shown, ending with "Other (please specify)"

#### Scenario: Context isolation
- **WHEN** a teacher submits a parent-only location (e.g., "Home") as a predefined value
- **THEN** it is not treated as predefined for the school context and goes through custom-location vetting

### Requirement: Custom location AI vetting
The system SHALL expose an authenticated endpoint `POST /api/locations/validate` that vets a free-text location against the caller's context using the same LLM mechanism as custom activities (predefined values bypass the LLM; rejected values return a human-readable reason; accepted values return a normalized label). The LLM plumbing SHALL be shared with the activity validator rather than duplicated.

#### Scenario: Predefined bypasses LLM
- **WHEN** a predefined location (any casing/whitespace) is submitted for its own context
- **THEN** it is accepted immediately without an LLM call

#### Scenario: Valid custom location accepted
- **WHEN** a parent submits a plausible custom location (e.g., "Grandma's backyard")
- **THEN** the endpoint returns accepted with a normalized label

#### Scenario: Invalid custom location rejected
- **WHEN** a user submits an off-context or nonsensical location (e.g., "the moon", offensive text)
- **THEN** the endpoint returns accepted=false with a concise reason

#### Scenario: LLM unavailable
- **WHEN** the LLM is not configured and a custom location is submitted
- **THEN** the endpoint rejects it with a message directing the user to pick a predefined location

### Requirement: Location persisted on recordings with server-side re-validation
Recordings SHALL store an optional `location` label on both child assessments and teacher assessments. Accept routes SHALL re-validate non-predefined locations server-side so the client-side vetting cannot be bypassed. Existing assessments without a location remain valid.

#### Scenario: Location saved on parent activity recording
- **WHEN** a parent records an activity with location "Park" and accepts the transcript
- **THEN** every saved child assessment carries location "Park"

#### Scenario: Location saved on classroom recording
- **WHEN** a classroom recording is accepted with location "Playground"
- **THEN** the teacher assessment and every fanned-out child assessment carry location "Playground"

#### Scenario: Custom location re-validated at accept time
- **WHEN** an accept request carries a non-predefined location that fails vetting
- **THEN** the accept request is rejected with the vetting reason and nothing is saved

#### Scenario: Legacy assessments unaffected
- **WHEN** an assessment saved before this change is read
- **THEN** it loads normally with no location

### Requirement: Location selection UX
Both recording modals SHALL include a location picker defaulting to the most common value per role (parent → Home, teacher/admin → Classroom). Choosing "Other (please specify)" SHALL reveal a free-text input that must pass vetting before the recording can be submitted, mirroring the custom-activity UX. Location SHALL be displayed alongside activity wherever activity is already shown.

#### Scenario: Default location preselected
- **WHEN** a teacher opens the classroom recording modal
- **THEN** the location picker defaults to "Classroom"

#### Scenario: Custom location must be vetted before upload
- **WHEN** a user selects "Other (please specify)" and has not passed vetting
- **THEN** the upload button is blocked with a message to validate the location first

#### Scenario: Location displayed with assessments
- **WHEN** a saved assessment with a location is listed in the UI
- **THEN** the location is shown alongside the activity/recording metadata

