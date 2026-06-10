## Context

The app has no classroom concept. Today:
- `backend/models/User.js` exports `Admin`, `Teacher`, `Parent`, `Child` (separate models). `Teacher.center` and `Child.center`-equivalent live as **strings** (center name), not ObjectId refs; `Child.leadTeacher` is also a string ref. `Center` is its own model keyed by unique `name`.
- Classroom-style recordings already exist: `POST /api/whisper/classroom` (`classroomWhisperController.js`) transcribes via RevAI, computes per-category WPM, persists a `TeacherAssessment`, and fans out an `Assessment` per child the teacher supervises (string-matched via `leadTeacher`).
- `HomePage.jsx` renders `DashboardStats` plus a "Recording Tools" card grid; `Sidebar.jsx` builds role-conditional nav items; visualizations (dot matrix + `react-d3-speedometer` dials) live on `ChildDataPage.jsx` / `TeacherDataDetailPage.jsx`.
- Parents carry `childIds[]` and `invitationAccepted` flags.

Constraints: Vercel-serverless-compatible backend, JWT RBAC middleware, additive schema changes only, local verification only (no deploy).

## Goals / Non-Goals

**Goals:**
- Introduce a `Classroom` model with enforced relationship rules (one lead teacher per classroom with teachers leading many, optional single assistant teacher from the same center, center 1:N, child N:M same-center).
- Replace teacher/admin homepage stat cards with classroom-centric UI; add admin Classrooms page, Create Classroom form, classroom homepage with invite + record.
- Scope classroom recordings initiated from a classroom homepage to that classroom's members.
- Aggregated visualization: summed per-category WPM dot matrix; averaged dial markers.

**Non-Goals:**
- No migration of `Teacher.center`/`Child.leadTeacher` strings to ObjectId refs (keep string `center` matching for compatibility).
- No changes to parent homepage, child data pages, or the existing legacy `/api/whisper/classroom` teacher-wide fan-out for uploads NOT initiated from a classroom page.
- No classroom edit/delete UI polish beyond basics; no deployment.

## Decisions

1. **Classroom document owns the membership arrays** (vs. back-references on Child/Parent):
   ```js
   // backend/models/Classroom.js
   {
     name: { type: String, required: true, trim: true },
     teacher: { type: ObjectId, ref: "Teacher", required: true, index: true }, // lead; a teacher may lead many classrooms
     assistantTeacher: { type: ObjectId, ref: "Teacher", required: false },    // optional, single
     center: { type: String, required: true },   // center NAME, matching existing convention
     children: [{ type: ObjectId, ref: "Child" }],
     parents:  [{ type: ObjectId, ref: "Parent" }],
   }, { timestamps: true }
   ```
   Rationale: single source of truth, no multi-document sync, matches how `Parent.childIds` already centralizes links. No uniqueness constraint on `teacher` — a teacher may lead multiple classrooms (and assist others). Controller-level validation enforces: assistant belongs to the classroom's center, and `assistantTeacher !== teacher`. `center` stays a string because `Teacher.center` and the whisper flow already compare center names; converting to ObjectId refs is a larger migration explicitly out of scope.

