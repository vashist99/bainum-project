import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    PREDEFINED_ACTIVITY_GROUPS,
    CUSTOM_ACTIVITY_VALUE,
    getActivityGroupsForRole,
} from "../../src/utils/activities.js";

describe("activities utils – PREDEFINED_ACTIVITY_GROUPS", () => {
    test("exposes home and school contexts with non-empty groups", () => {
        assert.ok(Array.isArray(PREDEFINED_ACTIVITY_GROUPS.home));
        assert.ok(Array.isArray(PREDEFINED_ACTIVITY_GROUPS.school));
        assert.ok(PREDEFINED_ACTIVITY_GROUPS.home.length > 0);
        assert.ok(PREDEFINED_ACTIVITY_GROUPS.school.length > 0);
    });

    test("every group has a string category and a non-empty activities array", () => {
        for (const ctx of ["home", "school"]) {
            for (const group of PREDEFINED_ACTIVITY_GROUPS[ctx]) {
                assert.equal(typeof group.category, "string");
                assert.ok(group.category.length > 0);
                assert.ok(Array.isArray(group.activities));
                assert.ok(group.activities.length > 0);
                for (const activity of group.activities) {
                    assert.equal(typeof activity, "string");
                    assert.ok(activity.trim().length > 0);
                }
            }
        }
    });

    test("activity names within a context are unique (case-insensitive)", () => {
        for (const ctx of ["home", "school"]) {
            const seen = new Set();
            for (const group of PREDEFINED_ACTIVITY_GROUPS[ctx]) {
                for (const activity of group.activities) {
                    const key = activity.toLowerCase().trim();
                    assert.ok(
                        !seen.has(key),
                        `Duplicate activity in ${ctx}: ${activity}`
                    );
                    seen.add(key);
                }
            }
        }
    });

    test("known parent activities are present in home context", () => {
        const all = PREDEFINED_ACTIVITY_GROUPS.home.flatMap((g) => g.activities);
        assert.ok(all.includes("Puzzles"));
        assert.ok(all.includes("Bath time"));
        assert.ok(all.includes("Reading together"));
    });

    test("known teacher activities are present in school context", () => {
        const all = PREDEFINED_ACTIVITY_GROUPS.school.flatMap((g) => g.activities);
        assert.ok(all.includes("Circle time"));
        assert.ok(all.includes("Field trip"));
        assert.ok(all.includes("Story time / read aloud"));
    });
});

describe("activities utils – CUSTOM_ACTIVITY_VALUE", () => {
    test("is a non-empty sentinel string", () => {
        assert.equal(typeof CUSTOM_ACTIVITY_VALUE, "string");
        assert.ok(CUSTOM_ACTIVITY_VALUE.length > 0);
    });

    test("does not collide with any predefined activity (case-insensitive)", () => {
        const key = CUSTOM_ACTIVITY_VALUE.toLowerCase().trim();
        for (const ctx of ["home", "school"]) {
            for (const group of PREDEFINED_ACTIVITY_GROUPS[ctx]) {
                for (const activity of group.activities) {
                    assert.notEqual(activity.toLowerCase().trim(), key);
                }
            }
        }
    });
});

describe("activities utils – getActivityGroupsForRole", () => {
    test("returns the school list for teachers", () => {
        const groups = getActivityGroupsForRole("teacher");
        assert.strictEqual(groups, PREDEFINED_ACTIVITY_GROUPS.school);
    });

    test("returns the home list for parents", () => {
        const groups = getActivityGroupsForRole("parent");
        assert.strictEqual(groups, PREDEFINED_ACTIVITY_GROUPS.home);
    });

    test("falls back to the home list for unknown roles", () => {
        // Used defensively when role is missing or admin-like.
        assert.strictEqual(getActivityGroupsForRole(""), PREDEFINED_ACTIVITY_GROUPS.home);
        assert.strictEqual(getActivityGroupsForRole(undefined), PREDEFINED_ACTIVITY_GROUPS.home);
        assert.strictEqual(getActivityGroupsForRole("admin"), PREDEFINED_ACTIVITY_GROUPS.home);
    });
});
