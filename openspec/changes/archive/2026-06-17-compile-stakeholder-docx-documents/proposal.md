## Why

Stakeholders (Anita Zucker Center, Bainum Foundation, pilot schools, and usability
study participants) need polished, shareable documentation before broader rollout
and formal usability testing. The product has grown substantially (classrooms,
recordings with location/activity, parent notifications, school nomenclature,
transcript review, role-based navigation) but no consolidated **User Manual**,
**FAQ**, **Terms and Conditions**, or **Usability Testing Protocol** exists in a
format non-technical reviewers can open without the repo (Microsoft Word `.docx`).

## What Changes

- **NEW:** Create a dedicated folder `docs/stakeholder-deliverables/` housing
  source content and four final `.docx` files:
  1. **User Manual** — role-based walkthroughs (admin, teacher, parent) aligned
     with current UI labels (Schools, Children, Classrooms, notifications bell).
  2. **FAQ** — common questions on access, invitations, recordings, transcripts,
     data privacy, and troubleshooting.
  3. **Terms and Conditions** — legal/policy text for platform use, data handling,
     and participant consent framing (reviewed by stakeholders; not legal advice).
  4. **Usability Testing Protocol** — session script, tasks, success criteria,
     consent reminders, and observation sheet for moderated sessions with
     teachers and parents.
- **NEW:** Authoritative Markdown sources under
  `docs/stakeholder-deliverables/src/` for each document (easier diff/review in
  git than editing `.docx` directly).
- **NEW:** A repeatable build step (script or documented command) that compiles
  sources into `.docx` in `docs/stakeholder-deliverables/docx/`.
- Document content SHALL reflect the **current production feature set** as of
  implementation date (schools not centers, Add Parents not Invite Parents,
  notification bell, parent read-only classroom view, etc.).
- **Non-goal for this change:** In-app links to these documents or a public
  download portal (deliverables live in the repo folder for stakeholder handoff).

## Capabilities

### New Capabilities

- `user-manual-docx`: Structure, coverage, and quality bar for the User Manual
  Word deliverable and its Markdown source.
- `faq-docx`: Structure and required topic coverage for the FAQ Word deliverable.
- `terms-and-conditions-docx`: Required sections and review workflow for Terms
  and Conditions `.docx`.
- `usability-testing-protocol-docx`: Session design, tasks, metrics, and
  materials for moderated usability studies.

### Modified Capabilities

<!-- No application behavior changes; documentation-only deliverable. -->

## Impact

- **Repository:** New `docs/stakeholder-deliverables/` tree (Markdown sources +
  generated `.docx`); optional small script in `docs/stakeholder-deliverables/`
  or reuse of `python-docx` pattern from `generate_report.py`.
- **Dependencies:** Likely `pandoc` (preferred) or `python-docx` for generation;
  no runtime changes to `backend/` or `mockup1/`.
- **Stakeholders:** Product/research team receives four Word files for printing,
  email, and usability lab binders; legal/compliance team reviews Terms draft
  outside the repo.
- **OpenSpec / app specs:** No delta to `openspec/specs/*` application
  requirements.
