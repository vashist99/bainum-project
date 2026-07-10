# Design: Report Bug via Email

## Context

The app has no bug reporting mechanism. It does have a mature outbound-email stack in `backend/lib/emailService.js` with a three-tier provider chain (Brevo API when `EMAIL_SERVICE=brevo` + `BREVO_API_KEY`, else Resend API, else Nodemailer SMTP with a production guard against Gmail SMTP), used today for parent/teacher invitations and password resets. Auth is JWT via `backend/middleware/authMiddleware.js`; a global IP rate limiter (100 req/min, Upstash Redis with in-memory fallback) is applied in `backend/api/index.js`. The frontend uses DaisyUI components and axios + react-hot-toast conventions.

Notably, the shared `Sidebar` (`mockup1/src/components/Sidebar.jsx` lines 217–222) already renders a "Settings" item linking to `/settings` for every authenticated user — but `mockup1/src/App.jsx` defines no `/settings` route and no Settings page exists, so the link currently dead-ends. This change creates that page and makes bug reporting its first section.

Per the request, the report goes to **any email address the reporter enters** — there is no fixed support inbox.

## Goals / Non-Goals

**Goals:**

- Any authenticated user can open Settings from the sidebar, fill in the bug report form, enter a recipient email, and send.
- A working `/settings` page (all roles) that the existing sidebar link points to, with bug reporting as its first section.
- The email contains the user's description plus context (reporter identity/role, where the bug happened, user agent, timestamp) so recipients can triage without follow-up.
- Reuse the existing email provider chain and its environment configuration — no new email dependencies.
- Guard against abuse (spamming arbitrary inboxes) and header/content injection.

**Non-Goals:**

- No bug tracking database, statuses, or admin list view — the email is the deliverable.
- No screenshots/attachments (first iteration; text only).
- No unauthenticated reporting (login/register pages are out of scope).
- No change to existing notification or email flows.
- No other settings sections (profile editing, preferences, etc.) — the page ships with the bug report section only; future settings land in the same shell.

## Decisions

### 1. Email-only, no persistence

The request is "send the bug information to any email entered" — a `POST /api/bug-reports` endpoint that validates, formats, and emails is the whole feature. Persisting reports to MongoDB was considered and rejected: it adds a model, retention questions, and an admin surface nobody asked for. If the send fails, the endpoint returns an error and the user can retry; nothing is silently lost because nothing was accepted.

### 2. Separate pure payload builder + one new `emailService` sender

`backend/lib/emailService.js` is a 1,000-line file where each sender duplicates the provider chain. We follow the established pattern rather than refactoring it (out of scope):

- **`backend/lib/bugReportEmail.js`** (new, pure): `buildBugReportEmailPayload({ title, description, stepsToReproduce, pageOrFeature, reporter, userAgent, submittedAt })` returns `{ subject, htmlContent, textContent }`. All user-provided strings are HTML-escaped here (`&<>"'`). Pure and unit-testable with node:test, matching how `formatChildNamesForInvitationEmail` is exported for tests.
- **`sendBugReportEmail(recipientEmail, payload)`** in `emailService.js`: same Brevo API → Resend → SMTP fallback and the same production Gmail-SMTP guard as `sendInvitationEmail`.

Subject format: `[Bug Report] <title> — Bainum Dashboard`. The body opens with an explicit banner ("This bug report was submitted by a signed-in user of the Bainum dashboard and sent to this address at their request") so an arbitrary recipient understands why they received it.

### 3. Validation and abuse guardrails at the endpoint

`POST /api/bug-reports` (new `backend/routes/bugReportRoutes.js` + `bugReportController.js`, mounted in `backend/api/index.js`) behind `authenticateToken`:

- **Field validation:** `recipientEmail` must match a standard email regex (single address — no commas/semicolons, which also prevents multi-recipient abuse and header injection via the address); `title` required, ≤ 150 chars; `description` required, ≤ 5,000 chars; `stepsToReproduce` optional, ≤ 5,000 chars; `pageOrFeature` optional, ≤ 300 chars. `userAgent` is truncated server-side.
- **Reporter identity comes from the JWT** (`req.user`), never from the body, so reports can't be forged on someone else's behalf.
- **Per-user throttle:** the global 100 req/min IP limiter is too permissive for an endpoint that emails arbitrary addresses. A small in-memory per-user window in the controller (max 3 reports per 10 minutes per user id, mirroring the `inMemoryRateLimiter` approach in `middleware/rateLimiter.js`) returns 429 beyond that. In-memory is acceptable: worst case after a server restart the window resets, which is not a meaningful abuse vector at 3-per-10-min.
- Errors from the email provider surface as 502 with a user-friendly message; validation errors are 400.

### 4. Frontend: bug report section on a new Settings page

- **`mockup1/src/pages/SettingsPage.jsx`** (new): registered at `/settings` in `mockup1/src/App.jsx` behind `ProtectedRoute` (all roles, `skipParentHomeRedirect` so parents can reach it), rendered inside `AppLayout` like other pages. The page is a simple card-section shell; its first (and for now only) section is "Report a bug". The existing Sidebar "Settings" item (already pointing at `/settings` with an active-state check) starts working with zero sidebar changes.
- **`mockup1/src/components/BugReportForm.jsx`** (new): DaisyUI card/form with recipient email, title, description, optional steps-to-reproduce, and an optional "Where did this happen?" page/feature field (free text — since the form lives on Settings rather than on the page where the bug occurred, auto-capturing the current URL would always say `/settings` and be useless). `navigator.userAgent` is captured automatically at submit. Disabled submit while sending; success toast naming the recipient and form reset on 2xx; error toast (server message) with the draft preserved on failure.
- A modal launched from the Navbar was considered (captures the faulting page's URL automatically) but the user explicitly wants the feature in the Settings tab; the trade-off is handled by the manual "where did this happen?" field.
- Client-side validation mirrors the server rules (required fields, email format) for immediate feedback; the server remains the authority.

## Risks / Trade-offs

- **[Open relay-ish behavior]** Authenticated users can email arbitrary addresses → mitigated by auth requirement, 3-per-10-min per-user throttle, single-recipient validation, fixed subject prefix, and a body banner identifying the sender and origin. Accepted deliberately because "any email entered" is the explicit requirement.
- **[HTML injection into the email]** User text embedded in HTML → all interpolated fields pass through the escape helper in the pure builder; unit tests assert `<script>` becomes `&lt;script&gt;`.
- **[Provider config drift]** The new sender duplicates the fallback chain like every other sender in `emailService.js` → consistent with the codebase today; a refactor to a shared `sendEmail(payload)` core is noted as future cleanup, not done here.
- **[In-memory throttle across multiple instances]** Each instance tracks its own window → at current single-instance deployment this is fine; Upstash-backed throttling can be swapped in later if the deployment scales out.
- **[Typo'd recipient]** Report silently goes nowhere useful → the modal confirms the exact address in the success toast ("Report sent to x@y.com").

## Migration Plan

Purely additive (new backend route, new page + route registration). No data migration. Rollback = remove the API mount and the `/settings` route (the sidebar link returns to its current dead-end state). Works with existing email environment variables; if email is unconfigured locally, the endpoint returns the same configuration error the invitation flow does.

## Open Questions

- Should the reporter receive a CC copy? Not in this iteration — single recipient keeps validation and abuse surface simple; easy follow-up if requested.
- Screenshot attachment support is a likely follow-up; it would require multer + provider attachment APIs and is intentionally excluded.
