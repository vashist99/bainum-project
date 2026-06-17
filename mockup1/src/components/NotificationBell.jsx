import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import axios from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import {
    formatRelativeTime,
    routeTargetForNotification,
} from "../utils/notifications";

/**
 * Bell icon with badge + dropdown listing the caller's in-app
 * notifications. Each row navigates somewhere based on `type`:
 *  - `classroom-added`   → /classrooms/<classroomId>
 *  - `classroom-removed` → /home (the user no longer has access to the
 *                          classroom page, so we can't link there)
 * The X button on every row hits DELETE /api/notifications/:id and
 * optimistically removes the row from the list.
 *
 * The list is refetched on mount and whenever the route changes, so
 * the badge reflects new notifications without a full page reload
 * after navigation.
 */

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const refetch = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get("/api/notifications");
            setNotifications(res.data?.notifications || []);
        } catch {
            // Silent: an unauth or transient failure shouldn't surface a
            // toast every time the user navigates. The bell just keeps
            // showing the last-known list.
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refetch();
    }, [refetch, location.pathname]);

    if (!user) return null;

    const count = notifications.length;

    const handleClick = (n) => {
        const target = routeTargetForNotification(n);
        if (target) navigate(target);
    };

    const handleDismiss = async (e, id) => {
        e.stopPropagation();
        const before = notifications;
        setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
        try {
            await axios.delete(`/api/notifications/${id}`);
        } catch {
            setNotifications(before);
        }
    };

    return (
        <div className="dropdown dropdown-end mr-2">
            <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-circle"
                aria-label="Notifications"
            >
                <div className="indicator">
                    <Bell className="w-5 h-5" />
                    {count > 0 && (
                        <span className="badge badge-xs badge-primary indicator-item">
                            {count > 9 ? "9+" : count}
                        </span>
                    )}
                </div>
            </button>
            <div
                tabIndex={0}
                className="dropdown-content mt-3 z-[1] shadow bg-base-100 rounded-box w-80 sm:w-96"
            >
                <div className="p-4">
                    <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                    {loading && count === 0 ? (
                        <div className="text-sm text-base-content/60 text-center py-4">
                            Loading…
                        </div>
                    ) : count === 0 ? (
                        <div className="text-sm text-base-content/60 text-center py-4">
                            No new notifications
                        </div>
                    ) : (
                        <ul className="space-y-1 max-h-80 overflow-y-auto">
                            {notifications.map((n) => (
                                <li key={String(n.id)}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleClick(n)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleClick(n);
                                            }
                                        }}
                                        className="group flex items-start gap-2 p-2 rounded hover:bg-base-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-base-content/50 mt-0.5">
                                                {formatRelativeTime(n.createdAt)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDismiss(e, n.id)}
                                            className="btn btn-ghost btn-xs btn-circle opacity-50 group-hover:opacity-100"
                                            aria-label="Dismiss notification"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
