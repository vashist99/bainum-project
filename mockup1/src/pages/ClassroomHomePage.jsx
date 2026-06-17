import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ClassroomInviteModal from "../components/ClassroomInviteModal";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import {
  School,
  User,
  Users,
  Building2,
  UserPlus,
  Mic,
  ShieldAlert,
  Trash2,
  Download,
  FileText,
  X,
  Plus,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { buildClassroomWorkbook } from "../utils/classroomExcel";

const CATEGORIES = ["science", "social", "literature", "language"];

const ClassroomHomePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [cohortStats, setCohortStats] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewMode, setViewMode] = useState("dotmatrix"); // "dotmatrix" or "semicircular"
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [loadingTranscripts, setLoadingTranscripts] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  // §7b admin add child UI state
  const [eligibleChildren, setEligibleChildren] = useState([]);
  const [showAddChildPicker, setShowAddChildPicker] = useState(false);
  const [addingChildId, setAddingChildId] = useState("");
  const [pendingChildOpId, setPendingChildOpId] = useState(null);

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

  const fetchTranscripts = useCallback(async () => {
    setLoadingTranscripts(true);
    try {
      const response = await axios.get(`/api/classrooms/${id}/transcripts`);
      setTranscripts(response.data.recordings || []);
    } catch {
      setTranscripts([]);
    } finally {
      setLoadingTranscripts(false);
    }
  }, [id]);

  // Same-center children that are NOT yet in this classroom. Admin-only
  // ("Add child" affordance source).
  const fetchEligibleChildren = useCallback(async () => {
    if (!isAdmin() || !classroom) return;
    try {
      const response = await axios.get("/api/children");
      const all = response.data.children || [];
      const currentIds = new Set(
        (classroom.children || []).map((c) => String(c.id ?? c._id ?? c))
      );
      const sameCenter = all
        .filter(
          (c) =>
            String(c.center || "").trim().toLowerCase() ===
            String(classroom.center || "").trim().toLowerCase()
        )
        .filter((c) => !currentIds.has(String(c._id ?? c.id)));
      setEligibleChildren(sameCenter);
    } catch {
      setEligibleChildren([]);
    }
  }, [isAdmin, classroom]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClassroom(),
      fetchAssessments(),
      fetchTranscripts(),
    ]).finally(() => setLoading(false));
  }, [fetchClassroom, fetchAssessments, fetchTranscripts]);

  useEffect(() => {
    fetchEligibleChildren();
  }, [fetchEligibleChildren]);

  const refreshMembership = () => {
    fetchClassroom();
    fetchAssessments();
    fetchTranscripts();
  };

  const canDelete = (() => {
    if (!classroom || !user) return false;
    if (isAdmin()) return true;
    const leadId = String(classroom.teacher?.id ?? classroom.teacher ?? "");
    return user.role === "teacher" && leadId === String(user.id);
  })();

  const handleDeleteClassroom = async () => {
    setDeleting(true);
    try {
      const response = await axios.delete(`/api/classrooms/${id}`);
      const summary = response.data?.summary;
      const lines = [
        `Children unlinked: ${summary?.childrenUnlinked ?? 0}`,
        `Parents unlinked: ${summary?.parentsUnlinked ?? 0}`,
        `Recordings disassociated: ${
          (summary?.assessmentsDisassociated ?? 0) +
          (summary?.teacherAssessmentsDisassociated ?? 0)
        }`,
        `Pending invitations deleted: ${summary?.invitationsDeleted ?? 0}`,
      ];
      toast.success(`Classroom deleted. ${lines.join(" · ")}`, { duration: 6000 });
      navigate(isAdmin() ? "/classrooms" : "/home");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete classroom."
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddChild = async () => {
    if (!addingChildId) return;
    setPendingChildOpId(addingChildId);
    try {
      await axios.patch(`/api/classrooms/${id}/children`, {
        addChildId: addingChildId,
      });
      toast.success("Child enrolled in classroom");
      setAddingChildId("");
      setShowAddChildPicker(false);
      refreshMembership();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to enroll child."
      );
    } finally {
      setPendingChildOpId(null);
    }
  };

  const handleRemoveChild = async (childId, childName) => {
    if (
      !window.confirm(
        `Remove ${childName || "this child"} from ${classroom?.name || "the classroom"}? ` +
          "Past recordings stay on the child's data page; future classroom recordings will no longer include them."
      )
    ) {
      return;
    }
    setPendingChildOpId(childId);
    try {
      await axios.patch(`/api/classrooms/${id}/children`, {
        removeChildId: childId,
      });
      toast.success("Child removed from classroom");
      refreshMembership();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove child."
      );
    } finally {
      setPendingChildOpId(null);
    }
  };

  const handleDownloadExcel = async () => {
    if (!transcripts.length) return;
    setDownloadingExcel(true);
    try {
      const wb = buildClassroomWorkbook(classroom?.name || "Classroom", transcripts);
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      const safeName = (classroom?.name || "classroom").replace(/[^a-z0-9-_]+/gi, "_");
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
      setDownloadingExcel(false);
    }
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
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-outline btn-error gap-2 w-full sm:w-auto"
                    title="Delete classroom"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Classroom
                  </button>
                )}
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
                      const childId = String(child.id ?? child._id);
                      return (
                        <li
                          key={childId}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3"
                        >
                          <span className="font-medium truncate">{child.name}</span>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm text-base-content/60 truncate">
                              {parentNames.length > 0
                                ? `Parent${parentNames.length === 1 ? "" : "s"}: ${parentNames.join(", ")}`
                                : "No classroom parent linked"}
                            </span>
                            {isAdmin() && (
                              <button
                                onClick={() => handleRemoveChild(childId, child.name)}
                                disabled={pendingChildOpId === childId}
                                className="btn btn-xs btn-ghost text-error gap-1 shrink-0"
                                title="Remove from classroom"
                              >
                                {pendingChildOpId === childId ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                                Remove
                              </button>
                            )}
                          </div>
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

                {isAdmin() && (
                  <div className="mt-3 pt-3 border-t border-base-200">
                    {!showAddChildPicker ? (
                      <button
                        onClick={() => setShowAddChildPicker(true)}
                        className="btn btn-sm btn-outline btn-primary gap-2"
                        disabled={eligibleChildren.length === 0}
                        title={
                          eligibleChildren.length === 0
                            ? `No other children at ${classroom.center} available to enroll.`
                            : "Manually enroll a child in this classroom"
                        }
                      >
                        <Plus className="w-4 h-4" />
                        Add child to classroom
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <select
                          value={addingChildId}
                          onChange={(e) => setAddingChildId(e.target.value)}
                          className="select select-bordered select-sm flex-1 min-w-0"
                        >
                          <option value="">
                            Select a child from {classroom.center}…
                          </option>
                          {eligibleChildren.map((c) => (
                            <option key={c._id || c.id} value={c._id || c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddChild}
                            disabled={!addingChildId || !!pendingChildOpId}
                            className="btn btn-sm btn-primary"
                          >
                            {pendingChildOpId ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              "Add"
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddChildPicker(false);
                              setAddingChildId("");
                            }}
                            className="btn btn-sm btn-ghost"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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

            {/* Transcripts card — last 365 days of classroom recordings */}
            <div className="card bg-base-100 shadow border border-base-200 mt-8">
              <div className="card-body p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Transcripts
                    <span className="badge badge-ghost badge-sm font-normal">
                      Last 365 days
                    </span>
                  </h2>
                  <button
                    onClick={handleDownloadExcel}
                    disabled={
                      downloadingExcel ||
                      loadingTranscripts ||
                      transcripts.length === 0
                    }
                    className="btn btn-sm btn-primary gap-2 self-start sm:self-auto"
                    title={
                      transcripts.length === 0
                        ? "No transcripts to download yet"
                        : "Download all transcripts and per-category word counts as an Excel file"
                    }
                  >
                    {downloadingExcel ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download as Excel
                  </button>
                </div>

                {loadingTranscripts ? (
                  <div className="py-8 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md text-primary" />
                  </div>
                ) : transcripts.length === 0 ? (
                  <p className="text-sm text-base-content/60 py-4">
                    No transcripts available yet. Recordings from the last 365
                    days will appear here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Activity</th>
                          <th>Uploaded By</th>
                          <th className="text-right">Words</th>
                          <th className="text-right">WPM</th>
                          <th>Transcript</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transcripts.map((rec) => (
                          <tr key={rec.id}>
                            <td className="whitespace-nowrap">
                              {rec.date
                                ? new Date(rec.date).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap">
                              {rec.activity || "—"}
                            </td>
                            <td className="whitespace-nowrap">
                              {rec.uploadedBy || "—"}
                            </td>
                            <td className="text-right">
                              {rec.wordCount ?? "—"}
                            </td>
                            <td className="text-right">
                              {rec.wordsPerMinute != null
                                ? Math.round(rec.wordsPerMinute)
                                : "—"}
                            </td>
                            <td className="max-w-md">
                              {rec.transcript ? (
                                <details>
                                  <summary className="cursor-pointer text-primary text-sm">
                                    View transcript
                                  </summary>
                                  <div className="mt-2 text-sm whitespace-pre-wrap text-base-content/80 max-h-48 overflow-y-auto">
                                    {rec.transcript}
                                  </div>
                                </details>
                              ) : (
                                <span className="text-base-content/40">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
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

      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-error/10 p-2 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Delete classroom?</h3>
                <p className="text-sm text-base-content/70 mt-1">
                  This will permanently delete{" "}
                  <span className="font-semibold">{classroom.name}</span>.
                </p>
              </div>
            </div>

            <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1 mb-4 pl-1">
              <li>
                Children will be removed from this classroom but their data
                and individual transcripts are kept.
              </li>
              <li>
                Past recordings stay on each child's profile, but will no
                longer be linked to this classroom.
              </li>
              <li>
                Pending parent invitations to this classroom will be deleted.
              </li>
              <li>
                Teacher and assistant accounts are not affected.
              </li>
            </ul>

            <p className="text-sm font-semibold text-error mb-4">
              This action cannot be undone.
            </p>

            <div className="modal-action mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClassroom}
                disabled={deleting}
                className="btn btn-error gap-2"
              >
                {deleting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Yes, delete classroom
              </button>
            </div>
          </div>
          <button
            className="modal-backdrop"
            aria-label="Close"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
        </div>
      )}
    </AppLayout>
  );
};

export default ClassroomHomePage;
