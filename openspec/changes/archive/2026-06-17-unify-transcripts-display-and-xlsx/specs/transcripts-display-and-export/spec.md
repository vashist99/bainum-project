## ADDED Requirements

### Requirement: Transcript cards on Classroom and Teacher Profile share the same visual presentation

The system SHALL render every transcript record on `/classrooms/:id`
and `/teacher-profile` using the same `<TranscriptRecordCard />`
component, so the date, activity badge, RAG-highlighted transcript
body, audio duration, total + per-category WPM, and per-category
word-count badges look and behave identically across the two pages.

#### Scenario: Teacher opens their own profile
- **WHEN** a teacher opens `/teacher-profile`
- **THEN** each of their recordings is shown as a single card
- **AND** the transcript body uses `highlightRAGSegments` with the
  `<RAGColorLegend />` when `ragSegments` is present
- **AND** the card shows total WPM, the compact per-category WPM line,
  and four colored per-category word-count badges (Science / Social /
  Literature / Language)

#### Scenario: Same teacher opens their classroom
- **WHEN** the same teacher opens `/classrooms/:id` for a room they
  lead or assist
- **THEN** each recording (regardless of whether `source` is `child`
  or `teacher`) is shown using the same card layout as the profile
- **AND** the card includes the RAG legend, total WPM badge, and the
  per-category word-count badges, identical to the profile

#### Scenario: Missing optional fields degrade gracefully
- **WHEN** a recording has no `ragSegments`, or `categoryWPM`, or
  `categoryWordCount`
- **THEN** the card omits the RAG legend and the missing per-category
  badges
- **AND** it still renders the date, activity, transcript text,
  duration, total WPM, and total word count

### Requirement: Classroom Delete is visible only to authorized viewers

In Classroom mode, the per-recording Delete button SHALL appear when
the viewer is an admin, or when the recording's `source === "teacher"`
and the viewer is the recording's original uploading teacher
(`teacherId === user.id`). It SHALL NOT appear in any other case.

#### Scenario: Admin sees Delete on every recording
- **WHEN** an admin views `/classrooms/:id`
- **THEN** every transcript card has a visible Delete button

#### Scenario: Lead teacher sees Delete only on their own recordings
- **WHEN** the recording was uploaded by the viewer themselves
  (`source === "teacher"` and `teacherId === viewer.id`)
- **THEN** the card shows Delete
- **AND** clicking it calls `DELETE /api/assessments/teacher/:id`

#### Scenario: Lead teacher does not see Delete on a colleague's recording
- **WHEN** the recording's `source === "teacher"` but
  `teacherId !== viewer.id`
- **THEN** the card does not show Delete

#### Scenario: Lead teacher does not see Delete on a child-source recording
- **WHEN** the recording's `source === "child"` and the viewer is not
  an admin
- **THEN** the card does not show Delete

#### Scenario: Admin deleting a child-source recording calls the child endpoint
- **WHEN** an admin clicks Delete on a recording with `source === "child"`
- **THEN** the call goes to `DELETE /api/assessments/:id`
- **AND** the page refetches transcripts + assessments + classroom on success

### Requirement: Teacher Profile sees Delete on every one of their own recordings

The Teacher-Profile transcript card SHALL show a Delete button on
every recording it renders, because the page is scoped to the
signed-in teacher's own data by construction. Clicking Delete SHALL
call `DELETE /api/assessments/teacher/:id` after a confirmation prompt.

#### Scenario: Teacher deletes a recording from their profile
- **WHEN** a teacher clicks Delete on a card in `/teacher-profile`
  and confirms the dialog
- **THEN** the request goes to `DELETE /api/assessments/teacher/:id`
- **AND** on success the profile refreshes its assessments and cohort
  thresholds, the card disappears, and a success toast is shown

#### Scenario: Teacher cancels the confirmation
- **WHEN** the teacher clicks Delete but cancels the browser
  `confirm()` dialog
