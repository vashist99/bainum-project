# Design: Parent-Controlled Home View Access Grants

## Context

Home talk recordings (`Assessment.activityContext: 'home'`) are the family's private data. Today the privacy boundary is absolute and enforced in two layers:

- **Server:** `backend/lib/talkDataAccess.js` provides `staffHomeContextFilter()` (`{ activityContext: { $ne: "home" } }`), applied to every staff read in `backend/routes/whisperRoutes.js` (child assessments + latest) and `backend/controllers/classroomController.js`. Staff cannot delete home rows.
- **Client:** `mockup1/src/pages/ChildDataPage.jsx` shows the Home/Classroom talk tabs only to parents (`partitionAssessmentsByContext` in `mockup1/src/utils/talkDataViews.js`); staff render the (already-filtered) payload with no tabs.

Related existing machinery:

- **`AccessGrant`** (`backend/models/AccessGrant.js`): a `(childId, teacherId, parentId)` triple with `pending/active/revoked` status governing **full child profile ↔ teacher profile** sharing. It does not touch home talk.
- **Classrooms** (`backend/models/Classroom.js`): exactly one lead `teacher` per classroom (plus optional `assistantTeacher`); a child references its classrooms via `Child.classrooms[]`.
- **Parent linkage:** `Child.parents[]` ↔ `Parent.childIds[]`, gated by `invitationAccepted`.
- **Notifications:** in-app only — `backend/models/Notification.js` (typed, 10-day TTL, no read state), `backend/lib/notificationService.js` fan-out helpers, `NotificationBell` polling `GET /api/notifications`, routing in `mockup1/src/utils/notifications.js`.

This change makes the home-data boundary *parent-controlled* instead of absolute.

## Goals / Non-Goals

**Goals:**

- Parents can grant home view access per classroom (to that classroom's lead teacher) and via a master "grant all" (all teachers and admins), from the child data page — and revoke any grant.
- Staff (teachers and admins) see a Home talk tab on the child data page: real home data when granted, otherwise a privacy message with a "Request access" button.
- A staff access request creates an in-app notification for the child's parent(s).
- Default remains fully private; nothing changes for children whose parents never grant.

**Non-Goals:**

- No changes to *classroom* talk visibility, cohort stats (still exclude home rows), or the existing `AccessGrant` full-profile flow.
- Staff never gain write/delete rights on home assessments, even when granted view access.
- No email or push for requests/grants — in-app bell only, consistent with `parent-notifications`.
- No assistant-teacher grants (per-classroom grants target the lead teacher only, per the request).
- No expiry on grants; they persist until revoked.

## Decisions

### 1. New `HomeViewGrant` model rather than extending `AccessGrant`

`AccessGrant` encodes a teacher-parent-child triple with a unique index and drives full-profile sharing that is auto-created by invitation flows. Home view access has a different shape: it can target an individual staff member (teacher **or** admin, via request) or *all staff* at once, and must never be auto-created. Overloading `AccessGrant` with a `grantType` would entangle two lifecycles and risk existing auto-grant code paths silently widening home access.

`backend/models/HomeViewGrant.js`:

```js
{
  childId:     ObjectId → Child, required, index,
  scope:       "user" | "all-staff",            // what the grant covers
  granteeId:   ObjectId, required iff scope === "user",   // Teacher or Admin _id
  granteeRole: "teacher" | "admin", required iff scope === "user",
  classroomId: ObjectId → Classroom, optional,  // set for per-classroom lead grants (provenance/UI label)
  status:      "pending" | "active" | "revoked", default "pending", index,
  initiatedBy: "parent" | "staff", required,
}
// timestamps; unique index { childId, scope, granteeId } (granteeId null for all-staff)
```

- A per-classroom grant is stored as `scope: "user"` targeting the classroom's **current lead teacher at grant time**, with `classroomId` recorded for display. See Decision 5 for lead-teacher reassignment.
- A staff request is the same document created with `status: "pending"`, `initiatedBy: "staff"`. Parent approval flips it to `active` — one record, no duplicate bookkeeping (mirrors the existing `AccessGrant` pending→active pattern).
- `revoked` records are reactivated (not duplicated) on re-grant, keeping the unique index meaningful.

### 2. Grant-aware server filter, single choke point

Extend `backend/lib/talkDataAccess.js` with `staffHasHomeViewAccess(user, childId)`: true when an `active` `HomeViewGrant` exists for that child with `scope: "all-staff"`, or `scope: "user"` and `granteeId` = the caller. The two staff read paths in `whisperRoutes.js` (`GET /api/assessments/child/:childId` and `/latest`) apply `staffHomeContextFilter()` **only when this check fails**. Parents are untouched.

- Alternatives considered: filtering in a middleware (overkill for two routes), or returning home rows on a separate endpoint (would fork the frontend data flow; the existing client already partitions by `activityContext`).
- The check is one indexed query per request; no caching, so **revocation takes effect on the next request**.
- The staff delete guard on home rows and the classroom-level endpoints (`classroomController.js`, `cohortStatsService.js`) keep the unconditional filter — grants expose home data only on the child's own page.

### 3. Dedicated `/api/home-access` routes

New route file `backend/routes/homeAccessRoutes.js` (mounted in `backend/api/index.js`), all behind `authenticateToken`:

| Endpoint | Caller | Behavior |
|---|---|---|
| `GET /api/home-access/child/:childId` | parent / staff | Parent (must pass `parentMayAccessChild`): full grant state — all-staff status, per-classroom rows (classroom + current lead teacher + grant status), and pending staff requests. Staff: their own status only (`granted` / `pending` / `none`). |
| `POST /api/home-access/child/:childId/grant` | parent only | Body `{ scope: "all-staff" }` or `{ classroomId }`. For `classroomId`, the server resolves the classroom's current lead teacher (classroom must be one of the child's). Upserts the grant to `active`; approving also activates a matching pending request. |
| `POST /api/home-access/child/:childId/revoke` | parent only | Body mirrors grant. Sets `status: "revoked"`. |
| `POST /api/home-access/child/:childId/request` | teacher / admin | Teacher must pass `teacherMayAccessChild` (supervises or has an `AccessGrant`); admins allowed. Creates a `pending` `scope: "user"` grant if none active/pending (idempotent), then fans out the parent notification. |

