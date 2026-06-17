import ExcelJS from "exceljs";

const TWO_SHEET = "two-sheet";
const SINGLE_SHEET = "single-sheet";

/**
 * Build an `ExcelJS.Workbook` of transcripts for *any* page that
 * exports them. Used by both `/classrooms/:id` (two-sheet default,
 * preserving the historical Classroom export layout) and
 * `/teacher-profile` (single-sheet — every metric and the transcript
 * text on one row per recording).
 *
 * Date cells are written as real `Date` values (not strings) and
 * formatted `mm/dd/yyyy` so users can re-sort/filter in Excel.
 *
 * @param {string} title - Workbook title (used as the sanitized
 *   filename root and the workbook's `title` metadata).
 * @param {Array} recordings - Items shaped by either
 *   `GET /api/classrooms/:id/transcripts` or
 *   `GET /api/assessments/teacher/:id` (the field sets overlap).
 * @param {{ layout?: "two-sheet" | "single-sheet" }} [options]
 *   Defaults to `"two-sheet"` for back-compat with the existing
 *   classroom export.
 * @returns {ExcelJS.Workbook}
 */
export function buildTranscriptsWorkbook(title, recordings, options = {}) {
    const layout = options.layout || TWO_SHEET;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Bainum Project";
    wb.created = new Date();
    const safeTitle = String(title || "Transcripts").trim() || "Transcripts";
    wb.title = `${safeTitle} transcripts`;

    if (layout === SINGLE_SHEET) {
        buildSingleSheet(wb, recordings);
    } else {
        buildTwoSheets(wb, recordings);
    }

    return wb;
}

/**
 * Back-compat alias for the original classroom-only helper. New
 * callers should prefer `buildTranscriptsWorkbook(title, recordings,
 * { layout: "two-sheet" })` for clarity.
 *
 * @deprecated Use `buildTranscriptsWorkbook` instead.
 */
export function buildClassroomWorkbook(classroomName, recordings) {
    return buildTranscriptsWorkbook(classroomName, recordings, {
        layout: TWO_SHEET,
    });
}

// ─── two-sheet layout ────────────────────────────────────────────────
function buildTwoSheets(wb, recordings) {
    const recordingsSheet = wb.addWorksheet("Recordings");
    recordingsSheet.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Uploaded By", key: "uploadedBy", width: 22 },
        { header: "Activity", key: "activity", width: 22 },
        { header: "Audio Length", key: "audioLength", width: 14 },
        { header: "Total Words", key: "totalWords", width: 12 },
        { header: "Total WPM", key: "totalWpm", width: 10 },
        { header: "Science Words", key: "scienceWords", width: 14 },
        { header: "Science WPM", key: "scienceWpm", width: 12 },
        { header: "Social-Emotional Words", key: "socialWords", width: 22 },
        { header: "Social-Emotional WPM", key: "socialWpm", width: 20 },
        { header: "Literacy Words", key: "literacyWords", width: 14 },
        { header: "Literacy WPM", key: "literacyWpm", width: 12 },
        { header: "Language Words", key: "languageWords", width: 14 },
        { header: "Language WPM", key: "languageWpm", width: 12 },
    ];

    const transcriptsSheet = wb.addWorksheet("Transcripts");
    transcriptsSheet.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Uploaded By", key: "uploadedBy", width: 22 },
        { header: "Activity", key: "activity", width: 22 },
        { header: "Transcript", key: "transcript", width: 80 },
    ];

    for (const rec of recordings || []) {
        const dateVal = parseDate(rec?.date);
        const audioLength = formatAudioLengthMaybe(rec?.durationSeconds);
        const cat = rec?.categoryWordCount || {};
        const wpm = rec?.categoryWPM || {};

        recordingsSheet.addRow({
            date: dateVal,
            uploadedBy: rec?.uploadedBy || "",
            activity: rec?.activity || "",
            audioLength,
            totalWords: numeric(rec?.wordCount),
            totalWpm: numeric(rec?.wordsPerMinute),
            scienceWords: numeric(cat?.science),
            scienceWpm: numeric(wpm?.science),
            socialWords: numeric(cat?.social),
            socialWpm: numeric(wpm?.social),
            literacyWords: numeric(cat?.literature),
            literacyWpm: numeric(wpm?.literature),
            languageWords: numeric(cat?.language),
            languageWpm: numeric(wpm?.language),
        });

        transcriptsSheet.addRow({
            date: dateVal,
            uploadedBy: rec?.uploadedBy || "",
            activity: rec?.activity || "",
            transcript: rec?.transcript || "",
        });
    }

    [recordingsSheet, transcriptsSheet].forEach((sheet) => {
        sheet.getColumn("date").numFmt = "mm/dd/yyyy";
        styleHeaderRow(sheet);
    });
}

// ─── single-sheet layout ─────────────────────────────────────────────
function buildSingleSheet(wb, recordings) {
    const sheet = wb.addWorksheet("Transcripts");
    sheet.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Uploaded By", key: "uploadedBy", width: 22 },
        { header: "Activity", key: "activity", width: 22 },
        { header: "Activity Context", key: "activityContext", width: 16 },
        { header: "Audio Length", key: "audioLength", width: 14 },
        { header: "Total Words", key: "totalWords", width: 12 },
        { header: "Total WPM", key: "totalWpm", width: 10 },
        { header: "Science Words", key: "scienceWords", width: 14 },
        { header: "Science WPM", key: "scienceWpm", width: 12 },
        { header: "Social-Emotional Words", key: "socialWords", width: 22 },
        { header: "Social-Emotional WPM", key: "socialWpm", width: 20 },
        { header: "Literacy Words", key: "literacyWords", width: 14 },
        { header: "Literacy WPM", key: "literacyWpm", width: 12 },
        { header: "Language Words", key: "languageWords", width: 14 },
        { header: "Language WPM", key: "languageWpm", width: 12 },
        { header: "Transcript", key: "transcript", width: 80 },
    ];

    for (const rec of recordings || []) {
        const dateVal = parseDate(rec?.date);
        const audioLength = formatAudioLengthMaybe(rec?.durationSeconds);
        const cat = rec?.categoryWordCount || {};
        const wpm = rec?.categoryWPM || {};

        sheet.addRow({
            date: dateVal,
            uploadedBy: rec?.uploadedBy || "",
            activity: rec?.activity || "",
            activityContext: rec?.activityContext || "",
            audioLength,
            totalWords: numeric(rec?.wordCount),
            totalWpm: numeric(rec?.wordsPerMinute),
            scienceWords: numeric(cat?.science),
            scienceWpm: numeric(wpm?.science),
            socialWords: numeric(cat?.social),
            socialWpm: numeric(wpm?.social),
            literacyWords: numeric(cat?.literature),
            literacyWpm: numeric(wpm?.literature),
            languageWords: numeric(cat?.language),
            languageWpm: numeric(wpm?.language),
            transcript: rec?.transcript || "",
        });
    }

    sheet.getColumn("date").numFmt = "mm/dd/yyyy";
    styleHeaderRow(sheet);
    // Freeze the header row so scrolling the transcript column keeps
    // the column labels visible — only relevant for single-sheet,
    // where the transcript is on the same sheet as the metrics.
    sheet.views = [{ state: "frozen", ySplit: 1 }];
}

// ─── shared helpers ──────────────────────────────────────────────────
function parseDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function styleHeaderRow(sheet) {
    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: "middle" };
}

function numeric(value) {
    if (value == null) return "";
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    return value;
}

function formatAudioLengthMaybe(seconds) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "";
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}
