import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    partitionAssessmentsByContext,
    TALK_VIEWS,
} from "../../src/utils/talkDataViews.js";

const home1 = { _id: "h1", activityContext: "home" };
const home2 = { _id: "h2", activityContext: "home" };
const school1 = { _id: "s1", activityContext: "school" };
const legacy1 = { _id: "l1" }; // pre-home-recording row, no activityContext
const legacyNull = { _id: "l2", activityContext: null };

describe("talkDataViews — partitionAssessmentsByContext", () => {
    test("splits home vs classroom by activityContext", () => {
        const { home, classroom } = partitionAssessmentsByContext([
            home1,
            school1,
            home2,
        ]);
        assert.deepEqual(home, [home1, home2]);
        assert.deepEqual(classroom, [school1]);
    });

    test("legacy rows without activityContext count as classroom data", () => {
        const { home, classroom } = partitionAssessmentsByContext([
            legacy1,
            home1,
            legacyNull,
        ]);
        assert.deepEqual(home, [home1]);
        assert.deepEqual(classroom, [legacy1, legacyNull]);
    });

    test("preserves input order within each partition", () => {
        const { classroom } = partitionAssessmentsByContext([
            school1,
            legacy1,
            legacyNull,
        ]);
        assert.deepEqual(
            classroom.map((a) => a._id),
            ["s1", "l1", "l2"]
        );
    });

    test("empty and non-array inputs yield empty partitions", () => {
        assert.deepEqual(partitionAssessmentsByContext([]), {
            home: [],
            classroom: [],
        });
        assert.deepEqual(partitionAssessmentsByContext(undefined), {
            home: [],
            classroom: [],
        });
        assert.deepEqual(partitionAssessmentsByContext(null), {
            home: [],
            classroom: [],
        });
    });

    test("view constants are stable identifiers", () => {
        assert.equal(TALK_VIEWS.CLASSROOM, "classroom");
        assert.equal(TALK_VIEWS.HOME, "home");
    });
});
