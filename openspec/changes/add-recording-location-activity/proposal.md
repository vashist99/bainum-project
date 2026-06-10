## Why

Recordings currently capture an **activity** only on the "Record Activity" flow (parents), while classroom recordings intentionally omit it — and **no recording captures where it happened**. Location is a meaningful dimension for language-environment analysis (home vs. park vs. classroom vs. excursion), and the activity mechanism (curated per-role list + AI vetting for custom entries) already exists and works, so locations should reuse the same pattern and classroom recordings should gain both fields.

## What Changes

- **New location catalogs**, mirrored backend + frontend like activities:
  - **Parents (home context):** Home, Park, Friend / relative's home, Museum, Athletic event / stadium, Restaurant, Library, Grocery / big box store, Medical or therapy office, Travel (e.g., car, bus), Faith-based organization, Community Center (e.g., pool), Other (please specify)
  - **Teachers/admins (school context):** Classroom, Excursion, Playground, Lab, Library, Other (please specify)
- **AI vetting for custom locations**: "Other (please specify)" opens a free-text field validated by the same LLM mechanism as custom activities, via a new `POST /api/locations/validate` route; the shared OpenAI plumbing is extracted from the activity validator so both validators reuse one implementation (no duplicated client/prompt/parse code).
- **`location` stored on recordings**: new optional `location` field on `Assessment` and `TeacherAssessment` (additive); accept routes re-validate custom locations server-side (same anti-bypass pattern as activities).
- **Activity + location on classroom recordings**: `ClassroomUploadModal` (the classroom Record flow) gains a school-context activity picker and a teacher location picker; the classroom transcribe/accept pipeline carries and persists both. This replaces the current "activity intentionally omitted" behavior for classroom uploads.
- **Location on parent activity recordings**: `ActivityRecordingModal` gains a parent location picker; the activity accept route persists it.
- **Display**: location shown alongside activity wherever activity already appears (e.g., transcript/assessment listings).
- Pickers default to the most common value per role (teacher → Classroom, parent → Home) to keep the recording flow fast.

## Capabilities

### New Capabilities
- `recording-location`: per-role location catalogs, location selection in both recording modals, custom-location AI vetting endpoint, server-side re-validation, and persistence on both assessment types.
- `classroom-recording-activity`: activity selection (school catalog + custom vetting) on the classroom recording flow, persisted on the teacher assessment and fanned-out child assessments.

### Modified Capabilities
<!-- No existing specs cover the activity mechanism (it predates spec-driven changes); the classroom recording behavior change is captured in classroom-recording-activity above. -->

## Impact

- **Backend**: refactor `lib/activityValidator.js` to extract shared LLM validation plumbing; new `lib/locationValidator.js` (catalogs + `validateCustomLocation`); new validate route; `location` field on `Assessment`/`TeacherAssessment`; accept routes (`/assessments/activity/accept`, `/assessments/teacher/accept`) and transcribe controllers (`activityRecordingController`, `classroomWhisperController`) accept/validate/persist `location` (and `activity` for classroom).
- **Frontend**: new `utils/locations.js` (mirrors backend catalogs); `ActivityRecordingModal` (location picker), `ClassroomUploadModal` (activity + location pickers with the same custom-entry UX); assessment displays show location.
- **Out of scope**: ENACT mobile integration auto-save flow (no UI to pick location); historical assessments (field stays empty); admin moderation queue for vetted entries.
- **No deployment**: verified locally only.
