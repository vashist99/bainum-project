import { useState, useEffect } from "react";
import { Mic, Upload, Calendar, FileText, Check, X } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { highlightRAGSegments, getSegmentsForHighlighting } from "../utils/ragHighlightSegments.js";
import { RAGColorLegend } from "../utils/RAGColorLegend.jsx";

const PROCESSING_MESSAGES = [
  { text: "Uploading your audio file...", icon: "📤" },
  { text: "Sending to speech recognition service...", icon: "🎙️" },
  { text: "Transcribing speech to text... (This takes the longest!)", icon: "✍️" },
  { text: "Analyzing for science skills—looking for scientific vocabulary...", icon: "🔬" },
  { text: "Analyzing for social emotional skills—detecting communication patterns...", icon: "💬" },
  { text: "Analyzing for literature skills—finding storytelling elements...", icon: "📚" },
  { text: "Analyzing language development skills—checking vocabulary growth...", icon: "🧠" },
  { text: "Comparing against reference examples (AI-powered)...", icon: "✨" },
  { text: "Did you know? We track 50+ keywords in each category.", icon: "💡" },
  { text: "Almost there! Preparing your results...", icon: "🎯" },
];

export default function ClassroomUploadModal({ isAdmin, onSuccess, onClose }) {
  const [centers, setCenters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [recordingDate, setRecordingDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploading, setUploading] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState(null);
  const [pendingAssessment, setPendingAssessment] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      axios.get("/api/centers").then((res) => {
        setCenters(res.data.centers || []);
      }).catch(() => setCenters([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedCenter) {
      axios.get(`/api/centers/${encodeURIComponent(selectedCenter)}/teachers`).then((res) => {
        setTeachers(res.data.teachers || []);
        setSelectedTeacher("");
      }).catch(() => {
        setTeachers([]);
        setSelectedTeacher("");
      });
    } else {
      setTeachers([]);
      setSelectedTeacher("");
    }
  }, [isAdmin, selectedCenter]);

  useEffect(() => {
    if (!uploading) {
      setProcessingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setProcessingMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [uploading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size must be less than 25MB");
        return;
      }
      setAudioFile(file);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }
    if (isAdmin && !selectedTeacher) {
      toast.error("Please select a teacher");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("recordingDate", recordingDate);
      if (isAdmin) {
        formData.append("teacherId", selectedTeacher);
        formData.append("center", selectedCenter);
      }

      const response = await axios.post("/api/whisper/classroom", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.transcript !== undefined && response.data.assessment) {
        setPendingTranscript(response.data.transcript);
        setPendingAssessment({
          ...response.data.assessment,
          ragSegments: response.data.ragSegments || null,
        });
        setShowTranscriptModal(true);
        setAudioFile(null);
      } else {
        toast.error("No transcript received from server");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to process audio";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingAssessment) return;
    try {
      const payload = { ...pendingAssessment };
      if (payload.teacherId && typeof payload.teacherId !== "string") {
        payload.teacherId = payload.teacherId.toString?.() || payload.teacherId;
      }
      const response = await axios.post("/api/assessments/teacher/accept", payload);
      toast.success("Assessment saved successfully!");
      setShowTranscriptModal(false);
      setPendingTranscript(null);
      setPendingAssessment(null);
      const teacherId = response.data.assessment?.teacherId ?? pendingAssessment.teacherId;
      const id = typeof teacherId === "string" ? teacherId : teacherId?.toString?.() || teacherId;
      onSuccess?.(id);
      onClose?.();
    } catch (error) {
      const msg = error.response?.data?.message || "Error saving assessment";
      toast.error(msg);
    }
  };

  const handleReject = () => {
    setShowTranscriptModal(false);
    setPendingTranscript(null);
    setPendingAssessment(null);
    toast.error("Transcript rejected. The assessment was not saved.");
  };

  const handleClose = () => {
    if (!uploading) {
      setAudioFile(null);
      onClose?.();
    }
  };

  if (showTranscriptModal && pendingTranscript) {
    const segments = getSegmentsForHighlighting(pendingTranscript, pendingAssessment?.ragSegments);
    return (
      <div className="modal modal-open">
        <div className="modal-backdrop bg-black/50" onClick={handleReject} aria-hidden="true" />
        <div className="modal-box max-w-3xl relative z-[100] bg-base-100">
          <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Review Transcript
          </h3>
          <div className="divider" />
          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">Transcribed Text</span>
            </label>
            <div className="bg-base-200 p-4 rounded-lg border border-base-300 max-h-96 overflow-y-auto">
              {segments.length > 0 ? (
                <>
                  <RAGColorLegend />
                  <p className="text-base whitespace-pre-wrap leading-relaxed">
                    {highlightRAGSegments(pendingTranscript, segments)}
                  </p>
                </>
              ) : (
                <p className="text-base whitespace-pre-wrap leading-relaxed">{pendingTranscript}</p>
              )}
            </div>
          </div>
          {pendingAssessment && (
            <div className="mb-4">
              <label className="label">
                <span className="label-text font-semibold">Assessment Scores</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="stat bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
                  <div className="stat-title text-xs text-blue-800 dark:text-blue-300">Science skills</div>
                  <div className="stat-value text-lg text-blue-800 dark:text-blue-200">{pendingAssessment.scienceTalk || 0}%</div>
                </div>
                <div className="stat bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3">
                  <div className="stat-title text-xs text-green-800 dark:text-green-300">Social emotional skills</div>
                  <div className="stat-value text-lg text-green-800 dark:text-green-200">{pendingAssessment.socialTalk || 0}%</div>
                </div>
                <div className="stat bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3">
                  <div className="stat-title text-xs text-purple-800 dark:text-purple-300">Literature skills</div>
                  <div className="stat-value text-lg text-purple-800 dark:text-purple-200">{pendingAssessment.literatureTalk || 0}%</div>
                </div>
                <div className="stat bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3">
                  <div className="stat-title text-xs text-orange-800 dark:text-orange-300">Language development skills</div>
                  <div className="stat-value text-lg text-orange-800 dark:text-orange-200">{pendingAssessment.languageDevelopment || 0}%</div>
                </div>
              </div>
            </div>
          )}
          <div className="alert alert-info mb-4">
            <span className="text-sm">Please review the transcript above. Click Accept to save this assessment or Reject to cancel.</span>
          </div>
          <div className="modal-action">
            <button onClick={handleReject} className="btn btn-ghost gap-2">
              <X className="w-4 h-4" />
              Reject
            </button>
            <button onClick={handleAccept} className="btn btn-primary gap-2">
              <Check className="w-4 h-4" />
              Accept & Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Upload Classroom Recording
        </h3>
        <div className="divider" />

        {isAdmin && (
          <>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Center</span>
              </label>
              <select
                className="select select-bordered select-primary w-full"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                disabled={uploading}
              >
                <option value="">Select a center...</option>
                {centers.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Teacher</span>
              </label>
              <select
                className="select select-bordered select-primary w-full"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                disabled={uploading || !selectedCenter}
              >
                <option value="">Select a teacher...</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text font-semibold">Select Audio File</span>
            <span className="label-text-alt">Max size: 25MB</span>
          </label>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.oga,.ogg"
            onChange={handleFileSelect}
            className="file-input file-input-bordered file-input-primary w-full"
          />
          {audioFile && (
            <label className="label">
              <span className="label-text-alt text-success">
                ✓ Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </label>
          )}
        </div>

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recording Date
            </span>
          </label>
          <input
            type="date"
            value={recordingDate}
            onChange={(e) => setRecordingDate(e.target.value)}
            className="input input-bordered input-primary w-full"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {uploading && (
          <div className="mb-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-start gap-4 p-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <div className="flex-1">
                <p className="font-semibold mb-1">Processing your recording</p>
                <p className="text-sm flex items-center gap-2">
                  <span className="text-lg">{PROCESSING_MESSAGES[processingMessageIndex].icon}</span>
                  {PROCESSING_MESSAGES[processingMessageIndex].text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-ghost" disabled={uploading}>
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="btn btn-primary gap-2"
            disabled={!audioFile || uploading || (isAdmin && !selectedTeacher)}
          >
            {uploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
}
