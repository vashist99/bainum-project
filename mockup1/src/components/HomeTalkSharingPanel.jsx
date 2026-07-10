import { useState } from "react";
import { Share2, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { grantHomeAccess, revokeHomeAccess } from "../lib/homeAccessApi";
import {
    allStaffGrantActive,
    classroomGrantRows,
    visiblePendingRequests,
} from "../utils/homeViewAccess";

/**
 * Parent-only sharing controls for a child's home talk data: master
 * "all teachers and admins" grant, one row per enrolled classroom
 * (grants that classroom's current lead teacher), and pending staff
 * requests with approve actions.
 */
const HomeTalkSharingPanel = ({ childId, state, loading, onChanged }) => {
    const [busyKey, setBusyKey] = useState(null);

    const run = async (key, action, successMessage) => {
        setBusyKey(key);
        try {
            const result = await action();
            toast.success(result?.message || successMessage);
            await onChanged?.();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setBusyKey(null);
        }
    };

    const masterActive = allStaffGrantActive(state);
    const classrooms = classroomGrantRows(state);
    const pendingRequests = visiblePendingRequests(state);

    return (
        <div className="card bg-base-100 shadow-xl mb-6 border border-primary/20">
            <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Home Talk Sharing
                </h2>
                <p className="text-sm text-base-content/70">
                    Home recordings are private to your family. You control which educators can
                    view this data, and you can revoke access at any time.
                </p>

                {loading ? (
                    <div className="py-4 flex justify-center">
                        <span className="loading loading-spinner loading-md text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Master grant: every teacher and admin */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-base-200 rounded-lg mt-2">
                            <div>
                                <div className="font-semibold flex items-center gap-2">
                                    {masterActive ? (
                                        <ShieldCheck className="w-4 h-4 text-success" />
                                    ) : (
                                        <ShieldOff className="w-4 h-4 text-base-content/50" />
                                    )}
                                    All teachers and admins
                                </div>
                                <p className="text-xs text-base-content/60">
                                    {masterActive
                                        ? "Every teacher and admin can currently view this child's home talk data."
                                        : "Grant every teacher and admin access to this child's home talk data."}
                                </p>
                            </div>
                            {masterActive ? (
                                <button
                                    type="button"
                                    className="btn btn-outline btn-error btn-sm"
                                    disabled={busyKey !== null}
                                    onClick={() =>
                                        run("all-staff", () => revokeHomeAccess(childId, { scope: "all-staff" }), "Access revoked")
                                    }
                                >
                                    {busyKey === "all-staff" ? "Revoking…" : "Revoke access"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={busyKey !== null}
                                    onClick={() =>
                                        run("all-staff", () => grantHomeAccess(childId, { scope: "all-staff" }), "Access granted")
                                    }
                                >
                                    {busyKey === "all-staff" ? "Granting…" : "Grant access to all"}
                                </button>
                            )}
                        </div>

                        {/* Per-classroom lead teacher grants */}
                        {classrooms.length > 0 && (
                            <div className="mt-3">
                                <h3 className="font-semibold text-sm mb-2">Classroom lead teachers</h3>
                                <ul className="space-y-2">
                                    {classrooms.map((room) => {
                                        const key = `classroom-${room.classroomId}`;
                                        const granted = room.status === "active";
                                        return (
                                            <li
                                                key={room.classroomId}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-base-200 rounded-lg"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">{room.classroomName}</div>
                                                    <p className="text-xs text-base-content/60 truncate">
                                                        {room.leadTeacherName
                                                            ? `Lead teacher: ${room.leadTeacherName}`
                                                            : "No lead teacher assigned"}
                                                        {granted ? " — has home talk access" : ""}
                                                    </p>
                                                </div>
                                                {room.leadTeacherId &&
                                                    (granted ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline btn-error btn-sm"
                                                            disabled={busyKey !== null}
                                                            onClick={() =>
                                                                run(key, () => revokeHomeAccess(childId, { grantId: room.grantId }), "Access revoked")
                                                            }
                                                        >
                                                            {busyKey === key ? "Revoking…" : "Revoke access"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            disabled={busyKey !== null}
                                                            onClick={() =>
                                                                run(key, () => grantHomeAccess(childId, { classroomId: room.classroomId }), "Access granted")
                                                            }
                                                        >
                                                            {busyKey === key ? "Granting…" : "Grant access"}
                                                        </button>
                                                    ))}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* Pending staff requests */}
                        {pendingRequests.length > 0 && (
                            <div className="mt-3">
                                <h3 className="font-semibold text-sm mb-2">Access requests</h3>
                                <ul className="space-y-2">
                                    {pendingRequests.map((request) => {
                                        const key = `request-${request.grantId}`;
                                        return (
                                            <li
                                                key={request.grantId}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <UserCheck className="w-4 h-4 text-warning shrink-0" />
                                                    <span className="text-sm truncate">
                                                        <span className="font-medium">{request.granteeName}</span>{" "}
                                                        ({request.granteeRole}) requested access to home talk data
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={busyKey !== null}
                                                    onClick={() =>
                                                        run(key, () => grantHomeAccess(childId, { grantId: request.grantId }), "Access granted")
                                                    }
                                                >
                                                    {busyKey === key ? "Granting…" : "Grant access"}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HomeTalkSharingPanel;
