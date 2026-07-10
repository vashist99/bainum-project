# Tasks: Parent-Controlled Home View Access Grants

## 1. Backend model and access check

- [x] 1.1 Create `backend/models/HomeViewGrant.js` — schema per design (childId, scope `user|all-staff`, granteeId/granteeRole, classroomId, status `pending|active|revoked`, initiatedBy, timestamps) with unique index `(childId, scope, granteeId)` and `(childId, status)` index
- [x] 1.2 Add `staffHasHomeViewAccess(user, childId)` to `backend/lib/talkDataAccess.js` (active all-staff grant OR active user-scoped grant for the caller)
- [x] 1.3 Unit tests in `backend/tests/unit/` for the model constraints and `staffHasHomeViewAccess` (all-staff, individual, pending/revoked → false)

## 2. Grant-aware assessment endpoints

- [x] 2.1 In `backend/routes/whisperRoutes.js`, apply `staffHomeContextFilter()` on `GET /api/assessments/child/:childId` and `/latest` only when the staff caller lacks home view access
- [x] 2.2 Verify the staff delete guard on home-context assessments remains unconditional (no grant bypass), and classroom/cohort paths (`classroomController.js`, `cohortStatsService.js`) keep the unconditional filter
- [x] 2.3 Tests: ungranted staff excluded, granted teacher/admin included, parent unchanged, granted staff still blocked from deleting home rows

## 3. Home access API

- [x] 3.1 Create `backend/routes/homeAccessRoutes.js` and mount at `/api/home-access` in `backend/api/index.js` (all routes behind `authenticateToken`)
- [x] 3.2 `GET /api/home-access/child/:childId` — parent: all-staff status, per-classroom rows with current lead teacher + status, pending requests; staff: own status (`granted|pending|none`); others 403
- [x] 3.3 `POST /api/home-access/child/:childId/grant` — parent only (`parentMayAccessChild`); `{ scope: "all-staff" }` or `{ classroomId }` resolving the classroom's current lead teacher; upsert to active; activates matching pending request; validate classroom belongs to child
- [x] 3.4 `POST /api/home-access/child/:childId/revoke` — parent only; sets targeted grant to revoked
- [x] 3.5 `POST /api/home-access/child/:childId/request` — teacher (must pass `teacherMayAccessChild`) or admin; idempotent pending grant creation
- [x] 3.6 Route/controller tests covering authorization failures, idempotent requests, grant/revoke lifecycle, and pending→active on parent approval

## 4. Request notifications

- [x] 4.1 Add `"home-access-requested"` to the `Notification.type` enum in `backend/models/Notification.js`
- [x] 4.2 Add fan-out helper in `backend/lib/notificationService.js` — one notification per accepted parent in `Child.parents[]`, message naming requester and child; wire into the request endpoint after the grant write; errors must not roll back
- [x] 4.3 Tests: one notification per parent on first request, none on repeat request, request succeeds when notification write throws

## 5. Frontend — parent sharing panel

- [x] 5.1 Add a home-access API client helper (fetch state, grant, revoke, request) for `ChildDataPage`
- [x] 5.2 In `mockup1/src/pages/ChildDataPage.jsx`, render a sharing panel in the parent Home talk view: master grant/revoke control (labeled "all teachers and admins"), per-classroom rows (classroom name, current lead teacher, grant/revoke), pending requests with approve action; update panel state without reload
- [x] 5.3 Unit tests for the sharing panel states (no grants, per-classroom granted, all-staff active hides pending list, approve flow)

## 6. Frontend — staff Home talk tab

- [x] 6.1 In `ChildDataPage.jsx`, render the Home/Classroom tabs for teachers and admins; staff now partition `allAssessments` via `partitionAssessmentsByContext` like parents
- [x] 6.2 Home tab for staff without access: privacy message + "Request access" button calling the request endpoint; disabled "Request sent" state when pending
- [x] 6.3 Home tab for granted staff: charts, WPM stats, transcripts, and export render from home-context assessments (reuse existing home view rendering and `home_talk` download suffix)
- [x] 6.4 Unit tests: ungranted staff sees request UI and no home data, granted staff sees home data, classroom tab never includes home rows

## 7. Notification bell routing

- [x] 7.1 Map `home-access-requested` to `/data/child/<childId>` in `routeTargetForNotification()` (`mockup1/src/utils/notifications.js`)
- [x] 7.2 Extend `mockup1/tests/unit` notification routing tests for the new type

## 8. Verification

- [x] 8.1 Run backend and frontend test suites; fix regressions
- [ ] 8.2 Manual pass: parent grants per-classroom and master, teacher requests → parent bell notification → grant → teacher sees home data, revoke → access gone on refresh
