import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    PREDEFINED_LOCATIONS,
    DEFAULT_LOCATION,
    getDefaultLocationForRole,
    getLocationsForRole,
} from "../../src/utils/locations.js";
import { getParentChildIdList } from "../../src/utils/parentChildren.js";

/** Keep in sync with backend/lib/locationValidator.js (home catalog). */
const EXPECTED_HOME_LOCATIONS = [
    "Mealtime or snacks",
    "Personal Care (e.g., dressing, bathing, brushing teeth)",
    "Play/free play (e.g., blocks, puzzles, cars & trucks)",
    "Screen time (e.g., show, iPad / tablet / video games)",
    "Reading or looking at books",
    "Outdoor play (e.g., playing soccer, swinging)",
    "Clean up (e.g., picking up toys)",
    "Structured Activities (non-free play activities such as circle time, art, small group)",
];

describe("locations utils — home catalog parity", () => {
    test("frontend home list matches the canonical home catalog", () => {
        assert.deepEqual(PREDEFINED_LOCATIONS.home, EXPECTED_HOME_LOCATIONS);
    });

    test("parent default is play/free play", () => {
        assert.equal(
            getDefaultLocationForRole("parent"),
            "Play/free play (e.g., blocks, puzzles, cars & trucks)"
        );
        assert.equal(DEFAULT_LOCATION.home, getDefaultLocationForRole("parent"));
    });

    test("parent gets eight routine locations", () => {
        assert.equal(getLocationsForRole("parent").length, 8);
    });
});

describe("parent home recording — child pre-select", () => {
    test("single linked child id list yields one pre-select candidate", () => {
        const user = { role: "parent", childIds: ["abc123"] };
        const ids = getParentChildIdList(user);
        assert.deepEqual(ids, ["abc123"]);
        const preselected = ids.length === 1 ? ids[0] : "";
        assert.equal(preselected, "abc123");
    });

    test("multi-child list requires explicit selection", () => {
        const user = { role: "parent", childIds: ["a", "b"] };
        const ids = getParentChildIdList(user);
        const preselected = ids.length === 1 ? ids[0] : "";
        assert.equal(preselected, "");
        assert.equal(ids.length, 2);
    });
});