2. **New REST surface** `backend/routes/classroomRoutes.js` + `classroomController.js`, mounted at `/api/classrooms`:
   - `POST /` create (teacher: name + optional assistantTeacherId, derive lead+center from JWT; admin: name+center+teacherId + optional assistantTeacherId, validate teacher.center === center). Shared validation: assistant (when given) belongs to the classroom's center and differs from the lead.
   - `GET /` list (admin: all; teacher: classrooms where they are lead OR assistant, each row flagged `role: "lead" | "assistant"`; parent: classrooms where they are a member, each row carrying `enrolledChildren: [{id, name}]` scoped to that parent's own children) — populate teacher/assistant names; center is already a name
   - `GET /:id` detail incl. populated children/parents (admin, lead, or assistant — parents stay 403 here)
   - `POST /:id/invite` add accepted parent(s) with per-child selection: body `invites: [{ parentId, childIds?: [] }]` (legacy `parentIds: []` still accepted, meaning all eligible children). For each entry: verify `invitationAccepted`, verify each selected child belongs to that parent, add parent to `parents`, and add only the selected children whose center matches the classroom center to `children` (dedupe with `$addToSet`)
   - `GET /:id/eligible-parents` list parents with `invitationAccepted: true` not yet in the classroom, populated with child names (powers the "Parent of X" panel)
   - Reuse `authenticateToken` + role checks in the controller (same pattern as `centerController`). Centralize authorization in one helper, `canManageClassroom(user, classroom)` ⇒ admin OR lead OR assistant, used by detail/invite/eligible-parents/assessments/record paths.

3. **Classroom recording reuses the existing whisper pipeline, parameterized by classroom**: extend `POST /api/whisper/classroom` to accept an optional `classroomId`. When present, authorize via `canManageClassroom` (so the assistant teacher can record too), fan out to `classroom.children` instead of teacher-wide `leadTeacher` matching, and stamp an optional `classroomId` field on the saved `Assessment`s (and `TeacherAssessment`, whose `teacherId` is whoever recorded — lead or assistant) (additive). Alternative considered: a brand-new endpoint — rejected because 90% of the controller (RevAI, transcript processing, WPM math, cohort stats) would be duplicated.

4. **Aggregation is computed client-side on the classroom homepage** from the children's assessments (`GET /api/classrooms/:id/assessments` returning per-child per-category WPM rows, or reuse existing child-assessment endpoints): dot matrix uses SUM of WPM per category per month; dials use AVERAGE for blue/green/red markers, mirroring how `ChildDataPage` computes its thresholds. Rationale: visualization components already consume this shape; avoids a new server-side aggregation layer. A thin backend aggregate endpoint is acceptable if the client fan-in proves slow.

5. **Frontend routing/pages** (React Router 7, all wrapped in `ProtectedRoute`):
   - `/classrooms` → `ClassroomsPage.jsx` (admin only)
   - `/classrooms/create` → `CreateClassroomForm.jsx` (admin + teacher; mirrors `AddCenterForm`/`AddTeacherForm` patterns)
   - `/classrooms/:id` → `ClassroomHomePage.jsx` (admin + owning teacher)
   - `HomePage.jsx`: drop `<DashboardStats/>` and the Recording Tools grid for teacher/admin; teachers fetch `GET /api/classrooms` and render `ClassroomCard`s for every classroom they lead or assist (assisted ones get a small DaisyUI `badge` reading "Assistant") + Create button; admins render Create button (+ link to `/classrooms`). Parents also fetch `GET /api/classrooms` and see cards for their children's classrooms — the card is NOT a link to the classroom homepage (parents are 403 there); instead each enrolled child renders as a chip linking to `/data/child/:id`. Parent `<DashboardStats/>` removed; Record Activity card stays; empty state when no enrollments.
   - Invite modal: each parent row with multiple children gets per-child checkboxes (all eligible checked by default); confirm sends `invites: [{ parentId, childIds }]`.
   - `Sidebar.jsx`: add `Classrooms` item (icon: `School` from lucide) for admin → `/classrooms`, teacher → their classrooms (or `/home`); hidden for parents.
   - `ClassroomCard.jsx`: DaisyUI `card` — name as `card-title`, lead teacher + center on smaller muted lines (assistant shown when set), optional "Assistant" badge driven by the listing's `role` flag; responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
   - `CreateClassroomForm.jsx`: assistant-teacher dropdown reuses `GET /api/centers/:name/teachers` (already used by `ClassroomUploadModal`), filtered to exclude the selected lead; optional.
   - Invite panel: modal styled like `ClassroomUploadModal`, listing eligible parents as "Parent of <children names>" with checkboxes.
   - Record button on classroom homepage opens the existing `ClassroomUploadModal`/`ActivityRecordingModal` flow with `classroomId` passed through.

6. **Verification is local-only**: run `backend` (`npm run dev`, :5000) and `mockup1` (`npm run dev`, :5173); no commits to deploy branches, no `vercel` invocations.

## Risks / Trade-offs

- [String-based `center` matching is fragile (cosmetic drift already caused a past bug)] → centralize comparison in one helper (trim/case-normalize), same approach used by the teacher-recording fan-out fix.
- [Assistant access widens every authorization point; missing one check leaks classroom admin to non-members] → route all classroom authorization through the single `canManageClassroom` helper and cover lead/assistant/outsider cases in API tests.
- [Client-side aggregation may be slow for large classrooms] → page through assessments / restrict to current year, and fall back to a server aggregate endpoint if needed.
- [Changing `/api/whisper/classroom` could regress the existing teacher-wide flow] → `classroomId` is optional; absent ⇒ legacy behavior unchanged; cover both paths with API tests.
- [Removing `DashboardStats` may orphan navigation users relied on] → Sidebar retains Centers/Teachers/Child Data links, so all destinations remain reachable.

## Migration Plan

Additive only: new `classrooms` collection; optional `classroomId` on `Assessment`/`TeacherAssessment`. No backfill required. Rollback = remove routes/pages; existing data unaffected. Nothing is deployed — local verification first.

## Open Questions

- Should classroom membership ever feed the legacy teacher-wide fan-out (i.e., deprecate `leadTeacher` matching entirely)? Deferred.
- Should assistant teachers be promotable/swappable from the classroom homepage (edit flow), or only set at creation/admin edit? Currently: set at creation; edit deferred to basic CRUD.
