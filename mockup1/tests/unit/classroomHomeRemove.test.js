import { test, describe } from "node:test";
import assert from "node:assert/strict";

const {
    canRemoveChildFromClassroom,
    REMOVE_CHILD_MODAL_BULLETS,
} = await import("../../src/utils/classroomMembershipUi.js");

describe("canRemoveChildFromClassroom", () => {
    test("admin can remove", () => {
        assert.equal(
            canRemoveChildFromClassroom({
                isAdmin: true,
                userRole: "admin",
                userId: "a",
                leadTeacherId: "b",
            }),
            true
        );
    });

    test("lead teacher can remove", () => {
        assert.equal(
            canRemoveChildFromClassroom({
                isAdmin: false,
                userRole: "teacher",
                userId: "lead-1",
                leadTeacherId: "lead-1",
            }),
            true
        );
    });

    test("assistant teacher cannot remove", () => {
        assert.equal(
            canRemoveChildFromClassroom({
                isAdmin: false,
                userRole: "teacher",
                userId: "assistant-1",
                leadTeacherId: "lead-1",
            }),
            false
        );
    });

    test("parent cannot remove", () => {
        assert.equal(
            canRemoveChildFromClassroom({
                isAdmin: false,
                userRole: "parent",
                userId: "parent-1",
                leadTeacherId: "lead-1",
            }),
            false
        );
    });
});

describe("REMOVE_CHILD_MODAL_BULLETS", () => {
    test("includes parent-prune and history attribution copy", () => {
        assert.equal(REMOVE_CHILD_MODAL_BULLETS.length, 4);
        assert.match(
            REMOVE_CHILD_MODAL_BULLETS.join(" "),
            /notification/i
        );
        assert.match(
            REMOVE_CHILD_MODAL_BULLETS.join(" "),
            /classroom attribution/i
        );
    });
});
