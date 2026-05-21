import { useEffect, useMemo, useRef, useState } from "react";
import { getActivityGroupsForRole } from "../utils/activities.js";
import {
  Mic,
  MicOff,
  Square,
  Upload,
  Calendar,
  FileText,
  Check,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import {
  highlightRAGSegments,
  getSegmentsForHighlighting,
} from "../utils/ragHighlightSegments.js";
import { RAGColorLegend } from "../utils/RAGColorLegend.jsx";
import { CUSTOM_ACTIVITY_VALUE } from "../utils/activities.js";

const PROCESSING_MESSAGES = [
  { text: "Uploading your audio file...", icon: "📤" },
  { text: "Sending to speech recognition service...", icon: "🎙️" },
  { text: "Transcribing speech to text... (This takes the longest!)", icon: "✍️" },
  { text: "Analyzing for science skills...", icon: "🔬" },
  { text: "Analyzing for social emotional skills...", icon: "💬" },
  { text: "Analyzing for literature skills...", icon: "📚" },
  { text: "Analyzing language development skills...", icon: "🧠" },
  { text: "Comparing against reference examples...", icon: "✨" },
  { text: "Almost there! Preparing your results...", icon: "🎯" },
];

const MAX_RECORDING_MS = 5 * 60 * 1000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function extensionForMime(mime) {
  if (!mime) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Modal for the "Record Activity" flow on the home page.
 * - role="parent": fans recording out to every child linked to the parent (context: home)
 * - role="teacher": fans recording out to every child where this teacher is lead (context: school)
 */
export default function ActivityRecordingModal({ role, onClose, onSuccess }) {
  const context = role === "teacher" ? "school" : "home";

  const [selectedActivityKey, setSelectedActivityKey] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [validatingActivity, setValidatingActivity] = useState(false);
  const [activityValidation, setActivityValidation] = useState(null); // { accepted, reason, normalized }

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioBlobMime, setAudioBlobMime] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [recordingDate, setRecordingDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [recording, setRecording] = useState(false);
  const [recorderError, setRecorderError] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const abortControllerRef = useRef(null);

  const [reviewState, setReviewState] = useState(null); // { transcript, assessment, targetChildren }

  const audioPreviewUrl = useMemo(() => {
    if (audioBlob) return URL.createObjectURL(audioBlob);
    if (audioFile) return URL.createObjectURL(audioFile);
    return null;
  }, [audioBlob, audioFile]);

  const activityGroups = useMemo(() => getActivityGroupsForRole(role), [role]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  useEffect(() => {
    if (!uploading) {
      setProcessingMessageIndex(0);
      return undefined;
    }
    const interval = setInterval(() => {
      setProcessingMessageIndex((p) => (p + 1) % PROCESSING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [uploading]);

  useEffect(() => {
    return () => {
      stopRecorderTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopRecorderTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const resolvedActivityText = () => {
    if (selectedActivityKey === CUSTOM_ACTIVITY_VALUE) {
      return customActivity.trim();
    }
    return selectedActivityKey;
  };

  const handleSelectActivity = (value) => {
    setSelectedActivityKey(value);
    setActivityValidation(null);
    if (value !== CUSTOM_ACTIVITY_VALUE) {
      setCustomActivity("");
    }
  };

  const handleValidateCustomActivity = async () => {
    const text = customActivity.trim();
    if (!text) {
      toast.error("Type a custom activity first");
      return;
    }
    setValidatingActivity(true);
    setActivityValidation(null);
    try {
      const res = await axios.post("/api/activities/validate", { activity: text });
      setActivityValidation(res.data);
      if (res.data?.accepted) {
        toast.success("Activity accepted");
      } else {
        toast.error(res.data?.reason || "Activity not accepted");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to validate activity";
      toast.error(msg);
      setActivityValidation({ accepted: false, reason: msg });
    } finally {
      setValidatingActivity(false);
    }
  };

  const handleStartRecording = async () => {
    setRecorderError("");
    if (typeof MediaRecorder === "undefined") {
      setRecorderError("Recording isn't supported in this browser. Try a recent Chrome / Safari, or upload an audio file instead.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecorderError(
        window.isSecureContext
          ? "Microphone access isn't available on this device. Upload an audio file instead."
          : "Microphone access requires HTTPS. Open this page over a secure (https://) URL or upload an audio file."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recorderChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(recorderChunksRef.current, { type });
        if (blob.size > MAX_FILE_BYTES) {
          toast.error("Recording exceeded 25MB; please record a shorter clip.");
        } else {
          setAudioBlob(blob);
          setAudioBlobMime(type);
          setAudioFile(null);
        }
        stopRecorderTracks();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setElapsedMs(0);
      const started = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - started;
        setElapsedMs(elapsed);
        if (elapsed >= MAX_RECORDING_MS) {
          handleStopRecording();
        }
      }, 250);
    } catch (error) {
      console.error("getUserMedia error:", error);
      stopRecorderTracks();
      setRecorderError(
        error?.name === "NotAllowedError"
          ? "Microphone access was denied. Allow access and try again."
          : "Couldn't start recording. Check your microphone."
      );
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      stopRecorderTracks();
    }
    setRecording(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File must be 25MB or smaller");
      return;
    }
    setAudioFile(file);
    setAudioBlob(null);
    setAudioBlobMime("");
  };

  const handleClearAudio = () => {
    setAudioBlob(null);
    setAudioBlobMime("");
    setAudioFile(null);
    setElapsedMs(0);
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (uploading) return;
    stopRecorderTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose?.();
  };

  const validateForUpload = () => {
    const activity = resolvedActivityText();
    if (!activity) {
      toast.error("Choose or enter an activity.");
      return false;
    }
    if (selectedActivityKey === CUSTOM_ACTIVITY_VALUE) {
      if (!activityValidation || !activityValidation.accepted) {
        toast.error("Custom activity must be validated before recording.");
        return false;
      }
    }
    if (!audioBlob && !audioFile) {
      toast.error("Record or upload an audio clip first.");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForUpload()) return;

    const activity =
      selectedActivityKey === CUSTOM_ACTIVITY_VALUE
        ? activityValidation?.normalized || customActivity.trim()
        : selectedActivityKey;

    const formData = new FormData();
    if (audioBlob) {
      const ext = extensionForMime(audioBlobMime);
      const file = new File([audioBlob], `activity-recording.${ext}`, {
        type: audioBlobMime || "audio/webm",
      });
      formData.append("audio", file);
    } else if (audioFile) {
      formData.append("audio", audioFile);
    }
    formData.append("activity", activity);
    formData.append("recordingDate", recordingDate);

    setUploading(true);
    abortControllerRef.current = new AbortController();
    try {
      const res = await axios.post("/api/whisper/activity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: abortControllerRef.current.signal,
      });
      setReviewState({
        transcript: res.data.transcript || "",
        assessment: { ...res.data.assessment, ragSegments: res.data.ragSegments || null },
        targetChildren: res.data.targetChildren || [],
      });
    } catch (error) {
      if (
        axios.isCancel?.(error) ||
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED"
      ) {
        toast.success("Processing cancelled");
      } else {
        const msg = error.response?.data?.message || "Failed to process audio";
        toast.error(msg);
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAccept = async () => {
    if (!reviewState?.assessment) return;
    try {
      const payload = { ...reviewState.assessment };
      const res = await axios.post("/api/assessments/activity/accept", payload);
      const count = res.data?.count ?? reviewState.targetChildren?.length ?? 0;
      toast.success(
        `Saved for ${count} child${count === 1 ? "" : "ren"}.`
      );
      onSuccess?.(res.data);
      onClose?.();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save activity recording";
      toast.error(msg);
    }
  };

  const handleReject = () => {
    setReviewState(null);
    toast("Recording discarded.", { icon: "↩️" });
  };

  // ---------- Review screen ----------
  if (reviewState) {
    const { transcript, assessment, targetChildren } = reviewState;
    const segments = getSegmentsForHighlighting(transcript, assessment?.ragSegments);
    return (
      <div className="modal modal-open">
        <div className="modal-backdrop bg-black/50" onClick={handleReject} aria-hidden="true" />
        <div className="modal-box max-w-3xl w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto relative z-[100] bg-base-100 p-4 sm:p-6">
          <h3 className="font-bold text-xl sm:text-2xl mb-2 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            Review Activity Recording
          </h3>
          <p className="text-sm text-base-content/70 mb-3 break-words">
            Activity: <strong>{assessment.activity}</strong>{" "}
            <span className="badge badge-sm badge-outline align-middle">
              {assessment.activityContext === "school" ? "At school" : "At home"}
            </span>
          </p>
          {Array.isArray(targetChildren) && targetChildren.length > 0 && (
            <div className="alert alert-info mb-3 text-sm items-start gap-2 py-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="break-words">
                Saved for {targetChildren.length}{" "}
                child{targetChildren.length === 1 ? "" : "ren"}:{" "}
                <strong>{targetChildren.map((c) => c.name).join(", ")}</strong>
              </span>
            </div>
          )}
          <div className="divider my-2" />
          <div className="mb-4">
            <label className="label py-1">
              <span className="label-text font-semibold">Transcribed Text</span>
            </label>
            <div className="bg-base-200 p-3 sm:p-4 rounded-lg border border-base-300 max-h-60 sm:max-h-72 overflow-y-auto">
              {segments.length > 0 ? (
                <>
                  <RAGColorLegend />
                  <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                    {highlightRAGSegments(transcript, segments)}
                  </p>
                </>
              ) : (
                <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                  {transcript || <em>(empty transcript)</em>}
                </p>
              )}
            </div>
          </div>
          {assessment && (
            <div className="mb-4">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  Results (WPM = classified words ÷ audio length)
                </span>
              </label>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4">
                <div className="mb-3 text-xs sm:text-sm text-base-content/70 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    <span className="font-medium">Audio length:</span>{" "}
                    {assessment.durationSeconds != null
                      ? `${Math.floor(assessment.durationSeconds / 60)} min ${Math.round(
                          assessment.durationSeconds % 60
                        )} sec`
                      : "—"}
                  </span>
                  {assessment.wordCount != null && (
                    <span>
                      <span className="font-medium">Total words:</span> {assessment.wordCount}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { key: "science", label: "Science", color: "text-blue-600" },
                    { key: "social", label: "Social", color: "text-green-600" },
                    { key: "literature", label: "Literature", color: "text-purple-600" },
                    { key: "language", label: "Language", color: "text-orange-600" },
                  ].map(({ key, label, color }) => {
                    const words = assessment.categoryWordCount?.[key] ?? 0;
                    const wpm = assessment.categoryWPM?.[key];
                    return (
                      <div
                        key={key}
                        className={`text-xs sm:text-sm ${color} border border-base-300 rounded p-2`}
                      >
                        <div className="font-medium">{label}</div>
                        <div>
                          {words} word{words !== 1 ? "s" : ""}
                        </div>
                        <div className="text-[10px] sm:text-xs opacity-80">
                          {wpm != null ? `${Math.round(wpm * 10) / 10} WPM` : "— WPM"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="alert alert-info mb-4 py-2 text-sm">
            <span>
              Review the transcript and per-category WPM. Accept to save for every linked child,
              or reject to discard.
            </span>
          </div>
          <div className="modal-action flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button onClick={handleReject} className="btn btn-ghost gap-2 w-full sm:w-auto">
              <X className="w-4 h-4" />
              Reject
            </button>
            <button onClick={handleAccept} className="btn btn-primary gap-2 w-full sm:w-auto">
              <Check className="w-4 h-4" />
              Accept &amp; Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Recording / upload screen ----------
  const customAccepted =
    selectedActivityKey === CUSTOM_ACTIVITY_VALUE && activityValidation?.accepted;
  const customRejected =
    selectedActivityKey === CUSTOM_ACTIVITY_VALUE &&
    activityValidation &&
    !activityValidation.accepted;

  const canUpload =
    !!resolvedActivityText() &&
    (selectedActivityKey !== CUSTOM_ACTIVITY_VALUE || customAccepted) &&
    (!!audioBlob || !!audioFile) &&
    !uploading;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <h3 className="font-bold text-xl sm:text-2xl mb-1 flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary shrink-0" />
          <span>Record Activity {role === "teacher" ? "(Classroom)" : "(Home)"}</span>
        </h3>
        <p className="text-sm text-base-content/70 mb-3">
          {role === "teacher"
            ? "Recording will be shared with every child you supervise as lead teacher."
            : "Recording will be shared with every child linked to your account."}
        </p>
        <div className="divider my-2" />

        {/* Activity picker */}
        <div className="form-control w-full mb-3">
          <label className="label py-1">
            <span className="label-text font-semibold">Activity</span>
            <span className="label-text-alt">
              {context === "school" ? "School context" : "Home context"}
            </span>
          </label>
          <select
            className="select select-bordered select-primary w-full text-base"
            value={selectedActivityKey}
            onChange={(e) => handleSelectActivity(e.target.value)}
            disabled={uploading}
          >
            <option value="">Select an activity...</option>
            {activityGroups.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.activities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM_ACTIVITY_VALUE}>
              + Add a custom activity (validated by AI)
            </option>
          </select>
        </div>

        {selectedActivityKey === CUSTOM_ACTIVITY_VALUE && (
          <div className="form-control w-full mb-3">
            <label className="label py-1">
              <span className="label-text font-semibold">Custom activity</span>
              <span className="label-text-alt">
                Must fit a {context === "school" ? "school" : "home"} setting
              </span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                className={`input input-bordered w-full sm:flex-1 text-base ${
                  customAccepted ? "input-success" : ""
                } ${customRejected ? "input-error" : ""}`}
                placeholder={
                  context === "school"
                    ? "e.g., Circle time, Story hour, Music & movement"
                    : "e.g., Bath time, Helping cook dinner, Bedtime story"
                }
                value={customActivity}
                onChange={(e) => {
                  setCustomActivity(e.target.value);
                  setActivityValidation(null);
                }}
                disabled={uploading || validatingActivity}
                maxLength={120}
                autoComplete="off"
                autoCapitalize="sentences"
              />
              <button
                type="button"
                className="btn btn-secondary gap-2 w-full sm:w-auto"
                onClick={handleValidateCustomActivity}
                disabled={!customActivity.trim() || validatingActivity || uploading}
              >
                {validatingActivity ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Validate
                  </>
                )}
              </button>
            </div>
            {activityValidation && (
              <div
                className={`mt-2 text-sm flex items-start gap-2 ${
                  activityValidation.accepted ? "text-success" : "text-error"
                }`}
              >
                {activityValidation.accepted ? (
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>
                  {activityValidation.reason}
                  {activityValidation.accepted && activityValidation.normalized && (
                    <>
                      {" "}
                      <em>(saved as “{activityValidation.normalized}”)</em>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recorder — when recording, a big visible banner; otherwise tap-friendly start/clear */}
        <div className="form-control w-full mb-3">
          <label className="label py-1">
            <span className="label-text font-semibold">Record audio</span>
            <span className="label-text-alt">Up to 5 min</span>
          </label>

          {recording ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-error/10 border border-error/40 rounded-xl p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
                </span>
                <span
                  className="font-mono text-2xl sm:text-xl font-semibold tabular-nums text-error"
                  aria-live="polite"
                >
                  {formatElapsed(elapsedMs)}
                </span>
                <span className="text-sm text-base-content/70 hidden xs:inline">
                  Recording…
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopRecording}
                className="btn btn-error gap-2 w-full sm:w-auto"
              >
                <Square className="w-4 h-4" />
                Stop recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleStartRecording}
                className="btn btn-primary btn-lg gap-2 w-full sm:w-auto"
                disabled={uploading}
              >
                <Mic className="w-5 h-5" />
                {audioBlob || audioFile ? "Record again" : "Start recording"}
              </button>
              {(audioBlob || audioFile) && (
                <button
                  type="button"
                  onClick={handleClearAudio}
                  className="btn btn-ghost gap-2 w-full sm:w-auto"
                  disabled={uploading}
                >
                  <MicOff className="w-4 h-4" />
                  Clear audio
                </button>
              )}
            </div>
          )}

          {recorderError && (
            <p className="text-error text-sm mt-2 flex items-start gap-1">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{recorderError}</span>
            </p>
          )}
        </div>

        {/* Or upload a file */}
        <div className="form-control w-full mb-3">
          <label className="label py-1">
            <span className="label-text font-semibold">…or upload an audio file</span>
            <span className="label-text-alt">Max 25 MB</span>
          </label>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.oga,.ogg"
            onChange={handleFileSelect}
            className="file-input file-input-bordered file-input-primary w-full text-base"
            disabled={uploading || recording}
          />
          {audioFile && (
            <p className="text-xs sm:text-sm text-success mt-2 break-words">
              ✓ Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {audioPreviewUrl && (
          <div className="mb-3">
            <audio
              src={audioPreviewUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full"
            />
          </div>
        )}

        <div className="form-control w-full mb-3">
          <label className="label py-1">
            <span className="label-text font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recording date
            </span>
          </label>
          <input
            type="date"
            value={recordingDate}
            onChange={(e) => setRecordingDate(e.target.value)}
            className="input input-bordered input-primary w-full text-base"
            min={`${new Date().getFullYear()}-01-01`}
            max={new Date().toISOString().split("T")[0]}
            disabled={uploading}
          />
        </div>

        {uploading && (
          <div className="mb-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4">
              <span className="loading loading-spinner loading-lg text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Processing your recording</p>
                <p className="text-sm flex items-start gap-2">
                  <span className="text-lg shrink-0">
                    {PROCESSING_MESSAGES[processingMessageIndex].icon}
                  </span>
                  <span>{PROCESSING_MESSAGES[processingMessageIndex].text}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="modal-action flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => (uploading ? handleCancelProcessing() : handleClose())}
            className="btn btn-ghost w-full sm:w-auto"
          >
            {uploading ? "Cancel processing" : "Cancel"}
          </button>
          <button
            onClick={handleUpload}
            className="btn btn-primary gap-2 w-full sm:w-auto"
            disabled={!canUpload}
          >
            {uploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Process &amp; Review
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
}
