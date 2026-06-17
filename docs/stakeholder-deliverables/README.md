# Stakeholder deliverables (Word)

Editable **Markdown** sources and generated **Microsoft Word** (`.docx`) files for
handoff to Anita Zucker Center / Bainum Foundation stakeholders, usability study
participants, and legal review.

## Output files (`docx/`)

| File | Source |
|------|--------|
| `Bainum-User-Manual.docx` | `src/user-manual.md` |
| `Bainum-FAQ.docx` | `src/faq.md` |
| `Bainum-Terms-and-Conditions.docx` | `src/terms-and-conditions.md` |
| `Bainum-Usability-Testing-Protocol.docx` | `src/usability-testing-protocol.md` |

## Edit → build → commit workflow

1. Edit the Markdown file(s) in `src/`.
2. Regenerate Word files:
   ```bash
   cd docs/stakeholder-deliverables
   ./build-docx.sh
   ```
3. Open the `.docx` in Microsoft Word to spot-check headings, lists, and tables.
4. Commit both `src/*.md` and `docx/*.docx` together so sources and outputs stay in sync.

## Build toolchain

`build-docx.sh` calls `build-docx.py`, which:

1. Uses **Pandoc** when installed (`pandoc` on PATH) for best heading/list fidelity.
2. Falls back to **python-docx** (same stack as `generate_report.py` at repo root).

### Install Pandoc (optional, recommended)

- **Ubuntu/Debian:** `sudo apt install pandoc`
- **macOS:** `brew install pandoc`

### Python fallback

```bash
pip3 install python-docx
```

## Branding (`reference.docx`)

Optional: place a Pandoc reference document at `reference.docx` in this folder
(institutional logo, header/footer). Stakeholders can supply logo assets; the
build script uses it automatically when Pandoc is available.

## Handoff to stakeholders

1. Copy the four files from `docx/` to email, SharePoint, or print binders.
2. For usability sessions, export PDF from Word if participants should not edit files.
3. **Terms and Conditions** is a **DRAFT** — require legal counsel review before
   binding use or external distribution.

## Legal notice

The Terms document is engineering draft content, not legal advice. Product
behavior described here should match the deployed application; report drift via
the engineering team after major releases.
