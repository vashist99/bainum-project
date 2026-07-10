# Separate Home Talk and Classroom Talk Views

## Why

A child's data page currently aggregates every recording — parent home uploads and classroom sessions — into one set of charts and one transcript list. That mixes two very different talk environments into a single trend line, and it exposes private family recordings (mealtime, bath time, home conversations) to school staff. Home talk belongs to the family: teachers and admins should see classroom data only.

## What Changes

- **Parents** get two views on their child's data page — **Home talk** and **Classroom talk** — switchable via tabs. Charts, stats, and transcripts are scoped to the selected view.
- **Teachers and admins** see only **classroom talk data** (charts and transcripts). Home-context assessments are excluded **server-side** so they can never reach a staff client. **BREAKING** for staff who currently see parent home transcripts on child pages (behavior shipped earlier this cycle is intentionally reversed for home-context recordings).
- Assessments are partitioned by the existing `activityContext` field (`'home'` vs `'school'`); legacy rows without the field count as classroom data.
- Children cohort stats (chart thresholds) are computed from classroom-context assessments only, so home recordings do not skew classroom baselines.
- The combined "download all transcripts" export follows the same scoping (parents: per selected view; staff: classroom only).

## Capabilities

### New Capabilities

- `child-talk-data-views`: Role-scoped separation of home vs classroom talk data on the child data page — the parent two-view toggle, staff classroom-only access, server-side filtering, and cohort-stats scoping.

### Modified Capabilities

<!-- none in main specs: parent-home-recording and transcript-visibility behaviors live in unarchived changes; this change supersedes the "staff can see parent home transcripts" behavior at the API level -->

## Impact

- **Backend** (`backend/routes/whisperRoutes.js`): `GET /api/assessments/child/:childId` and `/latest` filter by role (staff: exclude `activityContext: 'home'`) and accept a `context` query param for parents; `DELETE /assessments/child/:assessmentId` denies staff deletion of home rows. `backend/lib/cohortStatsService.js`: children cohort recompute excludes home-context rows.
- **Frontend** (`mockup1/src/pages/ChildDataPage.jsx`): parent-only Home talk / Classroom talk tabs; charts, WPM stats, transcript list, and download filtered by the active view.
- **Docs**: user manual (parent child-data section, teacher children section) and FAQ ("Who can see my child's data?", "Can teachers see parent home recordings?") updated.
- **Tests**: backend unit tests for the role filter; frontend unit test for the view partition helper.
