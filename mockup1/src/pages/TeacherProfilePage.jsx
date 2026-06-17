import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { User, Mail, Building2, Mic, FileText, Download } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import TranscriptRecordCard from "../components/TranscriptRecordCard.jsx";
import { buildTranscriptsWorkbook } from "../utils/classroomExcel";

const TeacherProfilePage = () => {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("dotmatrix");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

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

  if (user?.username) return <Navigate to={`/teachers/${user.username}`} replace />;

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

  const handleDownloadXlsx = async () => {
    if (!transcriptsWithContent.length) return;
    setDownloadingXlsx(true);
    try {
      // Newest first — matches the on-screen ordering.
      const sorted = [...transcriptsWithContent].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const teacherName = teacher?.name || user?.name || "";
      const wb = buildTranscriptsWorkbook(teacherName || "Classroom Talk", sorted, {
        layout: "single-sheet",
      });
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      // Match the classroom export's sanitizer; fall back to the
      // historical filename when the teacher's name hasn't loaded yet.
      const safeName = teacherName
        ? teacherName.replace(/[^a-z0-9-_]+/gi, "_")
        : "my_classroom";
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_transcripts_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to build Excel file");
    } finally {
      setDownloadingXlsx(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
                <div className="stat-title">School</div>
                <div className="stat-value text-2xl">{teacher?.center || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>

        <LanguageDevelopmentCharts
          assessments={assessments}
          viewMode={viewMode}
          title="Language Development Analysis - Year Overview"
          contextSubtitle="At School"
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
                  type="button"
                  onClick={handleDownloadXlsx}
                  disabled={downloadingXlsx}
                  className="btn btn-primary btn-sm gap-2"
                  title="Download all transcripts and per-category word counts as an Excel file"
                >
                  {downloadingXlsx ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
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
              <div className="space-y-4 min-w-0">
                {[...transcriptsWithContent]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((assessment) => (
                    <TranscriptRecordCard
                      key={assessment._id}
                      id={String(assessment._id)}
                      date={assessment.date}
                      activity={assessment.activity}
                      activityContext={assessment.activityContext}
                      durationSeconds={assessment.durationSeconds}
                      wordCount={assessment.wordCount}
                      wordsPerMinute={assessment.wordsPerMinute}
                      categoryWPM={assessment.categoryWPM}
                      categoryWordCount={assessment.categoryWordCount}
                      transcript={assessment.transcript}
                      ragSegments={assessment.ragSegments}
                      onDelete={() => handleDeleteTeacherAssessment(assessment._id)}
                    />
                  ))}
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
    </AppLayout>
  );
};

export default TeacherProfilePage;
