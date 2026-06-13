import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ClassroomInviteModal from "../components/ClassroomInviteModal";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import { School, User, Users, Building2, UserPlus, Mic, ShieldAlert } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const CATEGORIES = ["science", "social", "literature", "language"];

const ClassroomHomePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [cohortStats, setCohortStats] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewMode, setViewMode] = useState("dotmatrix"); // "dotmatrix" or "semicircular"

  const fetchClassroom = useCallback(async () => {
    try {
      const response = await axios.get(`/api/classrooms/${id}`);
      setClassroom(response.data.classroom || null);
      setAccessDenied(false);
    } catch (error) {
      if (error.response?.status === 403) {
        setAccessDenied(true);
      } else if (error.response?.status === 404) {
        toast.error("Classroom not found");
        navigate("/home");
      } else {
        toast.error("Failed to load classroom");
      }
    }
  }, [id, navigate]);

  const fetchAssessments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/classrooms/${id}/assessments`);
      setAssessments(response.data.assessments || []);
      setCohortStats(response.data.cohortStats || null);
    } catch {
      setAssessments([]);
      setCohortStats(null);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClassroom(), fetchAssessments()]).finally(() => setLoading(false));
  }, [fetchClassroom, fetchAssessments]);

  const refreshMembership = () => {
    fetchClassroom();
    fetchAssessments();
  };

  // Dot matrix shows the SUM of per-category WPM across the classroom's
  // children for each month. LanguageDevelopmentCharts averages the rows it
  // receives per month, so we pre-sum into one synthetic row per month
  // (average of a single row = the sum). Dials get the raw assessments
  // (averaged across children) with classroom-scoped threshold markers.
  const summedMonthlyRows = useMemo(() => {
    const sums = {};
    assessments.forEach((a) => {
      if (!a?.date) return;
      const date = new Date(a.date);
      if (isNaN(date.getTime())) return;
      const month = date.getMonth();
      CATEGORIES.forEach((cat) => {
        const v = a.categoryWPM?.[cat];
        if (v != null && !isNaN(v)) {
          if (!sums[month]) sums[month] = {};
          sums[month][cat] = (sums[month][cat] || 0) + v;
        }
      });
    });
    const year = new Date().getFullYear();
    return Object.entries(sums).map(([month, categoryWPM]) => ({
      date: new Date(year, Number(month), 15).toISOString(),
      categoryWPM,
    }));
  }, [assessments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="bg-error/10 p-4 rounded-full w-fit mx-auto mb-2">
              <ShieldAlert className="w-8 h-8 text-error" />
            </div>
            <h2 className="card-title justify-center text-2xl mb-2">Access Denied</h2>
            <p className="text-base-content/70 mb-4">
              Only the classroom's lead teacher, assistant teacher, and admins can view this classroom.
            </p>
            <div className="card-actions justify-center">
              <a href="/home" className="btn btn-primary">Go Home</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) return null;

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    ...(isAdmin() ? [{ label: "Classrooms", href: "/classrooms" }] : []),
    { label: classroom.name, href: `/classrooms/${id}` }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
          <div className="p-4 sm:p-6">
            {/* Header: classroom name with center + teachers below */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
              <div className="flex items-start gap-4 min-w-0">
                <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shrink-0">
                  <School className="w-8 h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-base-content break-words">
                    {classroom.name}
                  </h1>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{classroom.center}</span>
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="truncate">{classroom.teacher?.name || "—"}</span>
                    </span>
                    {classroom.assistantTeacher?.name && (
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="truncate">Assistant: {classroom.assistantTeacher.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn btn-outline btn-primary gap-2 w-full sm:w-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
                <button
                  onClick={() => setShowRecordModal(true)}
                  className="btn btn-primary gap-2 w-full sm:w-auto"
                >
                  <Mic className="w-4 h-4" />
                  Record
                </button>
              </div>
            </div>

            {/* Children list: members added via parents who accepted the classroom invite */}
            <div className="card bg-base-100 shadow border border-base-200 mb-6 max-w-3xl">
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Children in this classroom
                  </h2>
                  <span className="badge badge-primary badge-outline">
                    {classroom.children?.length ?? 0}
                  </span>
                </div>
                {classroom.children?.length > 0 ? (
                  <ul className="divide-y divide-base-200">
                    {classroom.children.map((child) => {
                      const parentNames = (classroom.parents || [])
                        .filter((p) => (p.childIds || []).includes(String(child.id)))
                        .map((p) => p.name);
                      return (
                        <li
                          key={child.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3"
                        >
                          <span className="font-medium truncate">{child.name}</span>
                          <span className="text-sm text-base-content/60 truncate">
                            {parentNames.length > 0
                              ? `Parent${parentNames.length === 1 ? "" : "s"}: ${parentNames.join(", ")}`
                              : "No classroom parent linked"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-base-content/60 mb-3">
                      No children yet — invite parents who accepted their invitation
                      to add their children to this classroom.
                    </p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Parents
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Aggregated visualizations */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold text-base-content">Classroom Language Analysis</h2>
              <select
                className="select select-bordered select-sm w-full sm:w-auto"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="dotmatrix">Dot Matrix</option>
                <option value="semicircular">Semicircular Dials</option>
              </select>
            </div>

            {assessments.length > 0 ? (
              <LanguageDevelopmentCharts
                assessments={viewMode === "dotmatrix" ? summedMonthlyRows : assessments}
                viewMode={viewMode}
                title={`Classroom Analysis ${viewMode === "dotmatrix" ? "- Year Overview" : ""}`}
                contextSubtitle={
                  viewMode === "dotmatrix"
                    ? `Total (summed) WPM per category across all ${classroom.children?.length ?? 0} children`
                    : `Average WPM per category across all ${classroom.children?.length ?? 0} children — markers use classroom averages`
                }
                dotMatrixSubtitle="Total WPM by month (summed across children)"
                cohortThresholdsByCategory={viewMode === "semicircular" ? cohortStats : null}
              />
            ) : (
              <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                <div className="card-body items-center text-center py-12">
                  <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <Mic className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="card-title">No recordings yet</h3>
                  <p className="text-base-content/70 max-w-md">
                    {classroom.children?.length > 0
                      ? "Record a classroom session to see aggregated language development data for every child in this classroom."
                      : "Invite parents to add their children to this classroom, then record a session to see aggregated data."}
                  </p>
                  <button
                    onClick={() => (classroom.children?.length > 0 ? setShowRecordModal(true) : setShowInviteModal(true))}
                    className="btn btn-primary gap-2 mt-3"
                  >
                    {classroom.children?.length > 0 ? (
                      <>
                        <Mic className="w-4 h-4" />
                        Record Session
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Invite Parents
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

      {/* Modals */}
      {showInviteModal && (
        <ClassroomInviteModal
          classroomId={id}
          onInvited={refreshMembership}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showRecordModal && (
        <ClassroomUploadModal
          isAdmin={isAdmin()}
          classroomId={id}
          preselectedTeacherId={isAdmin() ? classroom.teacher?.id : undefined}
          preselectedCenter={isAdmin() ? classroom.center : undefined}
          onSuccess={refreshMembership}
          onClose={() => setShowRecordModal(false)}
        />
      )}
    </AppLayout>
  );
};

export default ClassroomHomePage;
