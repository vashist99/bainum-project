# faq-docx Specification

## Purpose
TBD - created by archiving change compile-stakeholder-docx-documents. Update Purpose after archive.
## Requirements
### Requirement: FAQ source and output locations

The project SHALL maintain a Markdown source at
`docs/stakeholder-deliverables/src/faq.md` and a generated Word file at
`docs/stakeholder-deliverables/docx/Bainum-FAQ.docx`.

#### Scenario: Rebuild produces FAQ Word file
- **WHEN** a contributor runs the documented build command after editing `faq.md`
- **THEN** `Bainum-FAQ.docx` is created or updated in the `docx/` folder

### Requirement: Question-and-answer format

The FAQ SHALL list each entry as a **Question** heading followed by an **Answer**
paragraph. Answers SHALL be concise (typically 2–6 sentences) and actionable.

#### Scenario: Entry structure
- **WHEN** a reader scans the FAQ
- **THEN** every topic is visibly separated as Q&A, not narrative prose only

### Requirement: Required topic coverage

The FAQ SHALL include at least one Q&A entry for each of the following topics:
account creation and roles; forgot password; parent invitation and registration;
teacher invitation; who can see a child's data; adding parents to a classroom;
recording audio and choosing location/activity; transcript review and retention;
exporting data (e.g., Excel); notification bell behavior; what a School is vs a
Classroom; troubleshooting login and 403/access denied; and whom to contact for
support.

#### Scenario: Access control question present
- **WHEN** the FAQ is reviewed against the topic checklist
- **THEN** at least one entry explains parent vs teacher vs admin data visibility

#### Scenario: Transcript retention explained
- **WHEN** a parent reads the FAQ
- **THEN** an entry describes that transcripts may expire after the platform's
  retention period and what that means for viewing old recordings

### Requirement: Role tags on entries

Each FAQ entry SHALL tag the intended audience as **All**, **Admin**, **Teacher**,
or **Parent** (inline label or subsection grouping).

#### Scenario: Parent-specific entries grouped or labeled
- **WHEN** a parent reads the FAQ
- **THEN** they can identify entries marked for parents without reading admin-only
  troubleshooting

### Requirement: No contradictory legacy terminology

FAQ text SHALL use **School** and **Add Parents** terminology consistent with the
current UI. Legacy `/centers` routes MAY be mentioned only as redirects to Schools.

#### Scenario: Schools terminology
- **WHEN** the FAQ refers to organizational sites
- **THEN** it says School or Schools, not Center or Centers, in user-facing answers

