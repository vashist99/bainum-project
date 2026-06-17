import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// node:test runs in bare Node. We provide a minimal `localStorage` shim
// on `globalThis.window` so the hooks' pure storage helpers can be
// tested without jsdom. The shim can also be configured to throw on
// write so we cover the private-browsing / quota-exhaustion path.
function makeLocalStorageShim({ failOnWrite = false } = {}) {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            if (failOnWrite) throw new Error("QuotaExceededError");
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        },
        clear() {
            store.clear();
        },
        _peek: store,
    };
}

let originalWindow;
let storage;

beforeEach(() => {
    originalWindow = globalThis.window;
    storage = makeLocalStorageShim();
    globalThis.window = { localStorage: storage };
});

afterEach(() => {
    globalThis.window = originalWindow;
});

// All hook internals worth testing are exported as pure functions:
//   useViewMode.js         → readPersistedViewMode / writePersistedViewMode /
//                            viewModeStorageKey / VIEW_MODE_TILES /
//                            VIEW_MODE_TABLE / VALID_MODES
//   useSortableList.js     → readPersistedSort / writePersistedSort /
//                            sortStorageKey / defaultComparator /
//                            nextSortState / sortItems / SORT_ASC / SORT_DESC
// We import them once at the top so each test sees fresh storage (set by
// the beforeEach shim) but the modules themselves are loaded only once.
const {
    readPersistedViewMode,
    writePersistedViewMode,
    viewModeStorageKey,
    VIEW_MODE_TILES,
    VIEW_MODE_TABLE,
} = await import("../../src/hooks/useViewMode.js");

const {
    readPersistedSort,
    writePersistedSort,
    sortStorageKey,
    defaultComparator,
    nextSortState,
    sortItems,
    SORT_ASC,
    SORT_DESC,
} = await import("../../src/hooks/useSortableList.js");

// ─────────────────────────────────────────────────────────────────────────
// useViewMode — storage round-trip + degradation contracts
// ─────────────────────────────────────────────────────────────────────────

describe("useViewMode storage helpers", () => {
    test("storage key includes the pageKey so two pages don't collide", () => {
        assert.equal(viewModeStorageKey("children"), "data-view-mode:children");
        assert.equal(viewModeStorageKey("teachers"), "data-view-mode:teachers");
    });

    test("first read with no persisted value falls back to 'tiles' (default)", () => {
        assert.equal(readPersistedViewMode("children"), VIEW_MODE_TILES);
        assert.equal(readPersistedViewMode("teachers"), VIEW_MODE_TILES);
    });

    test("valid persisted 'table' survives round-trip", () => {
        writePersistedViewMode("children", VIEW_MODE_TABLE);
        assert.equal(storage.getItem("data-view-mode:children"), "table");
        assert.equal(readPersistedViewMode("children"), VIEW_MODE_TABLE);
    });

    test("each pageKey persists independently", () => {
        writePersistedViewMode("children", VIEW_MODE_TABLE);
        writePersistedViewMode("teachers", VIEW_MODE_TILES);
        assert.equal(readPersistedViewMode("children"), VIEW_MODE_TABLE);
        assert.equal(readPersistedViewMode("teachers"), VIEW_MODE_TILES);
    });

    test("garbage persisted values are ignored and read returns the default", () => {
        storage.setItem("data-view-mode:children", "fnord");
        assert.equal(readPersistedViewMode("children"), VIEW_MODE_TILES);
    });

    test("write that throws (private mode / quota) is swallowed silently", () => {
        const failing = makeLocalStorageShim({ failOnWrite: true });
        globalThis.window = { localStorage: failing };
        assert.doesNotThrow(() =>
            writePersistedViewMode("children", VIEW_MODE_TABLE)
        );
    });

    test("read that throws is treated as default", () => {
        globalThis.window = {
            localStorage: {
                getItem() {
                    throw new Error("SecurityError: localStorage disabled");
                },
            },
        };
        assert.equal(readPersistedViewMode("children"), VIEW_MODE_TILES);
    });
});

// ─────────────────────────────────────────────────────────────────────────
// useSortableList — storage + cycle + sort engine
// ─────────────────────────────────────────────────────────────────────────

describe("useSortableList storage helpers", () => {
    test("storage key includes the pageKey so two pages don't collide", () => {
        assert.equal(sortStorageKey("children"), "data-sort:children");
        assert.equal(sortStorageKey("teachers"), "data-sort:teachers");
    });

    test("first read with no persisted value returns null (no sort)", () => {
        assert.equal(readPersistedSort("children"), null);
    });

    test("valid persisted shape survives round-trip", () => {
        writePersistedSort("children", { column: "name", direction: SORT_DESC });
        assert.deepEqual(readPersistedSort("children"), {
            column: "name",
            direction: SORT_DESC,
        });
    });

    test("writing null clears the persisted entry", () => {
        writePersistedSort("children", { column: "name", direction: SORT_ASC });
        writePersistedSort("children", null);
        assert.equal(storage.getItem("data-sort:children"), null);
        assert.equal(readPersistedSort("children"), null);
    });

    test("invalid JSON returns null without throwing", () => {
        storage.setItem("data-sort:children", "not-json");
        assert.equal(readPersistedSort("children"), null);
    });

    test("invalid shape (wrong direction) returns null without throwing", () => {
        storage.setItem(
            "data-sort:children",
            JSON.stringify({ column: "name", direction: "sideways" })
        );
        assert.equal(readPersistedSort("children"), null);
    });

    test("invalid shape (missing column) returns null without throwing", () => {
        storage.setItem(
            "data-sort:children",
            JSON.stringify({ direction: "asc" })
        );
        assert.equal(readPersistedSort("children"), null);
    });
});

