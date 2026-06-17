## Context

The product models a physical early-childhood site as a **Center** in code
(`Center` Mongoose model, `Teacher.center` string field, `/api/centers`,
`/centers` frontend routes, sidebar label "Centers"). Stakeholders call these
entities **schools**. A full schema rename (`center` → `school` in every
MongoDB document) would require a multi-collection migration, index rebuilds,
and coordinated deploy of backend + frontend with zero rollback — high risk
for a label change.

The `/data` page (`DataPage.jsx`) still renders `<h1>Data</h1>` with a
gradient treatment (`text-2xl sm:text-4xl font-bold bg-gradient-to-r …`) while
`/teachers` uses a plain `text-3xl font-bold text-base-content` title plus
subtitle. The sidebar already says "Children" (recent rename); only the in-page
hero title is out of sync.

## Goals / Non-Goals

**Goals:**
- Every string a user reads says School/Schools instead of Center/Centers.
- API consumers see `school` in JSON; legacy `center` accepted on writes briefly.
- Routes move to `/schools` and `/api/schools` with redirects/aliases.
- `/data` page title matches Teachers page typography with the word "Children".

**Non-Goals:**
- Renaming MongoDB collection `centers` or document field `center`.
- Renaming internal helper files unless the rename is low-cost (`centerNames.js`
  may add `schoolNames.js` re-export).
- Changing business logic for same-center enrollment rules — only the wording
  in errors changes (e.g. "different center" → "different school").
- Translating unrelated uses of the English word "center" (CSS `text-center`,
  chart center markers, etc.).

## Decisions

### D1 — Presentation-layer rename, not a Mongo migration

Keep `center` as the persisted field name on `Teacher`, `Child`, `Classroom`,
`TeacherAssessment`, and the `centers` collection. Rationale: zero downtime,
no backfill script, rollback is a frontend/backend redeploy only.

API serialization layer maps outward:
- Responses: include `school` (copy of `center` value) on affected entities;
  omit `center` from new responses after alias period OR include both during
  transition (design chooses **both keys for one release**, then drop `center`
  from JSON in a follow-up — for this change we ship **dual keys** so older
  mobile clients don't break).
- Writes: accept `school` OR `center` on create/update; normalize to `center`
  before `save()`.

### D2 — Route aliases, not hard cutover

**Frontend** (`App.jsx`):
- Primary routes: `/schools`, `/schools/add`, `/schools/edit/:id`.
- Legacy routes `/centers/*` render `<Navigate to={equivalent /schools path} replace />`.

**Backend** (`api/index.js`):
- `app.use("/api/schools", centerRoutes)` (same router module; rename file
  optional).
- `app.use("/api/centers", centerRoutes)` duplicate mount for backward compat;
  log a one-line deprecation warning on each request (dev only) or document
  only — avoid log spam in prod.

### D3 — Component/file renames on the frontend

Rename for clarity (grep-guided):
- `CentersPage.jsx` → `SchoolsPage.jsx`
- `AddCenterForm.jsx` → `AddSchoolForm.jsx`
- `EditCenterForm.jsx` → `EditSchoolForm.jsx`
- `EmptyCenters` → `EmptySchools` in `LoadingStates.jsx`
- Update imports in `App.jsx`, e2e `centers.spec.js` → `schools.spec.js`

Keep axios paths as `/api/schools` in the frontend; alias handles old path.

### D4 — `/data` page title parity with Teachers

Replace:

```jsx
<h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
  Data
</h1>
```

With Teachers-matching structure:

```jsx
<h1 className="text-3xl font-bold text-base-content mb-2">Children</h1>
<p className="text-base-content/70">…subtitle…</p>
```

Subtitle suggestion: "View and manage children across your schools" (admin) /
"View children at your school" (teacher) — mirror Teachers' descriptive line.

Do **not** change the inner card title (`All Children`, `Children at X`) — only
the page-level hero.

### D5 — Filter dropdown on DataPage

"Filter by Center" → "Filter by School"; "All centers" → "All schools"; teacher
alert "Viewing children at your center" → "at your school". The dropdown still
filters by the `Teacher.center` / `Child.center` string field internally.

### D6 — Test strategy

- Grep CI gate: add a simple unit test or lint script that fails if new
  user-facing strings contain `\bCenters?\b` in `mockup1/src` (allowlist CSS
  classes and `text-center`).
- Update Playwright e2e and API tests that assert on "/centers" URLs to prefer
  `/schools` while keeping one test that legacy `/centers` redirects.
- Backend unit tests for JSON alias: POST child with `{ school: "X" }` stores
  `center: "X"`.

## Risks / Trade-offs

- [Dual JSON keys confuse API consumers] → Document in response; drop `center`
  key in a follow-up change after frontend ships.
- [Missed string in a deep toast] → Grep audit + allowlist test; manual QA on
  Centers/Schools CRUD, child/teacher forms, classroom create, recording modal.
- [E2e tests hit production with old URLs] → Update `API_URL` paths in specs.
- [Internal code still says center] → Acceptable; only user-visible + API JSON
  keys change.

## Migration Plan

1. Backend: dual mount `/api/schools` + `/api/centers`, JSON `school` key on
   serializers, write alias `school` → `center`.
2. Frontend: route rename + redirects, string sweep, `/data` title fix.
3. Deploy backend first (aliases live), then frontend (uses `/api/schools`).
4. Rollback: redeploy previous builds; Mongo data unchanged.

## Open Questions

None — scope is presentation + routes + JSON aliasing without DB migration.
