# bug-reporting Specification

## ADDED Requirements

### Requirement: Authenticated users can submit a bug report to any email address

The backend SHALL expose `POST /api/bug-reports` behind JWT authentication. The request body SHALL contain: `recipientEmail` (required, a single valid email address), `title` (required, ≤ 150 characters), `description` (required, ≤ 5,000 characters), `stepsToReproduce` (optional, ≤ 5,000 characters), `pageOrFeature` (optional, ≤ 300 characters, where the bug happened), and an optional `userAgent` context string (truncated server-side). On success the endpoint SHALL send the formatted bug report email to `recipientEmail` and return 200. The reporter's identity (name, role, email) SHALL be taken from the authenticated JWT, never from the request body.

#### Scenario: Successful submission

- **WHEN** an authenticated parent posts a valid bug report with `recipientEmail: "support@example.org"`
- **THEN** the response is 200 and one email is sent to `support@example.org` containing the report

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request without a valid JWT hits `POST /api/bug-reports`
- **THEN** the response is 401 and no email is sent

#### Scenario: Invalid recipient email is rejected

- **WHEN** the body has `recipientEmail: "not-an-email"` or a multi-recipient value like `"a@x.com,b@y.com"`
- **THEN** the response is 400 and no email is sent

#### Scenario: Missing required fields are rejected

- **WHEN** `title` or `description` is missing or blank
- **THEN** the response is 400 identifying the invalid field and no email is sent

#### Scenario: Email provider failure surfaces as an error

- **WHEN** the email service throws while sending
- **THEN** the response is a 5xx with a user-facing message and the client can retry

### Requirement: Bug report email content is complete and injection-safe

The bug report email SHALL be built by a pure payload builder returning `{ subject, htmlContent, textContent }`. The subject SHALL be `[Bug Report] <title> — Bainum Dashboard`. The body (both HTML and text variants) SHALL include: an opening banner explaining the email is a user-submitted bug report from the Bainum dashboard sent to this address at the reporter's request; the reporter's name, role, and account email; the title, description, steps to reproduce (when provided), and where the bug happened (when provided); the browser user agent; and the submission timestamp. Every user-provided string embedded in `htmlContent` SHALL be HTML-escaped (`& < > " '`).

#### Scenario: HTML in user input is neutralized

- **WHEN** the description contains `<script>alert(1)</script>`
- **THEN** the generated `htmlContent` contains `&lt;script&gt;alert(1)&lt;/script&gt;` and no executable tag

#### Scenario: Report context is embedded

- **WHEN** a teacher submits a report with `pageOrFeature: "Classroom recording upload"`
- **THEN** the email body includes the teacher's name and role, "Classroom recording upload" as where the bug happened, the user agent, and a timestamp

#### Scenario: Optional sections omitted cleanly

- **WHEN** `stepsToReproduce` and `pageOrFeature` are not provided
- **THEN** the email renders without empty "Steps to reproduce" or "Where it happened" sections

### Requirement: Bug report sending reuses the existing email provider chain

`sendBugReportEmail` SHALL follow the same provider selection as existing senders in `emailService.js`: Brevo API when configured, otherwise Resend API, otherwise SMTP — including the existing production guard that refuses Gmail SMTP on hosted deployments. No new email dependency or configuration variable SHALL be introduced.

#### Scenario: Unconfigured email environment fails gracefully

- **WHEN** no email provider is configured and a report is submitted
- **THEN** the endpoint returns an error message consistent with the invitation flow ("Email service is not configured…") and does not crash

### Requirement: Per-user submission throttle

Beyond the global IP rate limiter, the bug report endpoint SHALL enforce a per-user throttle of at most 3 submissions per rolling 10-minute window, keyed by the authenticated user id. Requests over the limit SHALL receive 429 with a retry message and no email SHALL be sent.

#### Scenario: Fourth report inside the window is throttled

- **WHEN** a user submits 3 reports and then a 4th within 10 minutes
- **THEN** the first 3 send emails and return 200, and the 4th returns 429 with no email sent

#### Scenario: Window expiry restores submission

- **WHEN** the same user submits again after the 10-minute window has passed
- **THEN** the report is accepted and sent

### Requirement: Settings page hosts the bug report form

The app SHALL register a Settings page at `/settings` behind authentication (all roles, rendered inside the shared app layout), making the existing sidebar "Settings" link functional. The page SHALL contain a "Report a bug" section with a form: recipient email, title, description, optional steps to reproduce, and an optional "Where did this happen?" page/feature field. The form SHALL validate required fields and email format client-side, disable the submit button while sending, capture the browser user agent automatically at submit time, show a success toast naming the recipient address and reset the form on success, and show the server's error message on failure while preserving the entered text.

#### Scenario: User reaches the form via the sidebar

- **WHEN** any signed-in user (parent, teacher, or admin) clicks "Settings" in the sidebar
- **THEN** the `/settings` page renders with the "Report a bug" section

#### Scenario: User submits a bug report from Settings

- **WHEN** the user completes the required fields with a valid recipient email and submits
- **THEN** a `POST /api/bug-reports` request is sent including the user agent and any entered page/feature context
- **AND** on success a toast confirms the recipient address and the form resets

#### Scenario: Client-side validation blocks bad input

- **WHEN** the user submits with an empty title or a malformed recipient email
- **THEN** no request is sent and the offending field is flagged

#### Scenario: Failed send preserves the draft

- **WHEN** the server responds with an error
- **THEN** the form keeps all entered text and an error toast shows the server message

#### Scenario: Signed-out visitors cannot reach the page

- **WHEN** an unauthenticated visitor navigates to `/settings`
- **THEN** they are redirected to login (standard protected-route behavior) and no bug report form is rendered
