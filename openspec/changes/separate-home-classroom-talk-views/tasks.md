# Tasks — Separate Home Talk and Classroom Talk Views

## 1. Backend: role-scoped assessment filtering

- [x] 1.1 In `backend/routes/whisperRoutes.js`, add `activityContext: { $ne: 'home' }` to the assessments query in `GET /api/assessments/child/:childId` when `req.user.role` is `teacher` or `admin` (parents keep the unfiltered query) — via shared `staffHomeContextFilter()` in new `backend/lib/talkDataAccess.js`
- [x] 1.2 Apply the same staff filter to `GET /api/assessments/child/:childId/latest`
- [x] 1.3 In `DELETE /api/assessments/child/:assessmentId`, reject teacher/admin deletion of an assessment whose `activityContext` is `'home'` (403), leaving parent deletion unchanged
- [x] 1.4 In `backend/lib/cohortStatsService.js`, exclude `activityContext: 'home'` rows from `recomputeAndSaveChildrenCohortStats` and trigger a one-time recompute path (existing recompute hooks suffice — verify the filter reaches the aggregation)
- [x] 1.5 Audit other endpoints that return child assessments (classroom transcripts, exports) and confirm home rows cannot reach staff; add the filter if any gap is found — found and fixed a gap in `getClassroomAssessments` (`backend/controllers/classroomController.js`), which fetched all rows by `childId` for classroom charts; `getClassroomTranscripts` is safe (home rows have no `classroomId`)

## 2. Frontend: parent two-view child data page

- [x] 2.1 Create `mockup1/src/utils/talkDataViews.js` with a pure `partitionAssessmentsByContext(assessments)` helper returning `{ home, classroom }` (home = `activityContext === 'home'`; classroom = everything else, including legacy rows)
- [x] 2.2 In `mockup1/src/pages/ChildDataPage.jsx`, add parent-only DaisyUI tabs — **Classroom talk** (default) and **Home talk** — above the data section; store the active view in state
- [x] 2.3 Feed charts, WPM stats, and the transcript list from the active view's partition for parents; staff render the (already-filtered) payload with no tabs
- [x] 2.4 Scope the "download all transcripts" export to the active view for parents (filename includes `home_talk` / `classroom_talk`)
- [x] 2.5 Add an empty-state message per view when that context has no assessments

## 3. Tests

- [x] 3.1 Frontend unit tests for `partitionAssessmentsByContext` (home vs school vs missing `activityContext`, empty input) in `mockup1/tests/unit/talkDataViews.test.js`
- [x] 3.2 Backend unit coverage for the staff home-context helpers in `backend/tests/unit/talkDataAccess.test.js` (role classification, filter shape/$ne semantics, home-row detection used by the delete guard)
- [x] 3.3 Run the frontend unit suite (`npm run test:unit` in `mockup1`: 135 pass) and backend unit suite (`node --test tests/unit`: 146 pass, 2 skipped); no regressions

## 4. Documentation

- [x] 4.1 Update `docs/stakeholder-deliverables/src/user-manual.md`: parent child-data section describes the two tabs; teacher/admin sections state that home recordings are never visible to staff
- [x] 4.2 Update `docs/stakeholder-deliverables/src/faq.md`: revised "Who can see my child's data?", added "What are the Home talk and Classroom talk views?", and rewrote "Can teachers see parent home recordings?" (now: No)
- [x] 4.3 Rebuild the `.docx` deliverables with `docs/stakeholder-deliverables/build-docx.py`

## 5. Verification

- [ ] 5.1 Manual check: as a parent, toggle Home/Classroom tabs and confirm charts, transcripts, and downloads switch context; as a teacher and as an admin, confirm a child with home recordings shows no home data anywhere on the page or via the API
