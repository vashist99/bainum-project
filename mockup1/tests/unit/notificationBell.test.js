import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Covers the pure helpers used by `NotificationBell.jsx`. The JSX
// component itself depends on a router + auth context + axios which
// would need a full DOM harness — see the manual smoke checks in
// tasks §12.4 for the rendered behavior.
const { formatRelativeTime, routeTargetForNotification } = await import(
    "../../src/utils/notifications.js"
);

describe("NotificationBell — formatRelativeTime", () => {
    const NOW = new Date("2026-06-17T12:00:00.000Z").getTime();

    test("returns empty for falsy input", () => {
        assert.equal(formatRelativeTime(null, NOW), "");
        assert.equal(formatRelativeTime(undefined, NOW), "");
        assert.equal(formatRelativeTime("", NOW), "");
    });

    test("returns empty for unparsable input", () => {
        assert.equal(formatRelativeTime("not-a-date", NOW), "");
    });

    test("just now (under 60s)", () => {
        const t = new Date(NOW - 30_000).toISOString();
        assert.equal(formatRelativeTime(t, NOW), "just now");
    });

    test("minutes ago", () => {
        const t = new Date(NOW - 5 * 60_000).toISOString();
        assert.equal(formatRelativeTime(t, NOW), "5 minutes ago");
        const t1 = new Date(NOW - 60_000).toISOString();
        assert.equal(formatRelativeTime(t1, NOW), "1 minute ago");
    });

    test("hours ago", () => {
        const t = new Date(NOW - 3 * 60 * 60_000).toISOString();
        assert.equal(formatRelativeTime(t, NOW), "3 hours ago");
        const t1 = new Date(NOW - 60 * 60_000).toISOString();
        assert.equal(formatRelativeTime(t1, NOW), "1 hour ago");
    });

    test("days ago", () => {
        const t = new Date(NOW - 2 * 24 * 60 * 60_000).toISOString();
        assert.equal(formatRelativeTime(t, NOW), "2 days ago");
        const t1 = new Date(NOW - 24 * 60 * 60_000).toISOString();
        assert.equal(formatRelativeTime(t1, NOW), "1 day ago");
    });
});

describe("NotificationBell — routeTargetForNotification", () => {
    test("classroom-added routes to /classrooms/<id>", () => {
        assert.equal(
            routeTargetForNotification({
                type: "classroom-added",
                classroomId: "64b0000000000000000000aa",
            }),
            "/classrooms/64b0000000000000000000aa"
        );
    });

    test("classroom-added without classroomId routes nowhere", () => {
        assert.equal(
            routeTargetForNotification({ type: "classroom-added" }),
            null
        );
        assert.equal(
            routeTargetForNotification({
                type: "classroom-added",
                classroomId: null,
            }),
            null
        );
    });

    test("classroom-removed always routes to /home (parent no longer has access)", () => {
        assert.equal(
            routeTargetForNotification({
                type: "classroom-removed",
                classroomId: "anything",
            }),
            "/home"
        );
        assert.equal(
            routeTargetForNotification({ type: "classroom-removed" }),
            "/home"
        );
    });

    test("unknown type routes nowhere", () => {
        assert.equal(
            routeTargetForNotification({ type: "something-else" }),
            null
        );
    });

    test("null input is safe", () => {
        assert.equal(routeTargetForNotification(null), null);
        assert.equal(routeTargetForNotification(undefined), null);
    });
});
