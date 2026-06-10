## 1. Backend — shared validator + location catalogs

- [x] 1.1 Extract shared LLM vetting plumbing from `backend/lib/activityValidator.js` into `backend/lib/labelValidator.js` (`validateLabelWithLLM`); keep `validateCustomActivity`'s exported signature/behavior identical and confirm existing `activityValidator.test.js` passes unchanged
- [x] 1.2 Create `backend/lib/locationValidator.js`: `PREDEFINED_LOCATION_GROUPS` (home: 12 parent locations; school: Classroom, Excursion, Playground, Lab, Library — exact wording from spec), `isPredefinedLocation(value, context)` with normalized-key matching, `validateCustomLocation(value, context)` using the shared LLM helper with a location-specific prompt
- [x] 1.3 Add `validateLocationController` and route `POST /api/locations/validate` (context from role: parent → home, teacher/admin → school), mirroring the activities validate route
- [x] 1.4 Unit tests: catalogs match the spec lists exactly, predefined matching tolerates case/whitespace, context isolation (teacher "Home" not predefined for school), LLM-unavailable rejection path

## 2. Backend — persist location (and classroom activity)

- [x] 2.1 Add optional `location` field (String, trim) to `Assessment` and `TeacherAssessment` schemas (additive)
- [x] 2.2 `activityRecordingController` + `/api/assessments/activity/accept`: pass `location` through the draft payload; at accept, re-validate non-predefined locations server-side (per role context) and stamp `location` on all child assessments and the teacher mirror
- [x] 2.3 `classroomWhisperController` + `/api/assessments/teacher/accept`: accept `activity` and `location` in the upload body and draft payload; at accept, re-validate non-predefined values (school context) and stamp both on the `TeacherAssessment` and all fanned-out child assessments
- [x] 2.4 API tests: locations/validate auth + predefined acceptance, accept-route rejection of unvetted custom location, classroom accept persisting activity+location

## 3. Frontend — catalogs and pickers

- [x] 3.1 Create `mockup1/src/utils/locations.js` mirroring backend catalogs (home + school lists, `CUSTOM_LOCATION_VALUE` sentinel, `getLocationsForRole`)
- [x] 3.2 Extract/reuse a custom-entry select pattern and add a location picker to `ActivityRecordingModal` (default "Home"; "Other (please specify)" → free text + AI validate via `/api/locations/validate`; upload blocked until accepted); send `location` with upload and accept payloads
- [x] 3.3 Add school-context activity picker and location picker (default "Classroom") to `ClassroomUploadModal` with the same custom-entry vetting; send `activity` + `location` through upload and accept payloads
- [x] 3.4 Display location alongside activity wherever assessments/transcripts already show activity (child data page, teacher data detail)

## 4. Verification (local only — do not deploy)

- [x] 4.1 Run backend unit tests, API tests, and frontend lint/build
- [ ] 4.2 Manual local check with dev servers: parent activity recording with predefined and custom location; classroom recording with activity + location (predefined and custom); legacy assessments still render; nothing committed/pushed for deployment
