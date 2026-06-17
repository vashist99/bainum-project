## 1. Folder scaffold

- [x] 1.1 Create `docs/stakeholder-deliverables/` with `src/`, `docx/`, and
      `README.md` explaining edit → build → commit workflow.
- [x] 1.2 Add optional `reference.docx` placeholder note in README (logo
      supplied by stakeholders) or commit a minimal reference template.

## 2. Build toolchain

- [x] 2.1 Implement `docs/stakeholder-deliverables/build-docx.sh` (or
      `build-docx.py`) that converts all four Markdown sources to `.docx`.
- [x] 2.2 Prefer Pandoc; document install (`apt`/`brew`) in README; implement
      python-docx fallback if Pandoc missing.
- [x] 2.3 Verify one command regenerates all four files in `docx/`.

## 3. User Manual (`user-manual.md` → `Bainum-User-Manual.docx`)

- [x] 3.1 Write front matter: title page, TOC placeholder, product overview.
- [x] 3.2 Write **Administrator** section (login, dashboard, Schools, Teachers,
      Children, Classrooms, notifications).
- [x] 3.3 Write **Teacher** section (classrooms lead/assistant, Add Parents,
      record activity, transcripts, profile, notifications).
- [x] 3.4 Write **Parent** section (registration, child page, classroom
      read-only, record activity, notifications).
- [x] 3.5 Cross-check labels against `Sidebar.jsx` and current routes; use
      School/Children/Add Parents terminology.
- [x] 3.6 Generate `.docx` and spot-check formatting (headings, numbered steps).

## 4. FAQ (`faq.md` → `Bainum-FAQ.docx`)

- [x] 4.1 Draft Q&A entries for all required topics (see `faq-docx` spec).
- [x] 4.2 Tag each entry with audience (All / Admin / Teacher / Parent).
- [x] 4.3 Generate `.docx` and verify Q&A structure renders correctly.

## 5. Terms and Conditions (`terms-and-conditions.md` → `Bainum-Terms-and-Conditions.docx`)

- [x] 5.1 Draft all required numbered sections with DRAFT disclaimer.
- [x] 5.2 Add child-data privacy, third-party services, and retention language
      aligned with OpenSpec transcript-retention behavior.
- [x] 5.3 Cross-reference Usability Testing Protocol for consent.
- [x] 5.4 Generate `.docx`; flag in README that legal review is required before
      external use.

## 6. Usability Testing Protocol (`usability-testing-protocol.md` → `Bainum-Usability-Testing-Protocol.docx`)

- [x] 6.1 Write logistics, participant criteria, and consent checklist.
- [x] 6.2 Write ≥6 teacher tasks with prompts, success criteria, and hints.
- [x] 6.3 Write ≥4 parent tasks with prompts and success criteria.
- [x] 6.4 Add observation worksheet table and post-session questionnaire (5+
      Likert + 2 open questions).
- [x] 6.5 Add mobile navigation debrief hook.
- [x] 6.6 Generate `.docx` and verify tables print on one page width.

## 7. Verification and handoff

- [x] 7.1 Run full build; commit `src/*.md` and `docx/*.docx`.
- [x] 7.2 README lists four output filenames and stakeholder handoff steps
      (print/PDF export from Word).
- [x] 7.3 `openspec validate compile-stakeholder-docx-documents`.
- [ ] 7.4 Stakeholder review pass (manual): product owner signs off content;
      legal reviews Terms outside repo.

## 8. Archive (post-approval)

- [ ] 8.1 After stakeholder sign-off, `/opsx-archive compile-stakeholder-docx-documents`.
