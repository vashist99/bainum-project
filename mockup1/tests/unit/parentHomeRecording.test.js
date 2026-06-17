import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    PREDEFINED_LOCATIONS,
    DEFAULT_LOCATION,
    getDefaultLocationForRole,
    getLocationsForRole,
} from "../../src/utils/locations.js";
import { PREDEFINED_LOCATION_GROUPS } from "../../../backend/lib/locationValidator.js";
import { getParentChildIdList } from "../../src/utils/parentChildren.js";

describe("locations utils — home catalog parity", () => {
    test("frontend home list mirrors backend", () => {
        assert.deepEqual(PREDEFINED_LOCATIONS.home, PREDEFINED_LOCATION_GROUPS.home);
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
