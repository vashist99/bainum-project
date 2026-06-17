/**
 * Pure helpers used by `NotificationBell.jsx`. Split out so they can
 * be unit-tested without loading the component module (which pulls in
 * Vite-only `import.meta.env` via `lib/axios.js`).
 */

/**
 * Format an absolute date as a relative-to-now phrase.
 */
export function formatRelativeTime(date, now = Date.now()) {
    if (!date) return "";
    const parsed = new Date(date).getTime();
    if (Number.isNaN(parsed)) return "";
    const ms = now - parsed;
    if (ms < 60_000) return "just now";
    const min = Math.floor(ms / 60_000);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const days = Math.floor(hr / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Pick the in-app navigation target for a notification based on its
 * type. Returns null when no navigation should happen (e.g.
 * `classroom-added` without a `classroomId`).
 */
export function routeTargetForNotification(n) {
    if (!n) return null;
    if (n.type === "classroom-added" && n.classroomId) {
        return `/classrooms/${n.classroomId}`;
    }
    if (n.type === "classroom-removed") {
        return "/home";
    }
    if (n.type === "child-note-added" && n.childId) {
        return `/data/child/${n.childId}`;
    }
    if (n.type === "classroom-note-added" && n.classroomId) {
        return `/classrooms/${n.classroomId}`;
    }
    if (n.type === "classroom-recording-added" && n.classroomId) {
        return `/classrooms/${n.classroomId}`;
    }
    return null;
}
