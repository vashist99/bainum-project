import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    buildClassroomWorkbook,
    buildTranscriptsWorkbook,
} from "../../src/utils/classroomExcel.js";

// Two fixture recordings: one with a full per-category breakdown, one
// near-empty so we exercise the "missing field" fallbacks (these are the
// values most likely to show up against legacy assessments that predate
// the per-category word-count field).
const FIXTURE_RECORDINGS = [
    {
        id: "rec-1",
        date: "2026-03-15T12:00:00.000Z",
        uploadedBy: "Alice Admin",
        activity: "Circle time",
        durationSeconds: 125,
        transcript: "Hello world. Look at the dinosaur fossil.",
        wordCount: 120,
        wordsPerMinute: 57.6,
        categoryWPM: {
            science: 12.5,
            social: 8,
            literature: 4.2,
            language: 32.9,
        },
        categoryWordCount: {
            science: 26,
            social: 17,
            literature: 9,
            language: 68,
        },
    },
    {
        id: "rec-2",
        date: "2026-03-10T09:00:00.000Z",
        uploadedBy: "Bob Teacher",
        activity: null,
        durationSeconds: null,
        transcript: "",
        wordCount: null,
        wordsPerMinute: null,
        // categoryWPM / categoryWordCount intentionally missing.
    },
];

describe("buildClassroomWorkbook", () => {
    test("returns a workbook with exactly two named sheets", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const names = wb.worksheets.map((ws) => ws.name);
        assert.deepEqual(names, ["Recordings", "Transcripts"]);
    });

    test("Recordings sheet column order matches the spec", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Recordings");
        const headers = sheet.getRow(1).values.slice(1); // ExcelJS rows are 1-indexed
        assert.deepEqual(headers, [
            "Date",
            "Uploaded By",
            "Activity",
            "Audio Length",
            "Total Words",
            "Total WPM",
            "Science Words",
            "Science WPM",
            "Social-Emotional Words",
            "Social-Emotional WPM",
            "Literacy Words",
            "Literacy WPM",
            "Language Words",
            "Language WPM",
        ]);
    });

    test("Transcripts sheet column order matches the spec", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Transcripts");
        const headers = sheet.getRow(1).values.slice(1);
        assert.deepEqual(headers, [
            "Date",
            "Uploaded By",
            "Activity",
            "Transcript",
        ]);
    });

    test("emits one data row per recording on both sheets", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        // rowCount counts every defined row including the header.
        assert.equal(wb.getWorksheet("Recordings").rowCount, 1 + FIXTURE_RECORDINGS.length);
        assert.equal(wb.getWorksheet("Transcripts").rowCount, 1 + FIXTURE_RECORDINGS.length);
    });

    test("Date cells are real Date objects (not pre-formatted strings)", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Recordings");
        const dateCell = sheet.getCell("A2"); // first data row, Date column
        assert.ok(
            dateCell.value instanceof Date,
            `Expected Date instance, got ${typeof dateCell.value}`
        );
        assert.equal(
            dateCell.value.toISOString(),
            "2026-03-15T12:00:00.000Z"
        );
        // Format string lets Excel/Sheets re-sort / re-filter as dates.
        assert.equal(sheet.getColumn("date").numFmt, "mm/dd/yyyy");
    });

    test("per-category Words come from categoryWordCount, not categoryWPM", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Recordings");
        // Row 2 = fully populated fixture. Columns G,I,K,M are the per-category
        // word counts (G=Science Words, I=Social Words, K=Literacy, M=Language).
        assert.equal(sheet.getCell("G2").value, 26);
        assert.equal(sheet.getCell("I2").value, 17);
        assert.equal(sheet.getCell("K2").value, 9);
        assert.equal(sheet.getCell("M2").value, 68);
        // Adjacent WPM column must NOT receive the word count.
        assert.equal(sheet.getCell("H2").value, 12.5);
        assert.equal(sheet.getCell("J2").value, 8);
    });

    test("missing categoryWordCount/categoryWPM leaves cells blank instead of NaN", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Recordings");
        // Row 3 = sparse fixture.
        for (const col of ["E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3", "M3", "N3"]) {
            const v = sheet.getCell(col).value;
            // Empty string sentinel — never NaN / undefined.
            assert.ok(v === "" || v === null, `${col} should be blank, got ${v}`);
        }
    });

    test("audio length renders as m:ss derived from durationSeconds", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Recordings");
        // 125s → "2:05"
        assert.equal(sheet.getCell("D2").value, "2:05");
        // Missing duration → empty.
        assert.equal(sheet.getCell("D3").value, "");
    });

    test("Transcript column carries the raw transcript text", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const sheet = wb.getWorksheet("Transcripts");
        assert.equal(
            sheet.getCell("D2").value,
            "Hello world. Look at the dinosaur fossil."
        );
        assert.equal(sheet.getCell("D3").value, "");
    });

    test("handles an empty recordings array gracefully", async () => {
        const wb = buildClassroomWorkbook("Empty Room", []);
        assert.equal(wb.getWorksheet("Recordings").rowCount, 1); // header only
        assert.equal(wb.getWorksheet("Transcripts").rowCount, 1);
    });

    test("workbook can be serialized to an XLSX buffer", async () => {
        const wb = buildClassroomWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const buf = await wb.xlsx.writeBuffer();
        assert.ok(buf.byteLength > 0, "buffer should be non-empty");
        // XLSX is a ZIP file — first bytes are "PK\x03\x04".
        const view = new Uint8Array(buf);
        assert.equal(view[0], 0x50); // 'P'
        assert.equal(view[1], 0x4b); // 'K'
    });
});

