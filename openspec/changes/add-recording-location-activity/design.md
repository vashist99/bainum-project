## Context

The activity mechanism already implements exactly the pattern requested for locations:
- `backend/lib/activityValidator.js`: `PREDEFINED_ACTIVITY_GROUPS` keyed by context (`home` for parents, `school` for teachers), normalized-key predefined matching (`isPredefinedActivity(value, context)`), and `validateCustomActivity(value, context)` which calls OpenAI (`gpt-4o-mini`, strict-JSON response) for non-predefined entries.
- Route `POST /api/activities/validate` (`validateActivityController`); the accept route `/api/assessments/activity/accept` **re-validates server-side** so the client check can't be bypassed.
- Frontend mirror `mockup1/src/utils/activities.js` + `ActivityRecordingModal` grouped `<select>` with a `CUSTOM_ACTIVITY_VALUE` sentinel and an inline "validate with AI" step that blocks upload until accepted.
- `Assessment` has `activity` and `activityContext` fields; `TeacherAssessment` persists `activity` for teacher activity recordings. Classroom uploads currently omit `activity` deliberately (`whisperRoutes.js` accept fan-out comment).
- Classroom recordings (from `add-classrooms`) flow through `ClassroomUploadModal` → `POST /api/whisper/classroom` → `POST /api/assessments/teacher/accept` (with optional `classroomId`).

## Goals / Non-Goals

**Goals:**
- Location capture on every recording flow with per-role catalogs and AI vetting for "Other (please specify)".
- Activity capture on classroom recordings (school catalog + existing vetting).
- One shared LLM-vetting implementation for activities and locations.

**Non-Goals:**
- No changes to the ENACT mobile auto-save integration (no picker UI there).
- No backfill of historical assessments; no admin moderation queue or persistence of vetted custom labels into the catalogs.
- No analytics/filtering by location yet (data capture only, plus display where activity already shows).

## Decisions

1. **Extract a shared LLM validator instead of duplicating.** Refactor `activityValidator.js`: pull the OpenAI client, strict-JSON call, parse/fallback logic into `lib/labelValidator.js` exporting `validateLabelWithLLM({ value, context, kindDescription, systemPrompt })`. `validateCustomActivity` becomes a thin wrapper; new `lib/locationValidator.js` provides `PREDEFINED_LOCATION_GROUPS` (flat lists, no categories needed), `isPredefinedLocation(value, context)`, `validateCustomLocation(value, context)` with a location-specific prompt ("a place where a young child could plausibly be during this recording context"). Alternative — copy-paste a parallel validator — rejected: the OpenAI plumbing (client caching, JSON parsing, error fallbacks) is ~80 lines that would drift.

2. **Location lists are flat (no category groups).** The catalogs are short; model them as `{ home: [...12 items], school: [...5 items] }` + the "Other" sentinel handled by the UI, mirroring the user's exact wording (e.g., "Travel (e.g., car, bus)"). Frontend mirror in `mockup1/src/utils/locations.js` with `CUSTOM_LOCATION_VALUE` sentinel, same as activities.

3. **One new route, same shape as activities:** `POST /api/locations/validate` → `validateLocationController` (same module as the activity controller to share rate-limiting posture), body `{ location }`, context derived from `req.user.role` (parent → home, teacher/admin → school) exactly like the activity validate route.

4. **Schema: additive `location` field** (String, optional, trimmed) on `Assessment` and `TeacherAssessment`. `activityContext` already distinguishes home/school, so no `locationContext` needed — context is implied.

5. **Server-side enforcement at accept time** (anti-bypass, mirrors activities):
   - `/api/assessments/activity/accept`: validate `location` if present and non-predefined (home context for parents, school for teachers) before saving; stamp on all child assessments + the teacher mirror.
   - `/api/assessments/teacher/accept` (classroom flow): validate `activity` (school) and `location` (school) when present; stamp both on the `TeacherAssessment` and all fanned-out child `Assessment`s.
   - Transcribe controllers (`activityRecordingController`, `classroomWhisperController`) pass `location`/`activity` through into the draft assessment payload so the modals' accept call carries them automatically (same passthrough pattern used for `classroomId`).
   - Policy: location optional at the API level (legacy clients), but the UI always sends one via defaults.

6. **Frontend pickers:**
   - `ActivityRecordingModal`: add a location `<select>` (home list for parents, school list if ever opened by teacher role) defaulting to Home, with "Other (please specify)" → free-text + "Validate" button calling `/api/locations/validate`; upload blocked until custom location accepted (identical UX to custom activity).
   - `ClassroomUploadModal`: add school-context activity picker (reuse `getActivityGroupsForRole`/grouped select from ActivityRecordingModal — extract a small shared `ActivitySelect`/`LocationSelect` component if cleaner) and school location picker defaulting to Classroom; same custom-entry vetting for both.
   - Display: where assessments render activity (child data page transcript listings, teacher detail), append location (e.g., "Circle time · Playground").

## Risks / Trade-offs

- [Catalog drift between backend and frontend mirrors] → same discipline as activities (comment cross-references both files); a unit test asserts backend catalogs match the spec lists exactly.
- [Refactoring activityValidator could regress activity vetting] → keep `validateCustomActivity`'s exported signature and behavior identical; existing `activityValidator.test.js` unit tests must pass unchanged.
- [Two LLM vetting calls per recording (custom activity + custom location)] → rare path; both predefined by default, so the common path makes zero LLM calls.
- [ClassroomUploadModal grows complex (center/teacher selects + activity + location + file + date)] → group pickers under a "Recording details" section; keep modal scrollable (already `max-h-[92vh] overflow-y-auto`).

## Migration Plan

Additive only: new optional fields, new route, new lib modules. No backfill; rollback = remove pickers/route. Local verification only — nothing deployed.

## Open Questions

- Should accepted custom locations/activities be remembered (per user or globally) so users don't re-validate the same entry? Deferred — capture frequency data first.
- Should the admin classroom upload allow a different location list than teachers? Currently both use the school list per the request ("for teachers, the list I need should be shorter" — admins record on behalf of teachers).
