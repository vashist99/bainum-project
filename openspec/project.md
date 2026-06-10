# Project Context

## Purpose

The **Bainum Project** (Anita Zucker Center / Bainum Foundation) is a web platform for early childhood development assessment and tracking. Teachers upload classroom audio recordings, which are transcribed via Automatic Speech Recognition (RevAI) and analyzed for educational keywords across four domains: science, social development, literature, and language development. Admins, teachers, and parents collaborate to monitor children's progress through dashboards and visualizations.

**User roles:**
- **Admin** — full system access: manages centers, teachers, children, and all data
- **Teacher** — manages assigned children, uploads recordings, invites parents
- **Parent** — restricted view of their own child's data page (invitation-based registration)

## Tech Stack

### Backend (`backend/`)
- **Node.js + Express 5** (ES modules, `type: "module"`), entry point `api/index.js` (Vercel serverless–compatible)
- **MongoDB + Mongoose 8** — data layer
- **Auth**: JWT (`jsonwebtoken`) + bcrypt password hashing
- **ASR**: RevAI for audio transcription (`lib/revai.js`); audio uploads via multer
- **AI/RAG**: OpenAI SDK for embeddings and classification (`lib/embeddingService.js`, `lib/ragClassifier.js`, `lib/hybridScorer.js`, `lib/vectorStore.js`, `lib/knowledgeBase/`)
- **Email**: Brevo (`@getbrevo/brevo`) primary, with Resend and Nodemailer also present (`lib/emailService.js`); link tracking disabled to avoid Outlook redirect issues
- **Rate limiting**: Upstash Redis (`@upstash/ratelimit`) with in-memory fallback
- **Testing**: Playwright for API tests (`tests/api`), Node's built-in test runner for unit tests (`tests/unit`)

### Frontend (`mockup1/`)
- **React 19 + Vite 7**, routing via **React Router 7** (`react-router` package)
- **Styling**: Tailwind CSS 3 + DaisyUI 4, icons from Lucide React
- **Data viz**: D3.js and react-d3-speedometer (dot matrices, gauges, progress charts)
- **HTTP**: Axios; notifications via react-hot-toast
- **Testing**: Playwright e2e (`tests/e2e`), ESLint 9 for linting
- **Deployment**: Vercel (SPA rewrites + security headers in `vercel.json`)

### Misc
- `eval-data/` — evaluation data and scripts for the RAG/keyword classifier
- `generate_report.py` — Python script (python-docx) that generates the annual report for the Bainum Foundation

## Project Conventions

### Code Style
- JavaScript ES modules throughout (`import`/`export`), no TypeScript
- React components in `.jsx`, named in PascalCase (e.g., `ChildDataPage.jsx`); one component per file
- Backend follows MVC-ish layout: `routes/` → `controllers/` → `models/`, with shared logic in `lib/` and cross-cutting concerns in `middleware/`
- Frontend organized as `src/pages/` (route-level), `src/components/` (reusable), `src/contexts/` (e.g., Auth), `src/lib/`, `src/utils/`
- ESLint (flat config) on the frontend; backend has no linter configured yet

### Architecture Patterns
- REST API under `/api/*` (auth, children, teachers, centers, invitations, teacher-invitations, notes, access, whisper/transcribe)
- Role-based access control enforced in middleware (`authMiddleware.js`, `parentChildAccess.js`) and mirrored in frontend `ProtectedRoute`
- Token-based invitation flows for parent and teacher registration (`Invitation`, `TeacherInvitation`, `AccessGrant` models)
- Transcription pipeline: upload → RevAI transcription → review/accept-reject in UI → saved as `Assessment` → keyword analysis & visualization
- RAG-based keyword/activity classification with embeddings stored in MongoDB (`KnowledgeBaseEmbedding`, `CohortStats`)
- Frontend talks to backend at `http://localhost:5000` in dev (frontend on `:5173`)

### Testing Strategy
- Playwright is the primary test framework for both packages: API tests in `backend/tests/api`, e2e tests in `mockup1/tests/e2e`
- Unit tests use Node's built-in test runner (`node --test tests/unit/*.test.js`) in both packages
- Run with `npm test` (Playwright) or `npm run test:unit` in each package

### Git Workflow
- Single `main` branch; commits pushed directly to main
- Imperative, descriptive commit messages summarizing the fix/feature (e.g., "Fix invitation link Outlook redirect by disabling Brevo link tracking")
- Frontend auto-deploys to Vercel from the repo

## Domain Context
- "Children" are enrolled at "Centers" with assigned lead teachers; assessments are tied to a child and a recording date
- Keyword tracking covers four developmental domains: science, social development, literature, language development
- Parents only ever see their own child's data — privacy and access control are critical (child data is sensitive)
- Transcripts must be human-reviewed (accept/reject) before being saved as assessments
- Teacher-level recordings/assessments exist alongside child-level ones (`TeacherAssessment` model)

## Important Constraints
- Child data privacy: parent access strictly scoped via `AccessGrant`/invitation tokens; never broaden access without explicit checks
- External service dependencies: RevAI (ASR quota), OpenAI (embeddings), Brevo (email), Upstash (rate limits) — all keyed via `backend/.env` (see `env.example.txt`); never commit secrets
- Backend must remain compatible with Vercel serverless deployment (entry at `api/index.js`)
- Email deliverability quirks: Brevo link tracking is intentionally disabled (Outlook redirect bug) — don't re-enable

## External Dependencies
- **RevAI** — speech-to-text API (`REVAI_API_KEY`)
- **OpenAI API** — embeddings/classification for keyword analysis
- **MongoDB** — primary datastore (`MONGO_URI`)
- **Brevo / Resend / Nodemailer** — transactional email for invitations and password resets
- **Upstash Redis** — distributed rate limiting (optional, falls back to in-memory)
- **Vercel** — hosting for frontend (and serverless backend)
