import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    validateBugReport,
    isBugReportValid,
    BUG_REPORT_LIMITS,
} from "../../src/utils/bugReport.js";

function validForm(overrides = {}) {
    return {
        recipientEmail: "dev@example.com",
        title: "Charts do not load",
        description: "The dot matrix stays blank.",
        ...overrides,
    };
}

describe("bugReport — validateBugReport", () => {
    test("a complete valid form has no errors", () => {
        assert.deepEqual(validateBugReport(validForm()), {});
        assert.equal(isBugReportValid(validForm()), true);
    });

    test("optional fields may be empty", () => {
        const form = validForm({ stepsToReproduce: "", pageOrFeature: "" });
        assert.deepEqual(validateBugReport(form), {});
    });

    test("recipient email is required and must be a single valid address", () => {
        assert.ok(validateBugReport(validForm({ recipientEmail: "" })).recipientEmail);
        assert.ok(validateBugReport(validForm({ recipientEmail: "   " })).recipientEmail);
        assert.ok(validateBugReport(validForm({ recipientEmail: "not-an-email" })).recipientEmail);
        assert.ok(validateBugReport(validForm({ recipientEmail: "a@x.com,b@y.com" })).recipientEmail);
        assert.ok(validateBugReport(validForm({ recipientEmail: "a@x.com; b@y.com" })).recipientEmail);
    });

    test("title is required and capped at the limit", () => {
        assert.ok(validateBugReport(validForm({ title: "" })).title);
        assert.ok(validateBugReport(validForm({ title: "  " })).title);
        assert.ok(validateBugReport(validForm({ title: "x".repeat(BUG_REPORT_LIMITS.title + 1) })).title);
        assert.equal(validateBugReport(validForm({ title: "x".repeat(BUG_REPORT_LIMITS.title) })).title, undefined);
    });

    test("description is required and capped at the limit", () => {
        assert.ok(validateBugReport(validForm({ description: "" })).description);
        assert.ok(
            validateBugReport(validForm({ description: "x".repeat(BUG_REPORT_LIMITS.description + 1) })).description
        );
    });

    test("optional fields enforce their length caps", () => {
        assert.ok(
            validateBugReport(validForm({ stepsToReproduce: "x".repeat(BUG_REPORT_LIMITS.stepsToReproduce + 1) }))
                .stepsToReproduce
        );
        assert.ok(
            validateBugReport(validForm({ pageOrFeature: "x".repeat(BUG_REPORT_LIMITS.pageOrFeature + 1) }))
                .pageOrFeature
        );
    });

    test("handles a missing form object", () => {
        const errors = validateBugReport();
        assert.ok(errors.recipientEmail);
        assert.ok(errors.title);
        assert.ok(errors.description);
    });
});
