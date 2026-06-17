## ADDED Requirements

### Requirement: Classroom transcripts list

The classroom homepage SHALL include a "Transcripts" card listing every
recording attributed to the classroom. The card MUST be visible to
admins, the classroom's lead and assistant teachers, and every parent
enrolled in the classroom (i.e., the same audience already authorized
for the classroom homepage itself). Each entry SHALL show:
- the recording date,
- the activity label (when present) with a "School context" tooltip,
- the audio length and total word count,
- total WPM and per-category WPM (science, social-emotional, literacy,
  language),
- the transcript text with the existing RAG highlighting,
- the "Uploaded by" name.

Entries SHALL be sorted by date descending. An empty state SHALL be
shown when the classroom has no recordings.

#### Scenario: Card lists all classroom recordings
- **WHEN** an authorized user opens a classroom homepage that has 3
  recordings
- **THEN** the Transcripts card lists those 3 recordings, most recent
  first, with the fields above

#### Scenario: Empty state
- **WHEN** an authorized user opens a classroom homepage with no
  recordings
- **THEN** the Transcripts card shows an empty-state message such as
  "No recordings yet."

#### Scenario: Parent without access cannot see
- **WHEN** an unauthorized user reaches the classroom homepage URL
- **THEN** the page itself denies access (per existing
  classroom-homepage layout requirement) and therefore the Transcripts
  card is never rendered

### Requirement: Classroom transcripts are retained one year

Transcripts attributed to a classroom SHALL be visible in the classroom
Transcripts card for **one year** from the recording date. This is the
same window as the global transcript retention rule
(`TRANSCRIPT_RETENTION_DAYS = 365` in
`backend/lib/transcriptRetention.js`); the card MUST NOT show
transcripts whose `transcriptExpiresAt` has passed.

#### Scenario: Recent recording visible
- **WHEN** a classroom recording was saved 3 months ago
- **THEN** its transcript appears in the Transcripts card with full
  text

#### Scenario: Expired recording is hidden
- **WHEN** a recording's `transcriptExpiresAt` has passed
- **THEN** the Transcripts card does not list its text (the row may
  still exist in the database with an empty `transcript` after the
  purge job runs)

### Requirement: Download classroom transcripts as Excel

The Transcripts card SHALL provide a "Download as Excel" button that
generates an `.xlsx` workbook from the currently-loaded transcripts.
The workbook MUST contain exactly two sheets:

| Sheet | Columns (in order) |
| --- | --- |
| Recordings | Date, Uploaded By, Activity, Audio Length, Total Words, Total WPM, Science Words, Science WPM, Social-Emotional Words, Social-Emotional WPM, Literacy Words, Literacy WPM, Language Words, Language WPM |
| Transcripts | Date, Uploaded By, Activity, Transcript |

Per-category word counts come from `Assessment.categoryWordCount`
and `TeacherAssessment.categoryWordCount`. Per-category WPMs come
from `categoryWPM`. Total words and Total WPM come from `wordCount`
and `wordsPerMinute` on the same document.

- The `Date` column MUST be a real Excel date value (so Excel/Sheets
  can sort/filter it natively), not a pre-formatted string.
- One row per recording, sorted by date descending (matching the card).
- The file name SHALL be
  `<classroom-name>_transcripts_<YYYY-MM-DD>.xlsx`.
- The build MUST happen on the client (no new file-serving endpoint
  required) using `exceljs`.

#### Scenario: Workbook structure
- **WHEN** an authorized user clicks "Download as Excel" on a classroom
  with 4 recordings
- **THEN** the downloaded file is `<classroom>_transcripts_<today>.xlsx`
- **AND** it contains exactly two sheets named `Recordings` and
  `Transcripts`, each with 4 data rows in the order described

#### Scenario: Date column is a real Excel date
- **WHEN** the user opens the downloaded workbook in Excel or Google
  Sheets
- **THEN** the Date column sorts chronologically and supports date
  filters (i.e., the underlying cell value is a date, not a string)

#### Scenario: Empty classroom
- **WHEN** the classroom has 0 recordings
- **THEN** the "Download as Excel" button is disabled or hidden (the
  empty state replaces it)

#### Scenario: Per-category WPMs included
- **WHEN** a recording's `categoryWPM` is
  `{ science: 12, social: 8, literature: 5, language: 20 }`
- **THEN** that row in the Recordings sheet shows 12, 8, 5, 20 in the
  corresponding WPM columns (using the same field key mapping as the
  classroom homepage UI)

#### Scenario: Per-category word counts included
- **WHEN** a recording's `categoryWordCount` is
  `{ science: 30, social: 18, literature: 9, language: 45 }`
- **THEN** that row shows 30, 18, 9, 45 in the Science Words,
  Social-Emotional Words, Literacy Words, Language Words columns
- **AND** the Total Words column shows the recording's
  `wordCount` (not a sum of category words — category words exclude
  uncategorized speech)


## MODIFIED Requirements

### Requirement: Aggregated classroom recording
The classroom homepage SHALL provide a Record button (available to
admins, the lead teacher, and the assistant teacher) that uploads/records
a classroom session for that specific classroom. The resulting assessment
data SHALL be attributed to all children currently in the classroom AND
the resulting Assessment / TeacherAssessment rows SHALL set
`classroomId` to the classroom's id so the recording is queryable via
`GET /api/classrooms/:id/transcripts` and is correctly affected by the
classroom-deletion cascade. Aggregated classroom visualizations SHALL
show the SUM of WPM per category (science, social-emotional, literacy,
language) in the dot-matrix representation, and the AVERAGE values for
the blue, green, and red markers on the semicircular dials.

#### Scenario: Recording scoped to classroom members
- **WHEN** a recording is completed from a classroom homepage
- **THEN** the assessment is linked to that classroom (`classroomId`
  set) and to each child who is a member at recording time (not all
  children the teacher supervises)

#### Scenario: Recording surfaces in the classroom Transcripts card
- **WHEN** a recording is accepted on a classroom homepage
- **THEN** the Transcripts card on the same classroom homepage shows
  the new entry without a page reload

#### Scenario: Dot matrix shows summed WPM
- **WHEN** the classroom homepage renders aggregated results
- **THEN** each category's dot matrix reflects the sum of per-category
  WPM across the classroom's children

#### Scenario: Dials show averaged markers
- **WHEN** the classroom homepage renders the semicircular dials
- **THEN** the blue, green, and red markers are positioned using
  averages across the classroom's children
