## Why

Recordings, children, and parents are currently organized only around individual teachers and centers — there is no "classroom" concept, so classroom recordings fan out to *every* child a teacher supervises, and the teacher/admin homepage shows generic stat cards that don't reflect how the school is actually organized. Introducing a Classroom entity ties children, parents, teachers, and centers together, scopes classroom recordings to actual classroom membership, and makes classrooms the primary navigation unit on the dashboard.

## What Changes

- **New `Classroom` DB entity** with relationships:
  - Exactly one teacher-in-charge per classroom; a teacher MAY lead multiple classrooms (1:N)
  - Optionally one assistant teacher per classroom — a regular `Teacher` entity from the same center, distinct from the lead; assistants get co-teacher access (view classroom homepage, record, invite parents)
  - Each classroom belongs to exactly one center; a center can have many classrooms
  - A child can belong to multiple classrooms, but only within the child's own center
  - Parents are added to a classroom via classroom invitations (only parents who already accepted their primary invitation)
- **Homepage redesign (BREAKING for current UI)**: remove all current dashboard stat cards and recording-tool cards for teachers and admins; teachers instead see cards for every classroom where they are lead **or assistant** (assisted classrooms get a small "Assistant" badge) plus a "Create Classroom" button; admins see a "Create Classroom" button (full classroom list lives on a dedicated Classrooms page).
- **Parent homepage simplified to enrolled classrooms**: parents see cards for the classrooms their children are enrolled in (classroom name, teacher, center, plus which of their children are enrolled; tapping a child opens that child's data page). Dashboard stat cards removed; Record Activity stays. Parents can list their enrolled classrooms via the API but remain denied on all classroom administration endpoints.
- **Per-child enrollment on classroom invites**: when inviting a parent with multiple children, admins/teachers choose which child(ren) to enroll (default: all eligible). Classroom recording data lands on exactly the enrolled children's pages.
- **Create Classroom form**: classroom name field plus an optional assistant-teacher selector (center-filtered, excluding the lead); lead teacher and center auto-populated from the creating teacher; admins instead pick a center, then a teacher from that center.
- **Classrooms page (admin)**: grid of classroom cards (classroom name, with teacher-in-charge and center in smaller text); clicking a card opens the classroom homepage.
- **Sidebar**: add a "Classrooms" entry under/next to the Dashboard item linking to the classrooms view (admin → Classrooms page; teacher → their classrooms).
- **Classroom homepage**: title (classroom name) with center and teacher-in-charge below; a list of the classroom's children (added via accepted-parent invites), each shown with their parent name(s); an Invite button opening an invite-to-classroom panel listing accepted parents as "Parent of <child name(s)>"; a Record button that uploads/records a classroom session whose results are aggregated across all children in that classroom (summed WPM per category for the dot matrix; averaged values for the blue/green/red markers on the semicircular dials).
- **Classroom recording scoping**: classroom recordings initiated from a classroom homepage attach to that classroom's children (replacing the teacher-wide fan-out for this flow).
- All new components must be responsive and visually consistent with the existing Tailwind/DaisyUI design.
- **No deployment**: changes are verified locally only (dev servers); nothing is pushed/deployed.

## Capabilities

### New Capabilities
- `classroom-management`: Classroom entity, CRUD API, create-classroom form, relationship rules (one lead teacher per classroom with teachers leading many, optional single assistant teacher from the same center, center 1:N, child N:M within same center), and role-based access (admins manage all; leads and assistants manage their own).
- `classroom-dashboard`: Redesigned teacher/admin homepage with classroom cards and Create Classroom button, admin Classrooms page, sidebar navigation entry, and classroom card presentation.
- `classroom-homepage`: Classroom detail page — header (name, center, teacher), parent invite flow scoped to the classroom, and the aggregated classroom record button with dot-matrix (summed WPM) and dial (averaged markers) visualizations.

### Modified Capabilities
<!-- No existing specs in openspec/specs/ — this is the first spec-driven change. Behavior changes to the existing classroom-recording fan-out and homepage are captured in the new capabilities above. -->

## Impact

- **Backend**: new `backend/models/Classroom.js`; new `classroomRoutes.js`/`classroomController.js`; changes to `classroomWhisperController.js` (scope recording to classroom membership); possible additions to invitation/access-grant logic for classroom membership of parents; `User.js` (Teacher/Parent/Child) gains classroom references or the Classroom doc holds member arrays.
- **Frontend**: `HomePage.jsx` (remove `DashboardStats` and recording-tool cards, add classroom cards/CTA), `Sidebar.jsx` (new nav entry), new pages `ClassroomsPage.jsx`, `CreateClassroomForm.jsx`, `ClassroomHomePage.jsx`, new invite-to-classroom component; reuse of existing dot-matrix/speedometer visualization components and `ClassroomUploadModal`/recording flow.
- **APIs**: new `/api/classrooms` endpoints; updated `/api/whisper/classroom` behavior; new classroom-membership invite endpoints.
- **Security**: classroom access must respect existing RBAC — parents see nothing classroom-administrative; teachers only the classrooms they lead or assist; admins everything.
- **No schema-breaking migrations**: existing data remains valid; classrooms are additive.
