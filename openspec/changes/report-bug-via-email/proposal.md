# Report Bug via Email

## Why

Users who hit problems in the dashboard have no in-app way to report them — issues surface informally (or not at all), with none of the context (page, role, browser) needed to reproduce them. A built-in "Report a bug" feature lets any signed-in user describe a problem and send the full report to whatever email address they enter (e.g. the project team's support inbox), using the email infrastructure the app already has.

## What Changes

- **New Settings page at `/settings`.** The sidebar already links every authenticated user to `/settings`, but no page or route exists — the link currently dead-ends. This change creates the Settings page (all roles) and makes "Report a bug" its first section.
- **Bug report form on the Settings page** collecting: recipient email (any address, entered by the user), a short title, a description of the problem, optional steps to reproduce, and an optional "where did this happen?" page/feature field. The app auto-attaches context: reporter name/role/email, browser user agent, and timestamp.
- **New `POST /api/bug-reports` endpoint** (authenticated) that validates the input and sends the formatted report to the entered email via the existing email service (Brevo API → Resend → SMTP fallback chain, same as invitations). User-provided text is HTML-escaped before it is embedded in the email.
- **Abuse guardrails:** endpoint requires authentication and reuses the existing rate limiter so a user cannot spam arbitrary inboxes.
- No database persistence — the email is the report. Success/failure is reported back to the user in the modal.

## Capabilities

### New Capabilities

- `bug-reporting`: In-app bug report submission — the Settings page hosting the form, the authenticated send endpoint, report email content/formatting, validation, and abuse guardrails.

### Modified Capabilities

*(none — the `/settings` route is new and the sidebar link to it already exists; no existing spec requirements change)*

## Impact

- **Backend:** new `backend/lib/bugReportEmail.js` (pure payload builder, HTML-escaped), new `sendBugReportEmail` in `backend/lib/emailService.js` (follows the existing provider fallback), new `backend/routes/bugReportRoutes.js` + controller mounted at `/api/bug-reports` in `backend/api/index.js`.
- **Frontend:** new `SettingsPage` (`mockup1/src/pages/SettingsPage.jsx`) registered at `/settings` in `mockup1/src/App.jsx` behind `ProtectedRoute`; new `BugReportForm` component rendered as a card on that page. The existing Sidebar "Settings" link starts working.
- **Security:** authenticated-only, rate-limited, escaped content; the recipient is user-chosen by design (per the request), so the email body clearly labels itself as a user-submitted bug report from the Bainum dashboard.
- **No breaking changes**; no schema/database changes.
