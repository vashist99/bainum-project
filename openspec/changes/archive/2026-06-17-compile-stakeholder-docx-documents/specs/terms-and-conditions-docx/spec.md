# terms-and-conditions-docx Specification

## Purpose

Defines the required sections and review workflow for the Bainum platform Terms
and Conditions Word deliverable (draft for stakeholder and legal review).

## ADDED Requirements

### Requirement: Terms source and output locations

The project SHALL maintain a Markdown source at
`docs/stakeholder-deliverables/src/terms-and-conditions.md` and a generated Word
file at
`docs/stakeholder-deliverables/docx/Bainum-Terms-and-Conditions.docx`.

#### Scenario: Rebuild produces Terms Word file
- **WHEN** a contributor runs the documented build command after editing the Terms
  Markdown source
- **THEN** `Bainum-Terms-and-Conditions.docx` is created or updated in `docx/`

### Requirement: Draft disclaimer

The Terms document SHALL display a prominent **DRAFT — NOT LEGAL ADVICE** notice
on the title page and in the document header or footer. The notice SHALL state
that the text requires review by qualified counsel and institutional stakeholders
before external distribution or binding use.

#### Scenario: Draft notice visible
- **WHEN** a stakeholder opens the Terms `.docx`
- **THEN** the draft disclaimer appears before the main body sections

### Requirement: Required policy sections

The Terms SHALL include numbered sections covering at minimum: acceptance of
terms; eligibility and account registration; user responsibilities and acceptable
use; prohibited conduct; **child data privacy and confidentiality**; data
collection and use (including audio recordings and transcripts); third-party
service providers (transcription and AI analysis); data retention and deletion;
disclaimer of warranties; limitation of liability; modifications to terms;
governing contact information; and effective date.

#### Scenario: Child data section present
- **WHEN** the Terms document is reviewed against the section checklist
- **THEN** a dedicated section addresses sensitivity of child assessment data and
  role-scoped access obligations

#### Scenario: Third-party services named
- **WHEN** the data processing section is read
- **THEN** it acknowledges use of external transcription and analysis services
  without exposing secret credentials or internal API keys

### Requirement: Alignment with product behavior

Policy descriptions of access control, invitations, and retention SHALL not
contradict implemented platform behavior documented in OpenSpec (e.g., parents
see only their children's data; transcripts subject to retention limits).

#### Scenario: Parent access description accurate
- **WHEN** the confidentiality section describes parent access
- **THEN** it states parents may view only their own child's data, not other
  children in a classroom roster beyond names shown in shared classroom views

### Requirement: Usability and consent cross-reference

The Terms SHALL include a short subsection or footnote cross-referencing the
Usability Testing Protocol for how participant consent relates to study sessions
(without duplicating the full protocol).

#### Scenario: Research participation pointer
- **WHEN** a usability facilitator prepares consent materials
- **THEN** the Terms document points readers to the Usability Testing Protocol for
  session-specific consent procedures
