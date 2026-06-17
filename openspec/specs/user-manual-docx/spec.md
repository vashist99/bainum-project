# user-manual-docx Specification

## Purpose
TBD - created by archiving change compile-stakeholder-docx-documents. Update Purpose after archive.
## Requirements
### Requirement: User Manual source and output locations

The project SHALL maintain a Markdown source file at
`docs/stakeholder-deliverables/src/user-manual.md` and a generated Word file at
`docs/stakeholder-deliverables/docx/Bainum-User-Manual.docx`.

#### Scenario: Rebuild produces Word file
- **WHEN** a contributor runs the documented build command after editing the
  Markdown source
- **THEN** `Bainum-User-Manual.docx` is created or updated in the `docx/` folder

### Requirement: Role-based coverage

The User Manual SHALL include separate sections for **Administrator**,
**Teacher**, and **Parent** roles. Each section SHALL describe only features
available to that role in the current application.

#### Scenario: Admin section includes school management
- **WHEN** a reader opens the Administrator section
- **THEN** it documents Schools, Teachers, Children, and Classrooms management
  flows using current UI labels

#### Scenario: Parent section excludes admin-only features
- **WHEN** a reader opens the Parent section
- **THEN** it does not describe Schools or Teachers admin pages

### Requirement: Core workflow documentation

The User Manual SHALL document, with numbered steps, the following workflows at
minimum: sign-in and password reset; navigating the sidebar; viewing the
dashboard; opening a classroom homepage; adding parents to a classroom (Add
Parents); recording or uploading activity with location and activity labels;
reviewing transcripts; viewing child developmental charts; using the notification
bell; and parent registration via invitation email.

#### Scenario: Add Parents workflow documented
- **WHEN** an admin or teacher reads the classroom section
- **THEN** steps explain opening Add Parents, selecting parents and children,
  and confirming Add — not legacy "Invite" wording

#### Scenario: School nomenclature in manual text
- **WHEN** any section refers to organizational sites
- **THEN** it uses the word **School** (not Center) and route `/schools`

### Requirement: Document front matter

The User Manual `.docx` SHALL include a title page (product name, document type,
version, date), a table of contents, and a one-paragraph product overview
describing the Bainum early-childhood assessment platform purpose.

#### Scenario: Title page present
- **WHEN** the Word file is opened
- **THEN** the first page identifies the document as the Bainum User Manual with
  version and date

### Requirement: Readable formatting

The generated `.docx` SHALL use consistent heading levels (H1–H3), numbered
steps for procedures, and bullet lists for prerequisites. Body text SHALL be
plain language suitable for non-technical teachers and parents.

#### Scenario: Procedure uses numbered steps
- **WHEN** a workflow section describes how to upload a recording
- **THEN** steps are numbered sequentially rather than buried in a single paragraph

