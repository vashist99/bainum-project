# usability-testing-protocol-docx Specification

## Purpose
TBD - created by archiving change compile-stakeholder-docx-documents. Update Purpose after archive.
## Requirements
### Requirement: Protocol source and output locations

The project SHALL maintain a Markdown source at
`docs/stakeholder-deliverables/src/usability-testing-protocol.md` and a generated
Word file at
`docs/stakeholder-deliverables/docx/Bainum-Usability-Testing-Protocol.docx`.

#### Scenario: Rebuild produces protocol Word file
- **WHEN** a contributor runs the documented build command after editing the
  protocol Markdown source
- **THEN** `Bainum-Usability-Testing-Protocol.docx` is created or updated in `docx/`

### Requirement: Session logistics section

The protocol SHALL specify target session length (45–60 minutes), moderated
think-aloud method, recommended environment (quiet room, stable internet),
optional screen/audio recording policy, facilitator and observer roles, and
materials needed (test accounts, printed task cards optional).

#### Scenario: Facilitator preparation
- **WHEN** a researcher reads the logistics section
- **THEN** they know duration, roles, and equipment requirements before scheduling

### Requirement: Participant criteria

The protocol SHALL define inclusion criteria for **teacher** participants (e.g.,
active account, at least one classroom or willingness to create one in a sandbox)
and **parent** participants (e.g., accepted invitation, at least one linked child).

#### Scenario: Teacher eligibility stated
- **WHEN** recruiting teachers for the study
- **THEN** the protocol lists minimum account/classroom prerequisites

### Requirement: Teacher task scenarios

The protocol SHALL include at least **six** scripted task scenarios for teachers,
each with: task prompt (read aloud to participant), starting location (URL or
sidebar entry), success criteria, and allowed hints. Tasks SHALL cover classroom
homepage navigation, adding parents to a classroom, recording or uploading
activity with location and activity selection, finding a child's transcript,
using the notification bell, and navigating Children list with school filter.

#### Scenario: Add Parents task included
- **WHEN** the teacher task list is reviewed
- **THEN** one task requires adding a parent to a classroom using the Add Parents
  flow

#### Scenario: Success criteria per task
- **WHEN** a facilitator scores a session
- **THEN** each teacher task has an explicit definition of successful completion

### Requirement: Parent task scenarios

The protocol SHALL include at least **four** scripted task scenarios for parents,
covering: opening their child's data page; viewing developmental charts or
transcripts; accessing a read-only classroom view when enrolled; and interacting
with the notification bell (view and dismiss).

#### Scenario: Parent classroom read-only task
- **WHEN** the parent task list is reviewed
- **THEN** one task confirms the parent can open an enrolled classroom without
  admin/teacher write controls visible

### Requirement: Observation and scoring worksheet

The protocol SHALL include a printable worksheet table with columns for task
number, participant ID, time to complete, outcome code (completed unaided /
completed with hint / failed / abandoned), severity if failed (cosmetic / minor /
major), and free-text notes.

#### Scenario: Observer records failure severity
- **WHEN** a participant cannot complete a task without abandonment
- **THEN** the worksheet provides a severity column for facilitators to record

### Requirement: Post-session questionnaire

The protocol SHALL include a short post-session questionnaire (at least five
Likert-scale or yes/no items plus two open-ended questions) covering ease of
navigation, confidence in finding child data, clarity of labels, and overall
satisfaction.

#### Scenario: Open feedback collected
- **WHEN** a session ends
- **THEN** the protocol prompts at least two open-ended debrief questions

### Requirement: Consent and Terms cross-reference

The protocol SHALL reference the Terms and Conditions draft for platform use and
include a checklist item confirming verbal/written consent was obtained before
recording or data collection in the session.

#### Scenario: Consent before recording
- **WHEN** a facilitator plans to screen-record
- **THEN** the protocol requires documented consent aligned with the Terms draft

### Requirement: Mobile navigation observation hook

The protocol SHALL include one optional exploratory task or debrief question
about sidebar/hamburger navigation on a phone-sized viewport, to feed the
deferred mobile navigation decision noted in product planning.

#### Scenario: Mobile nav feedback captured
- **WHEN** sessions include a phone or narrow viewport
- **THEN** facilitators have a structured prompt to capture navigation difficulty

