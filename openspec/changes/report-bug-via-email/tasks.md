# Tasks: Report Bug via Email

## 1. Backend — email payload and sender

- [x] 1.1 Create `backend/lib/bugReportEmail.js` — pure `buildBugReportEmailPayload()` returning `{ subject, htmlContent, textContent }` with an HTML-escape helper applied to every user-provided string, the origin banner, reporter identity, where-it-happened context, user agent, and timestamp; optional sections (steps, page/feature) omitted when absent
- [x] 1.2 Add `sendBugReportEmail(recipientEmail, payload)` to `backend/lib/emailService.js` following the existing Brevo API → Resend → SMTP chain and the production Gmail-SMTP guard
- [x] 1.3 Unit tests in `backend/tests/unit/bugReportEmail.test.js`: subject format, HTML escaping (`<script>` neutralized), context fields present, optional sections omitted cleanly

## 2. Backend — endpoint

- [x] 2.1 Create `backend/controllers/bugReportController.js` — validate `recipientEmail` (single valid address), `title` (≤150), `description` (≤5000), optional `stepsToReproduce` (≤5000) and `pageOrFeature` (≤300); truncate `userAgent`; reporter identity from `req.user`; per-user in-memory throttle (3 per 10 minutes → 429); send via `sendBugReportEmail`; 400 on validation, 502 on provider failure
- [x] 2.2 Create `backend/routes/bugReportRoutes.js` (`POST /` behind `authenticateToken`) and mount at `/api/bug-reports` in `backend/api/index.js`
- [x] 2.3 Unit tests in `backend/tests/unit/bugReportController.test.js`: 400s for bad email / multi-recipient / missing title/description, reporter taken from JWT not body, throttle allows 3 then 429s the 4th, window expiry re-allows, provider error → 5xx with no crash

## 3. Frontend — Settings page and bug report form

- [x] 3.1 Create `mockup1/src/components/BugReportForm.jsx` — DaisyUI card/form with recipient email, title, description, optional steps and "Where did this happen?" fields; client-side validation; disabled submit while sending; captures `navigator.userAgent` at submit; success toast naming the recipient + form reset; error toast preserving the draft
- [x] 3.2 Create `mockup1/src/pages/SettingsPage.jsx` (AppLayout shell with the "Report a bug" section) and register `/settings` in `mockup1/src/App.jsx` behind `ProtectedRoute` with `skipParentHomeRedirect` so all roles can reach it — the existing Sidebar "Settings" link needs no changes
- [x] 3.3 Extract client-side validation to `mockup1/src/utils/bugReport.js` (pure) and unit test it in `mockup1/tests/unit/bugReport.test.js` (required fields, email format, length caps)

## 4. Verification

- [x] 4.1 Run backend and frontend unit suites plus frontend lint/build; fix regressions
- [ ] 4.2 Manual pass: open Settings from the sidebar as each role, submit a report with a real recipient, confirm the email arrives with escaped content and full context; confirm 4th rapid submission is throttled
