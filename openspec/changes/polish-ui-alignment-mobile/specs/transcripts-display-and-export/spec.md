## MODIFIED Requirements

### Requirement: Transcript cards on Classroom and Teacher Profile share the same visual presentation

The system SHALL render every transcript record on `/classrooms/:id`
and `/teacher-profile` using the same `<TranscriptRecordCard />`
component, so the date, activity badge, RAG-highlighted transcript
body, audio duration, total + per-category WPM, and per-category
word-count badges look and behave identically across the two pages.

On viewports below the `sm` breakpoint (~640px), each card SHALL stack
its header metadata and delete control so they do not overlap: the title
row and badges wrap with `flex-wrap`, the delete button remains tappable
(≥44px touch target), and the transcript body uses `break-words` with
vertical scroll inside the existing max-height panel. Category badges and
WPM metadata SHALL wrap to additional lines rather than forcing horizontal
overflow.

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

#### Scenario: Transcript card on phone
- **WHEN** a teacher opens `/classrooms/:id` at 375px width with at
  least one transcript
- **THEN** the transcript card header badges wrap without overlapping
  the delete button
- **AND** long transcript text scrolls inside the body panel without
  widening the page
- **AND** per-category word-count badges wrap to multiple lines

#### Scenario: Long activity badge on phone
- **WHEN** a transcript card displays a long activity label at 320px
  width
- **THEN** badges and date line wrap within the card without horizontal
  overflow of the card or page
