import { useCallback, useEffect, useMemo, useState } from "react";

export const SORT_ASC = "asc";
export const SORT_DESC = "desc";

export const sortStorageKey = (pageKey) => `data-sort:${pageKey}`;

export function readPersistedSort(pageKey) {
    try {
        const raw = window.localStorage.getItem(sortStorageKey(pageKey));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            typeof parsed.column === "string" &&
            (parsed.direction === SORT_ASC || parsed.direction === SORT_DESC)
        ) {
            return parsed;
        }
    } catch {
        // Bad JSON, quota, private mode — drop the value and start fresh.
    }
    return null;
}

export function writePersistedSort(pageKey, value) {
    try {
        if (value == null) {
            window.localStorage.removeItem(sortStorageKey(pageKey));
        } else {
            window.localStorage.setItem(
                sortStorageKey(pageKey),
                JSON.stringify(value)
            );
        }
    } catch {
        // Persistence is best-effort; sort still works in-memory.
    }
}

/**
 * Default comparator for primitives, with strings sorted case-insensitively
 * and nullish values pushed to the end of the *ascending* order (i.e. the
 * comparator always treats `null`/`undefined` as "after" any defined value;
 * descending order is achieved by negating the result, which keeps the
 * null-block at the *front* in descending — matches typical spreadsheet
 * behavior, where "blank rows" stay together at one end).
 */
export function defaultComparator(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}

/**
 * Pure cycle: asc → desc → cleared → asc. Returns the next state given
 * the previous state and the clicked column key. `null` means "cleared".
 *
 * Exposed for direct unit testing — the hook below threads this same
 * function through `setActiveSort`.
 */
export function nextSortState(prev, columnKey) {
    if (!prev || prev.column !== columnKey) {
        return { column: columnKey, direction: SORT_ASC };
    }
    if (prev.direction === SORT_ASC) {
        return { column: columnKey, direction: SORT_DESC };
    }
    return null;
}

/**
 * Pure sort: given `items` and an `activeSort` shape (or null) and the
 * column descriptor, returns a new array sorted stably. Exposed for unit
 * testing; the hook below memoizes around this exact behavior.
 */
export function sortItems(items, activeSort, column) {
    if (!activeSort || !column) return items;
    const get = column.getter || ((item) => item?.[column.key]);
    const cmp = column.compare || defaultComparator;
    const indexed = (items || []).map((item, i) => [item, i]);
    indexed.sort((a, b) => {
        const va = get(a[0]);
        const vb = get(b[0]);
        const c = cmp(va, vb);
        if (c !== 0) return activeSort.direction === SORT_ASC ? c : -c;
        return a[1] - b[1];
    });
    return indexed.map(([item]) => item);
}

/**
 * Persistent click-to-sort over an array of items.
 *
 * The `columns` array declares which keys may be sorted; each column has:
 *   - `key`     (string)  unique column id (persisted in localStorage)
 *   - `label`   (string)  optional display label (not used by the hook)
 *   - `getter`  (fn)      optional `(item) => sortable-value`. Defaults to
 *                         `item[column.key]`.
 *   - `compare` (fn)      optional `(a, b) => number`. Defaults to the
 *                         primitive comparator above.
 *   - `sortable`(bool)    optional; when explicitly `false` the column is
 *                         opted out of click-to-sort.
 *
 * Cycle on a single column: asc → desc → cleared → asc. Clicking a
 * different sortable column makes it the new active sort (ascending) and
 * the prior column loses its indicator.
 *
 * On mount, an unknown column key in storage is treated as "no sort" and
 * the storage entry is overwritten — guards against renames between
 * deploys (D5 / persisted-sort risk in design.md).
 *
 * @param {Array} items
 * @param {string} pageKey
 * @param {Array<{key:string, getter?:(item:any)=>any, compare?:(a:any,b:any)=>number, sortable?:boolean}>} columns
 * @returns {{
 *   sortedItems: Array,
 *   activeSort: { column: string, direction: "asc"|"desc" } | null,
 *   cycleSort: (columnKey: string) => void,
 *   ariaSortFor: (columnKey: string) => "ascending"|"descending"|"none"
 * }}
 */
export default function useSortableList(items, pageKey, columns) {
    const columnIndex = useMemo(() => {
        const map = new Map();
        for (const col of columns || []) {
            if (col?.key && col.sortable !== false) map.set(col.key, col);
        }
        return map;
    }, [columns]);

    const [activeSort, setActiveSort] = useState(() => {
        const persisted = readPersistedSort(pageKey);
        if (persisted && columnIndex.has(persisted.column)) return persisted;
        // Unknown column key → clear and rewrite storage so we don't keep
        // re-encountering the same orphan value on every mount.
        if (persisted) writePersistedSort(pageKey, null);
        return null;
    });

    // If the columns set narrows at runtime so the active key is no longer
    // sortable, clear cleanly rather than keeping a phantom indicator.
    useEffect(() => {
        if (activeSort && !columnIndex.has(activeSort.column)) {
            setActiveSort(null);
            writePersistedSort(pageKey, null);
        }
    }, [activeSort, columnIndex, pageKey]);

    const cycleSort = useCallback(
        (columnKey) => {
            const col = columnIndex.get(columnKey);
            if (!col) return; // not sortable
            setActiveSort((prev) => {
                const next = nextSortState(prev, columnKey);
                writePersistedSort(pageKey, next);
                return next;
            });
        },
        [columnIndex, pageKey]
    );

    const sortedItems = useMemo(() => {
        const col = activeSort ? columnIndex.get(activeSort.column) : null;
        return sortItems(items, activeSort, col);
    }, [items, activeSort, columnIndex]);

    const ariaSortFor = useCallback(
        (columnKey) => {
            if (!activeSort || activeSort.column !== columnKey) return "none";
            return activeSort.direction === SORT_ASC ? "ascending" : "descending";
        },
        [activeSort]
    );

    return { sortedItems, activeSort, cycleSort, ariaSortFor };
}
