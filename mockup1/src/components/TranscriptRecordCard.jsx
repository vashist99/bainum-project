import { Calendar, Trash2 } from "lucide-react";
import {
    highlightRAGSegments,
    getSegmentsForHighlighting,
} from "../utils/ragHighlightSegments.js";
import { RAGColorLegend } from "../utils/RAGColorLegend.jsx";

/**
 * Per-recording card used by both `TeacherProfilePage` and
 * `ClassroomHomePage`. Purely presentational — no fetching, no auth.
 *
 * The Delete button is rendered iff `onDelete` is a function; the
 * caller owns the authorization decision and wires the right backend
 * endpoint. The component wraps the call in a `window.confirm(...)`
 * prompt matching the wording the Teacher-Profile already uses.
 *
 * All optional props degrade gracefully when missing — the card always
 * at least shows the date and the transcript body.
 *
 * @param {{
 *   id: string,
 *   date: string|Date,
 *   activity?: string,
 *   activityContext?: "home"|"school",
 *   uploadedBy?: string,
 *   attribution?: string|null,
 *   durationSeconds?: number,
 *   wordCount?: number,
 *   wordsPerMinute?: number,
 *   categoryWPM?: { science?: number, social?: number, literature?: number, language?: number },
 *   categoryWordCount?: { science?: number, social?: number, literature?: number, language?: number },
 *   transcript: string,
 *   ragSegments?: Array,
 *   onDelete?: () => void | Promise<void>,
 * }} props
 */
export default function TranscriptRecordCard({
    id,
    date,
    activity,
    activityContext,
    attribution,
    durationSeconds,
    wordCount,
    wordsPerMinute,
    categoryWPM,
    categoryWordCount,
    transcript,
    ragSegments,
    onDelete,
}) {
    const segments = getSegmentsForHighlighting(transcript, ragSegments);
    const hasRagHighlights = Array.isArray(segments) && segments.length > 0;

    const formattedDate = formatDate(date);

    const handleDelete = () => {
        if (typeof onDelete !== "function") return;
        if (
            !window.confirm(
                "Are you sure you want to delete this transcript? This will remove it from the dot matrix and dials, and recalculate thresholds."
            )
        ) {
            return;
        }
        onDelete();
    };

    return (
        <div
            key={id}
            data-testid="transcript-record-card"
            className="card bg-base-200 border border-base-300"
        >
            <div className="card-body p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{formattedDate}</span>
                            {activity && (
                                <span
                                    className="badge badge-outline badge-primary badge-sm font-normal"
                                    title={
                                        activityContext === "home"
                                            ? "Activity recorded at home"
                                            : "Activity recorded at school"
                                    }
                                >
                                    {activity}
                                </span>
                            )}
                            {attribution && (
                                <span
                                    className="badge badge-ghost badge-sm font-normal"
                                    title={attribution}
                                >
                                    {attribution}
                                </span>
                            )}
                        </h3>
                    </div>
                    {typeof onDelete === "function" && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn btn-ghost btn-sm btn-circle text-error"
                            title="Delete transcript"
                            aria-label="Delete transcript"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                    )}
                </div>

                <div className="bg-base-100 p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto mt-2">
                    {hasRagHighlights ? (
                        <>
                            <RAGColorLegend />
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {highlightRAGSegments(transcript, segments)}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {transcript}
                        </p>
                    )}
                </div>

                <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1 items-center">
                        {durationSeconds != null && (
                            <span className="text-xs text-base-content/60">
                                {Math.floor(durationSeconds / 60)} min{" "}
                                {Math.round(durationSeconds % 60)} sec
                            </span>
                        )}
                        {wordCount != null && (
                            <span className="badge badge-sm badge-ghost">
                                {wordCount} word{wordCount === 1 ? "" : "s"}
                            </span>
                        )}
                        {wordsPerMinute != null ? (
                            <span className="badge badge-sm badge-primary">
                                {Math.round(wordsPerMinute * 10) / 10} WPM
                            </span>
                        ) : (
                            <span className="badge badge-sm badge-ghost">WPM: N/A</span>
                        )}
                        {categoryWPM && (
                            <span
                                className="text-[10px] text-base-content/60 ml-1"
                                title={`Science: ${categoryWPM.science ?? "—"} | Social: ${categoryWPM.social ?? "—"} | Literature: ${categoryWPM.literature ?? "—"} | Language: ${categoryWPM.language ?? "—"}`}
                            >
                                Sci {categoryWPM.science ?? "—"} · Soc{" "}
                                {categoryWPM.social ?? "—"} · Lit{" "}
                                {categoryWPM.literature ?? "—"} · Lang{" "}
                                {categoryWPM.language ?? "—"}
                            </span>
                        )}
                    </div>
                    {categoryWordCount && (
                        <div className="flex flex-wrap gap-2 text-xs">
                            {CATEGORY_BADGE_DEFS.map(({ key, label, color }) => {
                                const words = categoryWordCount[key];
                                if (words == null) return null;
                                const wpm = categoryWPM?.[key];
                                return (
                                    <span
                                        key={key}
                                        className={`badge badge-sm ${color}`}
                                        data-testid={`category-badge-${key}`}
                                    >
                                        {label}: {words} word{words !== 1 ? "s" : ""}
                                        {wpm != null
                                            ? ` (${Math.round(wpm * 10) / 10} WPM)`
                                            : ""}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const CATEGORY_BADGE_DEFS = [
    { key: "science", label: "Science", color: "badge-info" },
    { key: "social", label: "Social", color: "badge-success" },
    { key: "literature", label: "Literature", color: "badge-secondary" },
    { key: "language", label: "Language", color: "badge-warning" },
];

function formatDate(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
