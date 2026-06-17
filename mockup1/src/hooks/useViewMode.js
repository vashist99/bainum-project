import { useCallback, useEffect, useState } from "react";

export const VIEW_MODE_TILES = "tiles";
export const VIEW_MODE_TABLE = "table";
export const VALID_MODES = new Set([VIEW_MODE_TILES, VIEW_MODE_TABLE]);

export const viewModeStorageKey = (pageKey) => `data-view-mode:${pageKey}`;

export function readPersistedViewMode(pageKey) {
    try {
        const raw = window.localStorage.getItem(viewModeStorageKey(pageKey));
        if (raw && VALID_MODES.has(raw)) return raw;
    } catch {
        // Private browsing / quota / SSR — fall through to default.
    }
    return VIEW_MODE_TILES;
}

export function writePersistedViewMode(pageKey, value) {
    try {
        window.localStorage.setItem(viewModeStorageKey(pageKey), value);
    } catch {
        // Best-effort: keep working for this session even if persistence fails.
    }
}

/**
 * Persistent view-mode toggle (`"tiles" | "table"`) keyed per page.
 *
 * - First visit (no localStorage value) → `"tiles"` (D4 in design.md).
 * - Subsequent visits restore the persisted value when valid.
 * - `localStorage` failures (private mode, quota) degrade gracefully:
 *   in-memory state still updates so the toggle works for the session.
 *
 * @param {string} pageKey identifier persisted in localStorage as
 *   `data-view-mode:<pageKey>` (e.g. `"children"`, `"teachers"`).
 * @returns {[string, (mode: string) => void]} `[viewMode, setViewMode]`
 */
export default function useViewMode(pageKey) {
    const [mode, setMode] = useState(() => readPersistedViewMode(pageKey));

    // Re-sync if the consumer ever swaps pageKey mid-component-lifecycle.
    // We treat the read as the source of truth here so two pages mounted
    // concurrently never share state by accident.
    useEffect(() => {
        setMode(readPersistedViewMode(pageKey));
    }, [pageKey]);

    const setViewMode = useCallback(
        (next) => {
            const normalized = VALID_MODES.has(next) ? next : VIEW_MODE_TILES;
            setMode(normalized);
            writePersistedViewMode(pageKey, normalized);
        },
        [pageKey]
    );

    return [mode, setViewMode];
}
