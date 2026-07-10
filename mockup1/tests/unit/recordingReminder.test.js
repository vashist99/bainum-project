import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    MAX_RECORDING_MS,
    REMINDER_INTERVAL_MS,
    initialReminderAt,
    shouldShowReminder,
    advanceReminder,
} from "../../src/utils/recordingReminder.js";

const MIN = 60 * 1000;

describe("recordingReminder — constants", () => {
    test("hard cap is 60 minutes", () => {
        assert.equal(MAX_RECORDING_MS, 60 * MIN);
    });

    test("reminder interval is 15 minutes", () => {
        assert.equal(REMINDER_INTERVAL_MS, 15 * MIN);
    });

    test("a fresh session's first reminder is one interval in", () => {
        assert.equal(initialReminderAt(), REMINDER_INTERVAL_MS);
    });
});

describe("recordingReminder — shouldShowReminder", () => {
    test("no reminder before 15 minutes", () => {
        assert.equal(shouldShowReminder(0, initialReminderAt()), false);
        assert.equal(shouldShowReminder(14 * MIN + 59_750, initialReminderAt()), false);
    });

    test("fires exactly at 15 minutes", () => {
        assert.equal(shouldShowReminder(15 * MIN, initialReminderAt()), true);
    });

    test("fires just past the deadline (250ms tick granularity)", () => {
        assert.equal(shouldShowReminder(15 * MIN + 250, initialReminderAt()), true);
    });
});

describe("recordingReminder — recurrence at 30/45 minutes", () => {
    test("advancing after the first reminder schedules 30 minutes", () => {
        const next = advanceReminder(15 * MIN, initialReminderAt());
        assert.equal(next, 30 * MIN);
        assert.equal(shouldShowReminder(29 * MIN, next), false);
        assert.equal(shouldShowReminder(30 * MIN, next), true);
    });

    test("third reminder lands at 45 minutes", () => {
        let next = initialReminderAt();
        next = advanceReminder(15 * MIN, next);
        next = advanceReminder(30 * MIN, next);
        assert.equal(next, 45 * MIN);
        assert.equal(shouldShowReminder(45 * MIN, next), true);
    });

    test("a throttled tab that slept past several deadlines gets one reminder, not a burst", () => {
        // Tab wakes at 47 min having never fired: next deadline must clear
        // the current elapsed time so only a single modal shows.
        const next = advanceReminder(47 * MIN, initialReminderAt());
        assert.equal(next, 60 * MIN);
        assert.equal(shouldShowReminder(47 * MIN, next), false);
    });
});

describe("recordingReminder — session reset", () => {
    test("a new session starts back at the first deadline", () => {
        // Simulates handleStopRecording/handleStartRecording resetting the ref.
        let next = advanceReminder(20 * MIN, initialReminderAt());
        assert.equal(next, 30 * MIN);
        next = initialReminderAt();
        assert.equal(next, 15 * MIN);
        assert.equal(shouldShowReminder(5 * MIN, next), false);
        assert.equal(shouldShowReminder(15 * MIN, next), true);
    });
});
