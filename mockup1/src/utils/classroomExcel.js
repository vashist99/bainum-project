import ExcelJS from "exceljs";

/**
 * Build an ExcelJS.Workbook for a classroom's transcripts. Two sheets:
 *  - "Recordings": one row per recording with per-category WPM, per-category
 *    word counts, total WPM, total word count, audio length, activity, etc.
 *  - "Transcripts": one row per recording with the full transcript text.
 *
 * Date cells are written as real Date values (not strings) and formatted
 * mm/dd/yyyy so users can re-sort/filter in Excel.
 *
 * @param {string} classroomName
 * @param {Array} recordings  Items shaped by GET /api/classrooms/:id/transcripts
 * @returns {ExcelJS.Workbook}
 */
export function buildClassroomWorkbook(classroomName, recordings) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Bainum Project";
    wb.created = new Date();

    const safeName = String(classroomName || "Classroom").trim() || "Classroom";

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
        const dateVal = rec?.date ? new Date(rec.date) : null;
        const audioLength =
            typeof rec?.durationSeconds === "number"
                ? formatAudioLength(rec.durationSeconds)
                : "";

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

    // Apply date formatting + header styling on both sheets.
    [recordingsSheet, transcriptsSheet].forEach((sheet) => {
        sheet.getColumn("date").numFmt = "mm/dd/yyyy";
        const header = sheet.getRow(1);
        header.font = { bold: true };
        header.alignment = { vertical: "middle" };
    });

    // First-cell metadata so the file is self-documenting if someone opens
    // it without context — captured in worksheet properties rather than a
    // data row to keep the rectangular data clean.
    wb.title = `${safeName} transcripts`;

    return wb;
}

function numeric(value) {
    if (value == null) return "";
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    return value;
}

function formatAudioLength(seconds) {
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}
