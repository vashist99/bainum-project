import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import Navbar from "../components/Navbar";
import { User, Mail, Building2, Mic, FileText, Calendar, Download, Trash2 } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import { highlightRAGSegments, getSegmentsForHighlighting } from "../utils/ragHighlightSegments.js";
import { RAGColorLegend } from "../utils/RAGColorLegend.jsx";
import ClassroomUploadModal from "../components/ClassroomUploadModal";

const TeacherProfilePage = () => {
  const { user } = useAuth();
  if (user?.username) return <Navigate to={`/teachers/${user.username}`} replace />;
  const [teacher, setTeacher] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("dotmatrix");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [teacherRes, assessmentsRes, cohortRes] = await Promise.all([
          axios.get(`/api/teachers/${user.id}`).catch(() => ({ data: { teacher: null } })),
          axios.get(`/api/assessments/teacher/${user.id}`).catch(() => ({ data: { assessments: [] } })),
          axios.get(`/api/assessments/cohort-stats/teachers`).catch(() => ({ data: { cohortStats: null } })),
        ]);
        setTeacher(teacherRes.data?.teacher || null);
        setAssessments(assessmentsRes.data?.assessments || []);
        setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    axios.get(`/api/assessments/teacher/${user.id}`).then((res) => {
      setAssessments(res.data?.assessments || []);
    }).catch(() => {});
  };

  const handleDeleteTeacherAssessment = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this transcript? This will remove it from the dot matrix and dials, and recalculate thresholds.")) return;
    try {
      await axios.delete(`/api/assessments/teacher/${assessmentId}`);
      toast.success("Transcript deleted successfully");
      const [assessmentsRes, cohortRes] = await Promise.all([
        axios.get(`/api/assessments/teacher/${user.id}`),
        axios.get(`/api/assessments/cohort-stats/teachers`)
      ]);
      setAssessments(assessmentsRes.data?.assessments || []);
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transcript";
      toast.error(msg);
    }
  };

  const transcriptsWithContent = assessments.filter((a) => a.transcript?.trim());

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Classroom Talk Data
          </h1>
          <div className="flex items-center gap-3">
            <div className="form-control">
              <select
                className="select select-bordered select-primary"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="dotmatrix">Dot Matrix</option>
                <option value="semicircular">Semicircular Dials</option>
              </select>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary gap-2">
              <Mic className="w-5 h-5" />
              Upload Recording
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div className="stat-title">Name</div>
                <div className="stat-value text-2xl">{teacher?.name || user?.name || "N/A"}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-secondary">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="stat-title">Email</div>
                <div className="stat-value text-lg">{teacher?.email || user?.email || "N/A"}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-accent">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="stat-title">Center</div>
                <div className="stat-value text-2xl">{teacher?.center || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>

        <LanguageDevelopmentCharts
          assessments={assessments}
          viewMode={viewMode}
          title="Language Development Analysis - Year Overview"
          showWordScores
          cohortThresholdsByCategory={cohortThresholdsByCategory}
        />

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Transcripts
              </h2>
              {transcriptsWithContent.length > 0 && (
                <button
                  onClick={() => {
                    const text = transcriptsWithContent
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((a) => {
                        const dateStr = new Date(a.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return `=== Transcript from ${dateStr} ===\n${a.uploadedBy ? `Uploaded by: ${a.uploadedBy}\n` : ""}${a.transcript}\n\n`;
                      })
                      .join("\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `my_classroom_transcripts_${new Date().toISOString().split("T")[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("All transcripts downloaded");
                  }}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              )}
            </div>

            {transcriptsWithContent.length === 0 ? (
              <div className="alert alert-info">
                <FileText className="w-5 h-5" />
                <span>No transcripts yet. Upload a classroom recording to get started.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {transcriptsWithContent
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((assessment) => {
                    const segments = getSegmentsForHighlighting(assessment.transcript, assessment.ragSegments);
                    return (
                      <div key={assessment._id} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(assessment.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </h3>
                            <button
                              onClick={() => handleDeleteTeacherAssessment(assessment._id)}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Delete transcript"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="bg-base-100 p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto mt-2">
                            {segments.length > 0 ? (
                              <>
                                <RAGColorLegend />
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {highlightRAGSegments(assessment.transcript, segments)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{assessment.transcript}</p>
                            )}
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-1 items-center">
                              {assessment.durationSeconds != null && (
                                <span className="text-xs text-base-content/60">
                                  {Math.floor(assessment.durationSeconds / 60)} min {Math.round(assessment.durationSeconds % 60)} sec
                                </span>
                              )}
                              {assessment.wordsPerMinute != null ? (
                                <span className="badge badge-sm badge-primary">
                                  {Math.round(assessment.wordsPerMinute * 10) / 10} WPM
                                </span>
                              ) : (
                                <span className="badge badge-sm badge-ghost">WPM: N/A</span>
                              )}
                              {assessment.categoryWPM && (
                                <span className="text-[10px] text-base-content/60 ml-1" title={`Science: ${assessment.categoryWPM.science ?? '—'} | Social: ${assessment.categoryWPM.social ?? '—'} | Literature: ${assessment.categoryWPM.literature ?? '—'} | Language: ${assessment.categoryWPM.language ?? '—'}`}>
                                  Sci {assessment.categoryWPM.science ?? '—'} · Soc {assessment.categoryWPM.social ?? '—'} · Lit {assessment.categoryWPM.literature ?? '—'} · Lang {assessment.categoryWPM.language ?? '—'}
                                </span>
                              )}
                            </div>
                            {assessment.categoryWordCount && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {[
                                  { key: 'science', label: 'Science', color: 'badge-info' },
                                  { key: 'social', label: 'Social', color: 'badge-success' },
                                  { key: 'literature', label: 'Literature', color: 'badge-secondary' },
                                  { key: 'language', label: 'Language', color: 'badge-warning' }
                                ].map(({ key, label, color }) => {
                                  const words = assessment.categoryWordCount[key] ?? 0;
                                  const wpm = assessment.categoryWPM?.[key];
                                  return (
                                    <span key={key} className={`badge badge-sm ${color}`}>
                                      {label}: {words} word{words !== 1 ? 's' : ''}
                                      {wpm != null ? ` (${Math.round(wpm * 10) / 10} WPM)` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <ClassroomUploadModal
          isAdmin={false}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
};

export default TeacherProfilePage;
