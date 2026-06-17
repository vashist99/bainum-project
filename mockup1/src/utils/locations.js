/**
 * Locations surfaced in the recording-location picker.
 *
 *  - `home`   → shown to parents (routine/setting where the family recording happened)
 *  - `school` → shown to teachers and admins (where the classroom recording happened)
 *
 * Anything outside these curated lists is treated as a custom location and validated
 * by the backend LLM (see backend/lib/locationValidator.js — must be kept in sync).
 */
export const PREDEFINED_LOCATIONS = {
  home: [
    "Mealtime or snacks",
    "Personal Care (e.g., dressing, bathing, brushing teeth)",
    "Play/free play (e.g., blocks, puzzles, cars & trucks)",
    "Screen time (e.g., show, iPad / tablet / video games)",
    "Reading or looking at books",
    "Outdoor play (e.g., playing soccer, swinging)",
    "Clean up (e.g., picking up toys)",
    "Structured Activities (non-free play activities such as circle time, art, small group)",
  ],
  school: [
    "Classroom",
    "Excursion",
    "Playground",
    "Lab",
    "Library",
  ],
};

export const CUSTOM_LOCATION_VALUE = "__custom_location__";

/** Most common location per context — preselected so the happy path needs no clicks. */
export const DEFAULT_LOCATION = {
  home: "Play/free play (e.g., blocks, puzzles, cars & trucks)",
  school: "Classroom",
};

export function getLocationsForRole(role) {
  return role === "parent" ? PREDEFINED_LOCATIONS.home : PREDEFINED_LOCATIONS.school;
}

export function getDefaultLocationForRole(role) {
  return role === "parent" ? DEFAULT_LOCATION.home : DEFAULT_LOCATION.school;
}
