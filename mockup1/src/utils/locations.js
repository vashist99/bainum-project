/**
 * Locations surfaced in the recording-location picker.
 *
 *  - `home`   → shown to parents (where the family recording happened)
 *  - `school` → shown to teachers and admins (where the classroom recording happened)
 *
 * Anything outside these curated lists is treated as a custom location and validated
 * by the backend LLM (see backend/lib/locationValidator.js — must be kept in sync).
 */
export const PREDEFINED_LOCATIONS = {
  home: [
    "Home",
    "Park",
    "Friend / relative's home",
    "Museum",
    "Athletic event / stadium",
    "Restaurant",
    "Library",
    "Grocery / big box store",
    "Medical or therapy office",
    "Travel (e.g., car, bus)",
    "Faith-based organization",
    "Community Center (e.g., pool)",
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
  home: "Home",
  school: "Classroom",
};

export function getLocationsForRole(role) {
  return role === "parent" ? PREDEFINED_LOCATIONS.home : PREDEFINED_LOCATIONS.school;
}

export function getDefaultLocationForRole(role) {
  return role === "parent" ? DEFAULT_LOCATION.home : DEFAULT_LOCATION.school;
}