describe("useSortableList cycle (nextSortState)", () => {
    test("clicking an unset column starts ascending", () => {
        assert.deepEqual(nextSortState(null, "name"), {
            column: "name",
            direction: SORT_ASC,
        });
    });

    test("clicking the same column toggles asc → desc", () => {
        assert.deepEqual(
            nextSortState({ column: "name", direction: SORT_ASC }, "name"),
            { column: "name", direction: SORT_DESC }
        );
    });

    test("a third click on the same column clears the sort", () => {
        assert.equal(
            nextSortState({ column: "name", direction: SORT_DESC }, "name"),
            null
        );
    });

    test("clicking a *different* column resets to ascending on the new one", () => {
        assert.deepEqual(
            nextSortState({ column: "name", direction: SORT_DESC }, "center"),
            { column: "center", direction: SORT_ASC }
        );
    });

    test("cycle is closed (asc → desc → null → asc when seeded)", () => {
        let s = null;
        s = nextSortState(s, "name");
        assert.equal(s.direction, SORT_ASC);
        s = nextSortState(s, "name");
        assert.equal(s.direction, SORT_DESC);
        s = nextSortState(s, "name");
        assert.equal(s, null);
        s = nextSortState(s, "name");
        assert.equal(s.direction, SORT_ASC);
    });
});

describe("useSortableList defaultComparator", () => {
    test("strings sort case-insensitively", () => {
        assert.ok(defaultComparator("alice", "Bob") < 0);
        assert.ok(defaultComparator("Bob", "alice") > 0);
        assert.equal(defaultComparator("Alice", "alice"), 0);
    });

    test("numbers sort numerically (not lexicographically)", () => {
        assert.ok(defaultComparator(2, 10) < 0); // 2 < 10
        assert.ok(defaultComparator(10, 2) > 0);
    });

    test("Date objects sort by timestamp", () => {
        const a = new Date("2024-01-01");
        const b = new Date("2026-01-01");
        assert.ok(defaultComparator(a, b) < 0);
        assert.ok(defaultComparator(b, a) > 0);
    });

    test("nullish values always sort to the *end* of ascending order", () => {
        assert.ok(defaultComparator(null, "alice") > 0);
        assert.ok(defaultComparator("alice", null) < 0);
        assert.ok(defaultComparator(undefined, 5) > 0);
        assert.ok(defaultComparator(5, undefined) < 0);
        assert.equal(defaultComparator(null, null), 0);
        assert.equal(defaultComparator(undefined, null), 0);
    });
});

describe("useSortableList sortItems (stable, getter, compare overrides)", () => {
    const items = [
        { name: "Bob", ageMonths: 36 },
        { name: "alice", ageMonths: 24 },
        { name: "Carol", ageMonths: 60 },
        { name: "Dave", ageMonths: 24 }, // same age as alice → stability check
    ];

    test("null activeSort returns the input untouched (no-sort)", () => {
        const result = sortItems(items, null, null);
        assert.deepEqual(
            result.map((i) => i.name),
            ["Bob", "alice", "Carol", "Dave"]
        );
    });

    test("ascending on 'name' with default key getter", () => {
        const col = { key: "name" };
        const result = sortItems(
            items,
            { column: "name", direction: SORT_ASC },
            col
        );
        assert.deepEqual(
            result.map((i) => i.name),
            ["alice", "Bob", "Carol", "Dave"]
        );
    });

    test("descending on 'name' reverses the order", () => {
        const col = { key: "name" };
        const result = sortItems(
            items,
            { column: "name", direction: SORT_DESC },
            col
        );
        assert.deepEqual(
            result.map((i) => i.name),
            ["Dave", "Carol", "Bob", "alice"]
        );
    });

    test("custom getter is used when provided (ageMonths from a different field)", () => {
        const col = { key: "age", getter: (item) => item.ageMonths };
        const result = sortItems(
            items,
            { column: "age", direction: SORT_ASC },
            col
        );
        assert.deepEqual(
            result.map((i) => i.ageMonths),
            [24, 24, 36, 60]
        );
    });

    test("ties preserve incoming order (stable sort)", () => {
        const col = { key: "age", getter: (item) => item.ageMonths };
        const asc = sortItems(
            items,
            { column: "age", direction: SORT_ASC },
            col
        );
        // alice (index 1) came before Dave (index 3) in source; same age → alice first.
        assert.deepEqual(
            asc.map((i) => i.name),
            ["alice", "Dave", "Bob", "Carol"]
        );
    });

    test("custom compare wins over the default", () => {
        // Sort by name length, ascending.
        const col = {
            key: "name",
            getter: (item) => item.name,
            compare: (a, b) => a.length - b.length,
        };
        const result = sortItems(
            items,
            { column: "name", direction: SORT_ASC },
            col
        );
        assert.deepEqual(
            result.map((i) => i.name),
            // "Bob"(3), "Dave"(4), "alice"(5), "Carol"(5) — stable on the tie
            ["Bob", "Dave", "alice", "Carol"]
        );
    });

    test("undefined column returns the input untouched (defensive)", () => {
        const result = sortItems(
            items,
            { column: "ghost", direction: SORT_ASC },
            null
        );
        assert.equal(result, items);
    });

    test("undefined items returns an empty array (defensive)", () => {
        const col = { key: "name" };
        const result = sortItems(
            undefined,
            { column: "name", direction: SORT_ASC },
            col
        );
        assert.deepEqual(result, []);
    });
});