Parent identity is verified with the existing `parentMayAccessChild` helper (`backend/lib/parentChildHelpers.js`); we deliberately reuse the existing role helpers rather than new middleware, consistent with `accessRoutes.js`.

### 4. Notification: new `home-access-requested` type

- Add `"home-access-requested"` to the `Notification.type` enum; reuse the existing `childId`/`childName` fields (already on the schema).
- New `notificationService.js` helper fans out one notification per accepted parent in `Child.parents[]`, message like `"<Staff name> (<role>) requested access to <Child>'s home talk data"`. As with all existing fan-outs, notification failure never rolls back the request write.
- Idempotency: no new notification when an identical pending request already exists (the request endpoint short-circuits).
- `routeTargetForNotification()` in `mockup1/src/utils/notifications.js` maps the new type to `/data/child/<childId>`, where the parent lands on the page containing the grant controls.

### 5. Grants bind to people, not seats

A per-classroom grant is resolved to the lead teacher **at the moment of granting**. If the classroom's lead is later reassigned, the old teacher keeps their grant (parent consented to that person) and the new lead has none — the parent's per-classroom button reflects the *current* lead's status, so it naturally shows "Grant access" again. This avoids silent access transfer to a person the parent never approved. Alternative (grant bound to `classroomId`, following the current lead) was rejected for exactly that reason.

The all-staff grant is intentionally role-based ("all teachers and admins", per the request): any staff member who can already reach the child's page gets home view. Teachers still need `teacherMayAccessChild` to see the child at all, so the effective audience is the child's educators plus admins.

### 6. Frontend: everything lives on `ChildDataPage`

- **Parents** — the Home talk tab gains a "Sharing" panel: a master grant/revoke control (all teachers & admins), one row per enrolled classroom (classroom name, current lead teacher, Grant/Revoke button), and pending staff requests each with an approve (Grant) action. State comes from `GET /api/home-access/child/:childId`.
- **Staff** — the tabs (currently parent-only, `ChildDataPage.jsx` lines ~481–505) render for teachers/admins too. The Home talk tab body branches on the staff status from the same endpoint:
  - `granted`: identical rendering to the parent home view (charts, WPM, transcripts, export) driven by the client-side partition — the API now returns home rows, so `partitionAssessmentsByContext` just works. The current "staff use `allAssessments` as-is" branch switches to always partitioning.
  - `none` / `pending`: privacy message + "Request access" button (disabled with "Request sent" feedback when pending). Mirrors the existing request-access pattern on `TeacherDataDetailPage.jsx`.
- Staff download filenames reuse the existing `home_talk` suffix logic.

## Risks / Trade-offs

- **[Privacy widening bug]** A regression in the conditional filter could leak home rows to ungranted staff → keep `staffHomeContextFilter()` as the default path, gate the bypass behind a single well-tested `staffHasHomeViewAccess()`, and add unit tests for both branches plus the classroom/cohort endpoints staying unconditional.
- **[All-staff scope breadth]** "All admins" includes future admins automatically → acceptable and literal to the request; the parent-facing label must say "all teachers and admins" so consent is informed.
- **[Lead teacher reassignment confusion]** Old lead keeps access after reassignment → surfaced in the parent's sharing panel (grants list shows the named teacher), and the parent can revoke; documented in Decision 5.
- **[Per-request grant lookup]** One extra indexed query on staff assessment reads → negligible; index on `{ childId, status }` covers it.
- **[Notification spam]** Repeated request clicks → idempotent pending request prevents duplicate notifications.
- **[Two sources of truth for staff home visibility]** UI state (status endpoint) and data (assessment payload) could disagree briefly after revocation → both are fetched fresh on page load; staleness window is one page view, same as existing access checks.

## Migration Plan

Purely additive: new collection, new enum value, new routes. No data migration; absence of grants preserves today's behavior exactly. Rollback = remove the routes/UI; orphaned `homeviewgrants` documents are inert.

## Open Questions

- Should granting (or revoking) also notify the requesting staff member? Out of scope for now — the request said only the parent notification; staff discover access on next visit.
- Should the master grant auto-approve outstanding pending requests? Decision: yes for consistency (all-staff active satisfies every staff check), pending rows are left as-is but become moot; the parent panel hides pending requests while an all-staff grant is active.
