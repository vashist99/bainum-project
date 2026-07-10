# Design — Separate Home Talk and Classroom Talk Views

## Context

Every saved recording is an `Assessment` row with an optional `activityContext` field (`'home'` for parent Home-tab uploads, `'school'` for classroom/teacher flows; legacy rows have neither). The child data page (`ChildDataPage.jsx`) fetches all of a child's assessments through `GET /api/assessments/child/:childId` and feeds one aggregate into the charts, WPM stats, and transcript list. Access control today: parents see their own children, teachers see supervised children (including home rows, per an earlier change), admins see everything.

This change re-partitions that single aggregate into two role-scoped views and makes home rows staff-invisible at the API layer.

## Goals / Non-Goals

**Goals:**

- Parents can switch between Home talk and Classroom talk on the child page; each view's charts, stats, transcripts, and download reflect only that context.
- Teachers/admins can never receive home-context assessment rows from the child assessment APIs.
- Classroom cohort baselines are not polluted by home recordings.

**Non-Goals:**

- Changing what is recorded or how context is stamped (recording flows already set `activityContext`).
- Classroom-page transcript lists (`/api/classrooms/:id/transcripts`) — home rows have no `classroomId`, so they already never appear there.
- Teacher self-assessments (`TeacherAssessment`) — school-only by construction.
- A combined "all talk" view for parents (can be added later if requested).

## Decisions

1. **Server-side enforcement, not client-side hiding.** `GET /api/assessments/child/:childId` and `/latest` apply a role filter in the Mongo query: for teachers and admins, `activityContext: { $ne: 'home' }`. Client-side filtering would leave home transcripts one devtools-tab away from staff — this is a privacy boundary, so the server owns it.
   - *Alternative considered*: keep the API open and filter in React. Rejected: not a real privacy guarantee.

2. **Legacy rows (no `activityContext`) count as classroom data.** They all predate the parent Home tab, so they are classroom/external-ingest recordings. `$ne: 'home'` naturally includes them; the parent classroom view uses the complementary filter (`activityContext !== 'home'` client-side or `$ne` server-side).

3. **Parents fetch once, partition client-side.** The parent is entitled to both contexts, so the API returns all rows to parents (unchanged) and `ChildDataPage` splits them with a small pure helper (`partitionAssessmentsByContext`). One fetch, instant tab switching, no extra endpoints. A `context` query param is unnecessary.
   - *Alternative considered*: separate `?context=home|school` requests per tab. Rejected: two round-trips for data the parent already owns, more backend surface.

4. **Tabs UI.** DaisyUI `tabs tabs-boxed` above the charts section, parent-only: **Classroom talk** (default) and **Home talk**. Staff see no tabs — their page renders exactly as today, just without home rows in the payload. Default to Classroom talk because that is the shared frame of reference with teachers.

5. **Cohort stats become classroom-only.** `recomputeAndSaveChildrenCohortStats` filters to `activityContext: { $ne: 'home' }` so thresholds represent classroom talk. Both parent views render charts against these thresholds — for the home view they serve as a familiar reference scale rather than a home-specific cohort (computing a home cohort across families would itself aggregate private data; explicitly avoided).

6. **Deletion follows visibility.** The delete route rejects staff attempts to delete a home-context assessment (404/403), since they cannot see it. Parents keep their existing deletion rights.

7. **`/latest` respects the filter.** The staff "latest assessment" query adds the same `$ne` filter so a fresh home upload does not surface metadata to staff.

## Risks / Trade-offs

- [Staff lose sight of home transcripts they could see since the earlier visibility change] → Intentional per stakeholder direction; the FAQ/user manual are updated in the same change so support answers stay accurate.
- [A parent's home view has no home-specific cohort baseline] → Accepted: thresholds shown are classroom-derived and the UI labels the view clearly; a home-cohort baseline is a privacy question deferred until stakeholders ask.
- [Any other endpoint returning child assessments could leak home rows] → Audit in tasks: the classroom endpoints exclude home rows structurally (no `classroomId`); the ENACT ingest and export paths are parent-scoped. New endpoints must copy the role filter.

## Migration Plan

No data migration — `activityContext` already exists on all new rows and the legacy-null convention handles old rows. Deploy backend first (staff filtering is purely subtractive), then frontend. Rollback = revert both commits.

## Open Questions

- Should the parent Home talk view eventually get its own cohort baseline (opt-in, aggregated)? Deferred.
