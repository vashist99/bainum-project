import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildClassroomWorkbook } from "../../src/utils/classroomExcel.js";

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
