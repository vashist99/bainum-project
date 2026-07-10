import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Pure helpers behind the Home Talk sharing panel (parents) and the
// staff home-view gate on ChildDataPage. The JSX components need a DOM
// harness; the state derivation they render from is covered here.
import {
    HOME_ACCESS_STATUS,
    staffHomeStatusFrom,
    staffHasHomeAccess,
    allStaffGrantActive,
    classroomGrantRows,
    visiblePendingRequests,
} from "../../src/utils/homeViewAccess.js";

const CLASSROOM_ROW = {
    classroomId: "r1",
    classroomName: "Pre-K Owls",
    leadTeacherId: "t1",
    leadTeacherName: "Ms. Rivera",
    status: "active",
    grantId: "g1",
};

const PENDING_REQUEST = {
    grantId: "g2",
    granteeId: "t2",
    granteeRole: "teacher",
    granteeName: "Mr. Chen",
};

describe("homeViewAccess — staff status", () => {
    test("granted and pending pass through", () => {
        assert.equal(staffHomeStatusFrom({ status: "granted" }), HOME_ACCESS_STATUS.GRANTED);
        assert.equal(staffHomeStatusFrom({ status: "pending" }), HOME_ACCESS_STATUS.PENDING);
    });

    test("anything else (none, unknown, missing state) is none", () => {
        assert.equal(staffHomeStatusFrom({ status: "none" }), HOME_ACCESS_STATUS.NONE);
        assert.equal(staffHomeStatusFrom({ status: "weird" }), HOME_ACCESS_STATUS.NONE);
        assert.equal(staffHomeStatusFrom(null), HOME_ACCESS_STATUS.NONE);
        assert.equal(staffHomeStatusFrom(undefined), HOME_ACCESS_STATUS.NONE);
        assert.equal(staffHomeStatusFrom({}), HOME_ACCESS_STATUS.NONE);
    });

    test("only granted unlocks home data", () => {
        assert.equal(staffHasHomeAccess({ status: "granted" }), true);
        assert.equal(staffHasHomeAccess({ status: "pending" }), false);
        assert.equal(staffHasHomeAccess({ status: "none" }), false);
        assert.equal(staffHasHomeAccess(null), false);
    });
});

describe("homeViewAccess — parent sharing panel state", () => {
    test("no grants: master inactive, rows pass through, requests visible", () => {
        const state = {
            allStaff: { status: "none" },
            classrooms: [{ ...CLASSROOM_ROW, status: "none", grantId: null }],
            pendingRequests: [PENDING_REQUEST],
        };
        assert.equal(allStaffGrantActive(state), false);
        assert.equal(classroomGrantRows(state).length, 1);
        assert.deepEqual(visiblePendingRequests(state), [PENDING_REQUEST]);
    });

    test("per-classroom granted row keeps its grantId for revoke", () => {
        const state = { classrooms: [CLASSROOM_ROW] };
        const [row] = classroomGrantRows(state);
        assert.equal(row.status, "active");
        assert.equal(row.grantId, "g1");
    });

    test("active all-staff grant hides the pending request list", () => {
        const state = {
            allStaff: { status: "active" },
            classrooms: [CLASSROOM_ROW],
            pendingRequests: [PENDING_REQUEST],
        };
        assert.equal(allStaffGrantActive(state), true);
        assert.deepEqual(visiblePendingRequests(state), []);
    });

    test("approve flow: pending request disappears and grantee becomes granted", () => {
        // Panel state before the parent approves Mr. Chen's request…
        const before = {
            allStaff: { status: "none" },
            classrooms: [
                { ...CLASSROOM_ROW, leadTeacherId: "t2", leadTeacherName: "Mr. Chen", status: "pending", grantId: "g2" },
            ],
            pendingRequests: [PENDING_REQUEST],
        };
        assert.equal(visiblePendingRequests(before).length, 1);
        assert.equal(classroomGrantRows(before)[0].status, "pending");

        // …and after the refetch that follows grantHomeAccess({ grantId }).
        const after = {
            allStaff: { status: "none" },
            classrooms: [
                { ...CLASSROOM_ROW, leadTeacherId: "t2", leadTeacherName: "Mr. Chen", status: "active", grantId: "g2" },
            ],
            pendingRequests: [],
        };
        assert.deepEqual(visiblePendingRequests(after), []);
        assert.equal(classroomGrantRows(after)[0].status, "active");
    });

    test("missing or malformed state is safe", () => {
        assert.deepEqual(classroomGrantRows(null), []);
        assert.deepEqual(classroomGrantRows({}), []);
        assert.deepEqual(visiblePendingRequests(null), []);
        assert.deepEqual(visiblePendingRequests({}), []);
        assert.equal(allStaffGrantActive(null), false);
    });
});