- **THEN** no request is sent and the card remains

### Requirement: Teacher Profile download is an XLSX with a single combined sheet

The "Download All" button on `/teacher-profile` SHALL produce an
`.xlsx` workbook with **one** worksheet, where each row corresponds to
one recording and the columns are, in order: Date, Uploaded By,
Activity, Activity Context, Audio Length, Total Words, Total WPM,
Science Words, Science WPM, Social-Emotional Words, Social-Emotional
WPM, Literacy Words, Literacy WPM, Language Words, Language WPM,
Transcript. The Date column SHALL contain real `Date` cell values
formatted `mm/dd/yyyy`; the header row SHALL be bold and frozen.

#### Scenario: Teacher with recordings clicks Download All
- **WHEN** the teacher has at least one recording with non-empty
  `transcript` and clicks "Download All"
- **THEN** the browser downloads
  `<sanitized-teacher-name>_transcripts_<YYYY-MM-DD>.xlsx`
- **AND** opening it shows a single worksheet with one row per
  recording in newest-first order
- **AND** each Date cell is a real Date value formatted `mm/dd/yyyy`,
  not a string
- **AND** the Transcript column contains the full transcript text

#### Scenario: Teacher with no transcripts
- **WHEN** the teacher has zero recordings with non-empty `transcript`
- **THEN** the "Download All" button is not rendered

#### Scenario: Teacher name is missing
- **WHEN** the teacher record hasn't loaded a name yet (rare race
  condition during initial fetch)
- **AND** the user clicks Download All
- **THEN** the file falls back to `my_classroom_transcripts_<YYYY-MM-DD>.xlsx`

### Requirement: Classroom download keeps its existing two-sheet workbook

The "Download as Excel" button on `/classrooms/:id` SHALL continue to
produce a two-sheet workbook (`Recordings` + `Transcripts`) with the
exact columns described in the prior
`evolve-classroom-membership-and-transcripts` capability. The shared
`buildTranscriptsWorkbook` helper supports both layouts (`two-sheet`
default for classroom, `single-sheet` for teacher profile).

#### Scenario: Classroom download is unchanged
- **WHEN** an admin or lead teacher clicks "Download as Excel" on
  `/classrooms/:id`
- **THEN** the file has two sheets named exactly `Recordings` and
  `Transcripts`
- **AND** column counts and order match the previous behavior

### Requirement: Switching transcript display does not change network behavior

The system SHALL NOT introduce any new HTTP request, change the
existing fetch endpoints, or alter the 365-day server-side retention
window as a result of refactoring the Classroom transcripts section
from a `<table>` into a list of `<TranscriptRecordCard />` instances.

#### Scenario: Page load issues only the existing endpoints
- **WHEN** an authorized user opens `/classrooms/:id`
- **THEN** the page issues `GET /api/classrooms/:id`,
  `GET /api/classrooms/:id/assessments`, and
  `GET /api/classrooms/:id/transcripts` — and no other
  transcript-related endpoint

#### Scenario: Rendering a card does not refetch
- **WHEN** the viewer scrolls through the transcript card list and
  expands transcript bodies
- **THEN** no additional request is sent

### Requirement: Card transcript bodies remain bounded vertically

To keep long classrooms responsive, each transcript card SHALL clamp
the transcript body to a vertically-scrolling container (matching the
existing Teacher-Profile `max-h-64 overflow-y-auto` behavior) so that
a single very long recording does not stretch the page.

#### Scenario: A 20-minute transcript renders without page bloat
- **WHEN** a recording's transcript is several thousand words
- **THEN** the transcript body inside the card scrolls within its own
  container and the surrounding card remains compact

#### Scenario: Many recordings render without virtualization
- **WHEN** a classroom or profile shows up to ~150 recordings
- **THEN** every card mounts directly (no windowing); the page remains
  usable
- **AND** beyond that threshold, future work MAY introduce a "Show
  older" expansion — explicitly out of scope for this change
