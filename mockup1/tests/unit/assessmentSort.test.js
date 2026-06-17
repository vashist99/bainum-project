import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { compareAssessmentsNewestFirst } from "../../src/utils/assessmentSort.js";

describe("compareAssessmentsNewestFirst", () => {
    test("newer ObjectId sorts before older when recording dates match", () => {
        const older = {
            _id: "507f1f77bcf86cd799439011",
            date: "2024-01-01T12:00:00.000Z",
        };
        const newer = {
            _id: "657a0f000000000000000001",
            date: "2024-01-01T12:00:00.000Z",
        };
        assert.ok(compareAssessmentsNewestFirst(older, newer) > 0);
        assert.ok(compareAssessmentsNewestFirst(newer, older) < 0);
    });

    test("falls back to recording date when ids are absent", () => {
        const early = { date: "2024-01-01T12:00:00.000Z" };
        const late = { date: "2024-06-01T12:00:00.000Z" };
        assert.ok(compareAssessmentsNewestFirst(early, late) > 0);
    });
});
