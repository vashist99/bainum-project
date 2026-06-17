## Context

The Bainum early-childhood platform serves **admins**, **teachers**, and
**parents** with role-scoped access to children, schools, classrooms, audio
recordings, transcript review, developmental keyword visualizations, and in-app
notifications. Prior OpenSpec work explicitly deferred mobile navigation
improvements until **usability-testing findings** are collected — this change
produces the protocol and supporting documents for that study.

There are **no** existing `.docx` stakeholder documents in the repo. The project
already uses `python-docx` in `generate_report.py` for annual reporting, which
establishes a precedent for Word generation in Python.

## Goals / Non-Goals

**Goals:**

- Four complete, professionally formatted `.docx` files in
  `docs/stakeholder-deliverables/docx/`.
- Markdown sources in `docs/stakeholder-deliverables/src/` that match app
  terminology (School/Schools, Children, Add Parents, notification bell).
- User Manual covers every primary sidebar destination per role.
- FAQ addresses the top support themes (login, invitations, access, recordings).
- Terms draft includes data privacy, acceptable use, and child-data sensitivity.
- Usability protocol includes ≥6 task scenarios for teachers and ≥4 for parents,
  plus pre/post questionnaires and observer notes template.
- Repeatable one-command regeneration after content edits.

**Non-Goals:**

- Embedding documents in the web app or hosting on a public URL.
- Final legal sign-off inside this engineering change (Terms remain a draft for
  counsel/stakeholder review).
- Running actual usability sessions (only materials preparation).
- Translating documents into other languages.

## Decisions

### D1 — Folder layout

```
docs/stakeholder-deliverables/
  README.md                 # how to edit + rebuild
  src/
    user-manual.md
    faq.md
    terms-and-conditions.md
    usability-testing-protocol.md
  docx/                     # generated outputs (committed)
    Bainum-User-Manual.docx
    Bainum-FAQ.docx
    Bainum-Terms-and-Conditions.docx
    Bainum-Usability-Testing-Protocol.docx
  build-docx.sh             # or build-docx.py
```

Rationale: separates editable source from binary output; stakeholders receive
`docx/` only.

### D2 — Generation toolchain: Pandoc first, python-docx fallback

**Preferred:** `pandoc src/*.md -o docx/*.docx` with a shared reference
`reference.docx` for Anita Zucker Center / Bainum branding (title styles, header
footer placeholder).

**Fallback:** Python script using `python-docx` (same stack as
`generate_report.py`) if Pandoc is unavailable in CI or contributor environments.

Rationale: Markdown diffs are reviewable; Pandoc produces cleaner heading/lists
than hand-built python-docx for long prose.

### D3 — Content authority

Authors SHALL cross-check against:

- `openspec/specs/` (navigation, classrooms, recordings, retention).
- Current sidebar routes in `mockup1/src/components/Sidebar.jsx`.
- School nomenclature (`/schools`, API `school` field) — never "Center" in
  user-facing doc text unless describing legacy redirects.

Screenshots are **optional** in v1; use numbered steps with UI labels. A follow-up
can add figures without restructuring sources.

### D4 — User Manual outline (by role)

| Section | Admin | Teacher | Parent |
|---------|-------|---------|--------|
| Login / password reset | ✓ | ✓ | ✓ |
| Dashboard / home | ✓ | ✓ | ✓ |
| Classrooms | create, list, homepage | lead/assistant, recordings | read-only view |
| Children list & child data page | ✓ | supervised children | own child only |
| Schools & Teachers CRUD | ✓ | — | — |
| Record activity / upload | — | ✓ | ✓ (parent flow) |
| Transcripts & export | ✓ | ✓ | scoped |
| Notifications bell | ✓ | ✓ | ✓ |
| Invitations / Add Parents | ✓ | ✓ | register via email |

### D5 — Usability protocol structure

1. **Purpose & scope** — pilot classrooms, non-technical participants.
2. **Participant criteria** — teachers with ≥1 classroom; parents with accepted
   invitation and ≥1 child.
3. **Session logistics** — 45–60 min moderated, think-aloud, screen recording
   opt-in, consent reference to Terms draft.
4. **Task list** (examples):
   - Teacher: find a child's latest transcript; add parents to classroom; record
     activity with location/activity labels.
   - Parent: open child data page; view classroom (read-only); dismiss
     notification.
5. **Success / failure coding** — completed unaided, completed with hint,
   failed, abandoned.
6. **Post-session debrief questions** — SUS-style lite (5 questions) + open feedback.
7. **Observer worksheet** — table: task #, time, notes, severity (cosmetic /
   minor / major).

Aligns with deferred mobile-nav work gated on usability findings in
`consistent-sidebar-navigation` design.

### D6 — Terms and Conditions scope (draft)

Sections: acceptance, eligibility, account security, permitted use, prohibited
use, child data & confidentiality, third-party services (RevAI, OpenAI, email),
data retention (transcript TTL), disclaimer, limitation of liability, changes,
contact. Mark document **DRAFT — NOT LEGAL ADVICE** in header/footer.

### D7 — Versioning

Each `.docx` footer: `Version 1.0 — {month year}` and repo commit hash optional
in README only (not in stakeholder-facing footer unless requested).

## Risks / Trade-offs

- [Terms not legally vetted] → Label as draft; stakeholder sign-off tracked
  outside git.
- [Docs drift from UI] → Manual tied to implementation sprint; README says
  regenerate after major UI releases.
- [Binary merge conflicts on `.docx`] → Source of truth is Markdown; docx
  regenerated, not hand-edited.
- [Pandoc missing locally] → README documents install; python-docx fallback in
  script.

## Migration Plan

1. Add folder + sources + build script.
2. Generate `.docx`, commit both src and docx.
3. Stakeholder review pass (manual) — track edits in Markdown, re-run build.
4. Usability sessions use printed/PDF exports from Word.

No application deploy required.

## Open Questions

- Whether to include institutional logo assets in `reference.docx` (stakeholder
  to supply PNG if required).
- Whether Terms need a separate Parent Consent addendum (can be FAQ cross-link
  for v1).