// ─── single-sheet layout (Teacher-Profile export) ─────────────────────

const SINGLE_SHEET_FIXTURE = [
    {
        date: "2026-04-12T14:32:00.000Z",
        uploadedBy: "Alice Teacher",
        activity: "Circle time",
        activityContext: "school",
        durationSeconds: 305,
        transcript: "First line.\nSecond line with newline.",
        wordCount: 220,
        wordsPerMinute: 43.3,
        categoryWPM: {
            science: 10,
            social: 5.5,
            literature: 3,
            language: 24.8,
        },
        categoryWordCount: {
            science: 50,
            social: 28,
            literature: 15,
            language: 127,
        },
    },
    {
        date: "2026-04-05T10:00:00.000Z",
        uploadedBy: "Alice Teacher",
        activity: null,
        activityContext: null,
        durationSeconds: null,
        transcript: "",
        wordCount: null,
        wordsPerMinute: null,
    },
];

describe("buildTranscriptsWorkbook(single-sheet layout)", () => {
    test("returns a workbook with exactly one sheet named 'Transcripts'", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        assert.equal(wb.worksheets.length, 1);
        assert.equal(wb.worksheets[0].name, "Transcripts");
    });

    test("column order matches the spec (Date → … → Transcript)", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const headers = wb
            .getWorksheet("Transcripts")
            .getRow(1)
            .values.slice(1);
        assert.deepEqual(headers, [
            "Date",
            "Uploaded By",
            "Activity",
            "Activity Context",
            "Audio Length",
            "Total Words",
            "Total WPM",
            "Science Words",
            "Science WPM",
            "Social-Emotional Words",
            "Social-Emotional WPM",
            "Literacy Words",
            "Literacy WPM",
            "Language Words",
            "Language WPM",
            "Transcript",
        ]);
    });

    test("header row is bolded and the view is frozen at the header", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const sheet = wb.getWorksheet("Transcripts");
        assert.equal(sheet.getRow(1).font?.bold, true);
        assert.deepEqual(sheet.views, [{ state: "frozen", ySplit: 1 }]);
    });

    test("Date cells are real Date objects formatted mm/dd/yyyy", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const sheet = wb.getWorksheet("Transcripts");
        const dateCell = sheet.getCell("A2");
        assert.ok(
            dateCell.value instanceof Date,
            `Expected Date instance, got ${typeof dateCell.value}`
        );
        assert.equal(
            dateCell.value.toISOString(),
            "2026-04-12T14:32:00.000Z"
        );
        assert.equal(sheet.getColumn("date").numFmt, "mm/dd/yyyy");
    });

    test("Activity Context column is populated from the recording's activityContext", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const sheet = wb.getWorksheet("Transcripts");
        assert.equal(sheet.getCell("D2").value, "school");
        assert.equal(sheet.getCell("D3").value, ""); // missing → blank
    });

    test("Transcript column carries the full text including newlines", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const sheet = wb.getWorksheet("Transcripts");
        // Last column = column 16 (P).
        assert.equal(
            sheet.getCell("P2").value,
            "First line.\nSecond line with newline."
        );
        assert.equal(sheet.getCell("P3").value, ""); // missing → blank string
    });

    test("emits one data row per recording", () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        assert.equal(
            wb.getWorksheet("Transcripts").rowCount,
            1 + SINGLE_SHEET_FIXTURE.length
        );
    });

    test("default layout (no options) preserves the two-sheet classroom export", () => {
        // buildClassroomWorkbook is just a thin wrapper; this guards
        // against regressions in the default branch.
        const wb = buildTranscriptsWorkbook("Toddler Room", FIXTURE_RECORDINGS);
        const names = wb.worksheets.map((ws) => ws.name);
        assert.deepEqual(names, ["Recordings", "Transcripts"]);
    });

    test("empty recordings array produces a single header-only sheet", () => {
        const wb = buildTranscriptsWorkbook("Alice", [], {
            layout: "single-sheet",
        });
        assert.equal(wb.worksheets.length, 1);
        assert.equal(wb.getWorksheet("Transcripts").rowCount, 1);
    });

    test("single-sheet workbook serializes to a valid XLSX buffer", async () => {
        const wb = buildTranscriptsWorkbook("Alice", SINGLE_SHEET_FIXTURE, {
            layout: "single-sheet",
        });
        const buf = await wb.xlsx.writeBuffer();
        const view = new Uint8Array(buf);
        assert.equal(view[0], 0x50); // 'P'
        assert.equal(view[1], 0x4b); // 'K'
    });

    test("buildClassroomWorkbook is a thin alias of buildTranscriptsWorkbook(... two-sheet)", () => {
        const a = buildClassroomWorkbook("Room", FIXTURE_RECORDINGS);
        const b = buildTranscriptsWorkbook("Room", FIXTURE_RECORDINGS, {
            layout: "two-sheet",
        });
        // Same sheet names + same column counts is enough to assert
        // structural equivalence without serializing both workbooks.
        assert.deepEqual(
            a.worksheets.map((ws) => ws.name),
            b.worksheets.map((ws) => ws.name)
        );
        assert.equal(
            a.getWorksheet("Recordings").columns.length,
            b.getWorksheet("Recordings").columns.length
        );
    });
});
