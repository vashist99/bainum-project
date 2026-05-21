import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { ArrowLeft, User, Calendar, Languages, Stethoscope, Users, FileText, BookOpen, MessageCircle, Microscope, Brain, Plus, Trash2, Download, Mail } from "lucide-react";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId, parentHasAccessToChild } from "../utils/parentChildren.js";
import { highlightRAGSegments, getSegmentsForHighlighting } from "../utils/ragHighlightSegments.js";
import { RAGColorLegend } from "../utils/RAGColorLegend.jsx";

const ChildDataPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, isParent, isAdmin, isTeacher } = useAuth();
  const [child, setChild] = useState(null);
  const [parentChildren, setParentChildren] = useState([]);
  const [loadingParentChildren, setLoadingParentChildren] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [, setLatestAssessment] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);
  const [viewMode, setViewMode] = useState("dotmatrix"); // "dotmatrix" or "semicircular"
  const [teachers, setTeachers] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);
  /** Teacher must have parent-approved access; until then show invite UI */
  const [teacherAccessDenied, setTeacherAccessDenied] = useState(false);
  const [childPreview, setChildPreview] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  /** True when an invitation already exists for this child (teacher access-denied panel) */
  const [parentInviteAlreadySent, setParentInviteAlreadySent] = useState(false);

  useEffect(() => {
    if (!isParent()) return;
    let cancelled = false;
    const fetchParentChildren = async () => {
      try {
        setLoadingParentChildren(true);
        const response = await axios.get("/api/children");
        if (!cancelled) {
          setParentChildren(Array.isArray(response.data?.children) ? response.data.children : []);
        }
      } catch {
        if (!cancelled) setParentChildren([]);
      } finally {
        if (!cancelled) setLoadingParentChildren(false);
      }
    };
    fetchParentChildren();
    return () => {
      cancelled = true;
    };
  }, [isParent, user?.id]);

  useEffect(() => {
    if (!teacherAccessDenied || !childPreview?._id) {
      setParentInviteAlreadySent(false);
      return;
    }
    const cid = String(childPreview._id);
    axios
      .get("/api/invitations/list")
      .then((res) => {
        const has = (res.data?.invitations || []).some((inv) => {
          if (Array.isArray(inv.childIds) && inv.childIds.length) {
            return inv.childIds.some((id) => String(id) === cid);
          }
          return String(inv.childId) === cid;
        });
        setParentInviteAlreadySent(has);
      })
      .catch(() => setParentInviteAlreadySent(false));
  }, [teacherAccessDenied, childPreview]);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        setLoading(true);
        setTeacherAccessDenied(false);
        setChildPreview(null);
        const response = await axios.get(`/api/children/${childId}`);
        const childData = response.data.child;
        
        if (!childData) {
          console.error("No child data received from API");
          setChild(null);
          setLoading(false);
          return;
        }
        
        // If user is a parent, verify they have access to this child
        if (user?.role === 'parent') {
          const currentChildId = childData._id?.toString() || childData.id?.toString();
          if (!parentHasAccessToChild(user, currentChildId)) {
            toast.error("You don't have access to this child's data");
            const fallback = getPrimaryChildId(user);
            if (fallback) navigate(`/data/child/${fallback}`, { replace: true });
            return;
          }
        }
        
        setTeacherAccessDenied(false);
        setChildPreview(null);
        setChild(childData);
      } catch (error) {
        console.error("Error fetching child:", error);
        const errData = error.response?.data;
        if (error.response?.status === 403 && errData?.code === "TEACHER_ACCESS_DENIED" && errData?.child) {
          setTeacherAccessDenied(true);
          setChildPreview(errData.child);
          setChild(null);
          return;
        }
        if (error.response?.status === 403) {
          toast.error(errData?.message || "You don't have access to this child's data");
          if (user?.role === 'parent') {
            const fallback = getPrimaryChildId(user);
            if (fallback) navigate(`/data/child/${fallback}`, { replace: true });
          } else if (user?.role !== 'teacher') {
            navigate("/home");
          }
        }
        setChild(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [childId, user, navigate]);

  // Load notes from database
  useEffect(() => {
    const fetchNotes = async () => {
      if (teacherAccessDenied) return;
      if (childId) {
        try {
          const response = await axios.get(`/api/notes/child/${childId}`);
          setNotes(response.data.notes || []);
        } catch (error) {
          // Only log if it's not a 404 (which is expected if no notes exist)
          if (error.response?.status !== 404) {
          console.error("Error fetching notes:", error);
          }
          setNotes([]);
        }
      }
    };

    fetchNotes();
  }, [childId, teacherAccessDenied]);

  // Load latest assessment from database
  useEffect(() => {
    const fetchLatestAssessment = async () => {
      if (teacherAccessDenied) return;
      if (childId) {
        try {
          const response = await axios.get(`/api/assessments/child/${childId}/latest`);
          setLatestAssessment(response.data.assessment);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error("Error fetching assessment:", error);
          }
          setLatestAssessment(null);
        }
      }
    };

    fetchLatestAssessment();
  }, [childId, teacherAccessDenied]);

  // Load all assessments from database for aggregation
  useEffect(() => {
    const fetchAllAssessments = async () => {
      if (teacherAccessDenied) return;
      if (childId) {
        try {
          const response = await axios.get(`/api/assessments/child/${childId}`);
          setAllAssessments(response.data.assessments || []);
        } catch (error) {
          console.error("Error fetching all assessments:", error);
          setAllAssessments([]);
        }
      }
    };

    fetchAllAssessments();
  }, [childId, teacherAccessDenied]);

  // Load cohort WPM stats for children (used for semicircular dial zones)
  useEffect(() => {
    axios.get(`/api/assessments/cohort-stats/children`).then((res) => {
      setCohortThresholdsByCategory(res.data?.cohortStats || null);
    }).catch(() => setCohortThresholdsByCategory(null));
  }, []);

  // Load teachers and all children (for admin/teacher views)
  useEffect(() => {
    const fetchTeachersAndChildren = async () => {
      if (isAdmin() || isTeacher()) {
        try {
          setLoadingTeachers(true);
          // Fetch teachers
          const teachersResponse = await axios.get("/api/teachers");
          setTeachers(teachersResponse.data.teachers || []);
          
          // Fetch all children
          const childrenResponse = await axios.get("/api/children");
          setAllChildren(childrenResponse.data.children || []);
        } catch (error) {
          console.error("Error fetching teachers/children:", error);
          setTeachers([]);
          setAllChildren([]);
        } finally {
          setLoadingTeachers(false);
        }
      }
    };

    fetchTeachersAndChildren();
  }, [isAdmin, isTeacher]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const noteData = {
        childId,
        content: newNote,
        author: user?.name || "Unknown User",
        authorId: user?.id
      };

      const response = await axios.post("/api/notes", noteData);
      
      // Add the new note to the list
      setNotes([response.data.note, ...notes]);
      setNewNote("");
      toast.success("Note added successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add note";
      toast.error(errorMessage);
      console.error("Error adding note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await axios.delete(`/api/notes/${noteId}`);
        setNotes(notes.filter(note => note._id !== noteId));
        toast.success("Note deleted successfully!");
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to delete note";
        toast.error(errorMessage);
        console.error("Error deleting note:", error);
      }
    }
  };

  const handleSendInviteToParent = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter the parent's email address");
      return;
    }
    const cid = childPreview?._id || childId;
    if (!cid) {
      toast.error("Missing child");
      return;
    }
    setSendingInvite(true);
    try {
      const response = await axios.post("/api/invitations/send", {
        email: inviteEmail.trim(),
        childId: cid,
      });
      if (response.data.warning || response.data.invitation?.invitationLink) {
        const link =
          response.data.invitation?.invitationLink ||
          response.data.invitationLink ||
          `${window.location.origin}/parent/register?token=${response.data.invitation?.token}`;
        toast.error("Invitation created but email may have failed. Copy the link if needed.", { duration: 8000 });
        navigator.clipboard.writeText(link).then(() => toast.success("Invitation link copied"));
      } else {
        toast.success("Invitation sent. The parent must register or accept before you can view this page.");
      }
      setParentInviteAlreadySent(true);
      setInviteEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDeleteChildAssessment = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this transcript? This will remove it from the dot matrix and dials, and recalculate thresholds.")) return;
    try {
      await axios.delete(`/api/assessments/child/${assessmentId}`);
      toast.success("Transcript deleted successfully");
      const [assessmentsRes, latestRes] = await Promise.all([
        axios.get(`/api/assessments/child/${childId}`),
        axios.get(`/api/assessments/child/${childId}/latest`).catch(() => ({ data: { assessment: null } }))
      ]);
      setAllAssessments(assessmentsRes.data.assessments || []);
      setLatestAssessment(latestRes.data?.assessment ?? null);
      const cohortRes = await axios.get(`/api/assessments/cohort-stats/children`);
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transcript";
      toast.error(msg);
    }
  };

  // Get language development data from latest assessment
  // Average words per minute across all assessments with duration data
  const averageWPM = useMemo(() => {
    const validWPM = (Array.isArray(allAssessments) ? allAssessments : [])
      .map((a) => a?.wordsPerMinute)
      .filter((w) => w != null && !isNaN(w));
    if (validWPM.length === 0) return null;
    return validWPM.reduce((s, w) => s + w, 0) / validWPM.length;
  }, [allAssessments]);

  // Average WPM per category (science, social, literature, language)
  const averageCategoryWPM = useMemo(() => {
    const cats = ['science', 'social', 'literature', 'language'];
    const result = {};
    cats.forEach((cat) => {
      const valid = (Array.isArray(allAssessments) ? allAssessments : [])
        .map((a) => a?.categoryWPM?.[cat])
        .filter((w) => w != null && !isNaN(w));
      result[cat] = valid.length > 0 ? valid.reduce((s, w) => s + w, 0) / valid.length : null;
    });
    return result;
  }, [allAssessments]);

  // Calculate age in months from date of birth
  const calculateAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Calculate difference in months
    const yearsDiff = today.getFullYear() - birthDate.getFullYear();
    const monthsDiff = today.getMonth() - birthDate.getMonth();
    
    const totalMonths = yearsDiff * 12 + monthsDiff;
    
    // If the day of month hasn't occurred yet this month, subtract one
    if (today.getDate() < birthDate.getDate()) {
      return Math.max(0, totalMonths - 1);
    }
    
    return totalMonths;
  };

  const ageInMonths = calculateAgeInMonths(child?.dateOfBirth);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (isTeacher() && teacherAccessDenied && childPreview) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-4 md:p-6 max-w-2xl">
          <button
            type="button"
            onClick={() => navigate("/data")}
            className="btn btn-ghost btn-circle mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl">Access needed: {childPreview.name}</h2>
              <p className="text-base-content/80">
                A parent must accept an invitation linked to this child before you can view their full data and
                assessments. Send an invitation to the parent&apos;s email below (same flow as the Data page).
              </p>
              <div className="form-control w-full mt-4">
                <label className="label"><span className="label-text">Parent email</span></label>
                {parentInviteAlreadySent ? (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-lg badge-ghost border border-base-300 px-4 py-3">
                      Invited
                    </span>
                    <span className="text-sm text-base-content/60">
                      An invitation was already sent for this child.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      className="input input-bordered flex-1"
                      placeholder="parent@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary gap-2"
                      disabled={sendingInvite}
                      onClick={handleSendInviteToParent}
                    >
                      <Mail className="w-4 h-4" />
                      {sendingInvite ? "Sending…" : "Send invitation"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="alert alert-warning">
            <span>Child not found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {user?.role !== 'parent' && (
            <button
              onClick={() => navigate("/data")}
              className="btn btn-ghost btn-circle flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            )}
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              {child?.name || 'Child'}'s Data
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {isParent() && (
              <div className="form-control">
                <label className="label py-0 pb-1">
                  <span className="label-text text-xs">Child</span>
                </label>
                <select
                  className="select select-bordered select-primary min-w-[180px]"
                  value={String(child?._id || childId || "")}
                  disabled={loadingParentChildren}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (nextId && String(nextId) !== String(childId)) {
                      navigate(`/data/child/${nextId}`);
                    }
                  }}
                >
                  {loadingParentChildren ? (
                    <option value={String(child?._id || childId || "")}>Loading children...</option>
                  ) : parentChildren.length > 0 ? (
                    parentChildren.map((pc) => (
                      <option key={pc._id || pc.id} value={String(pc._id || pc.id)}>
                        {pc.name}
                      </option>
                    ))
                  ) : (
                    <option value={String(child?._id || childId || "")}>
                      {child?.name || "Selected child"}
                    </option>
                  )}
                </select>
              </div>
            )}
            {/* View Mode Dropdown */}
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
          </div>
        </div>

        {/* Child Info Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div className="stat-title">Full Name</div>
                <div className="stat-value text-2xl">
                  {child?.name || 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-secondary">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="stat-title">Age</div>
                <div className="stat-value text-2xl">{ageInMonths} months</div>
                <div className="stat-desc text-xs text-base-content/60">
                  Born: {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-accent">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Gender</div>
                <div className="stat-value text-2xl">{child.gender}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-info">
                  <Languages className="w-8 h-8" />
                </div>
                <div className="stat-title">Primary Language</div>
                <div className="stat-value text-2xl">{child.primaryLanguage}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-warning">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="stat-title">Diagnosis</div>
                <div className="stat-value text-2xl">
                  <span
                    className={`badge ${
                      child.diagnosis === "Yes" ? "badge-warning" : "badge-success"
                    } badge-lg`}
                  >
                    {child.diagnosis}
                  </span>
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Teacher</div>
                {isAdmin() && teachers.length > 0 ? (
                  <div className="stat-value text-lg">
                    <select
                      className="select select-bordered select-primary w-full max-w-xs"
                      value={child.leadTeacher || ""}
                      onChange={async (e) => {
                        const newLeadTeacher = e.target.value;
                        if (newLeadTeacher && newLeadTeacher !== child.leadTeacher) {
                          try {
                            await axios.put(`/api/children/${childId}`, {
                              ...child,
                              leadTeacher: newLeadTeacher
                            });
                            toast.success("Lead teacher updated successfully");
                            // Reload child data
                            const response = await axios.get(`/api/children/${childId}`);
                            setChild(response.data.child);
                          } catch (error) {
                            toast.error("Failed to update lead teacher");
                            console.error("Error updating lead teacher:", error);
                          }
                        }
                      }}
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher.name}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="stat-value text-2xl">{child.leadTeacher}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Children Under Same Teacher - Admin/Teacher View */}
        {(isAdmin() || isTeacher()) && child?.leadTeacher && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Other Children Under {child.leadTeacher}
              </h2>
              <div className="divider"></div>
              {loadingTeachers ? (
                <div className="flex justify-center items-center h-32">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {allChildren.filter(c => c._id !== childId && c.leadTeacher === child.leadTeacher).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allChildren
                        .filter(c => c._id !== childId && c.leadTeacher === child.leadTeacher)
                        .map((otherChild) => (
                          <div
                            key={otherChild._id}
                            onClick={() => navigate(`/data/child/${otherChild._id}`)}
                            className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300 hover:border-primary"
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <h5 className="font-semibold text-sm">{otherChild.name}</h5>
                              </div>
                              <div className="text-xs text-base-content/60 mt-2">
                                {otherChild.dateOfBirth && (
                                  <p>Age: {(() => {
                                    const birthDate = new Date(otherChild.dateOfBirth);
                                    const today = new Date();
                                    const yearsDiff = today.getFullYear() - birthDate.getFullYear();
                                    const monthsDiff = today.getMonth() - birthDate.getMonth();
                                    const totalMonths = yearsDiff * 12 + monthsDiff;
                                    const finalMonths = today.getDate() < birthDate.getDate() ? Math.max(0, totalMonths - 1) : totalMonths;
                                    return `${finalMonths} months`;
                                  })()}</p>
                                )}
                                {otherChild.gender && <p>Gender: {otherChild.gender}</p>}
                              </div>
                              <div className="card-actions justify-end mt-2">
                                <button className="btn btn-xs btn-primary">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <span>No other children assigned to {child.leadTeacher}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <LanguageDevelopmentCharts
          assessments={allAssessments}
          viewMode={viewMode}
          title={`Language Development Analysis ${viewMode === "dotmatrix" ? "- Year Overview" : ""}`}
          contextSubtitle="At Home"
          showWordScores
          cohortThresholdsByCategory={cohortThresholdsByCategory}
        />

        {/* Assessment Data - WPM Summary and Progress Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Words Per Minute Summary
              </h2>
              <div className="divider"></div>
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'science', label: 'Science', color: 'text-blue-600' },
                    { key: 'social', label: 'Social', color: 'text-green-600' },
                    { key: 'literature', label: 'Literature', color: 'text-purple-600' },
                    { key: 'language', label: 'Language', color: 'text-orange-600' }
                  ].map(({ key, label, color }) => {
                    const val = averageCategoryWPM[key];
                    return (
                      <div key={key} className="stat bg-base-200 rounded-lg p-3">
                        <div className={`stat-title text-xs ${color}`}>{label}</div>
                        <div className={`stat-value text-xl ${color}`}>
                          {val != null ? `${Math.round(val * 10) / 10}` : '—'}
                        </div>
                        <div className="stat-desc text-[10px]">WPM</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col items-center pt-2 border-t border-base-300">
                  <div className="text-2xl font-bold text-primary">
                    {averageWPM != null ? `${Math.round(averageWPM * 10) / 10} WPM` : 'N/A'} <span className="text-sm font-normal text-base-content/60">(overall)</span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-1">
                    {averageWPM != null
                      ? `Average across ${allAssessments.filter((a) => a?.wordsPerMinute != null).length} recording(s)`
                      : 'WPM appears when assessments include duration data (e.g. from external ingest).'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Progress Timeline
              </h2>
              <div className="divider"></div>
              <ul className="timeline timeline-vertical">
                <li>
                  <div className="timeline-start">Jan 2024</div>
                  <div className="timeline-middle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Initial Assessment</div>
                  <hr className="bg-primary" />
                </li>
                <li>
                  <hr className="bg-primary" />
                  <div className="timeline-start">Mar 2024</div>
                  <div className="timeline-middle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-content/20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Mid-term Review</div>
                  <hr />
                </li>
                <li>
                  <hr />
                  <div className="timeline-start">Jun 2024</div>
                  <div className="timeline-middle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-content/20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Final Assessment</div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes & Observations
              <span className="badge badge-primary">{notes.length}</span>
            </h2>
            <div className="divider"></div>
            
            {/* Add Note Form */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Add New Note</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24 focus:textarea-primary"
                placeholder="Enter your observations, notes, or comments about the child's progress..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-base-content/60">Press Ctrl+Enter to add note</span>
                <button 
                  onClick={handleAddNote}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Recent Notes</h3>
                {notes.map((note) => (
                  <div key={note._id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-base-content whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-base-content/60">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {note.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
                <span>No notes yet. Add your first observation above!</span>
            </div>
            )}
          </div>
        </div>

        {/* Transcripts Section - Admin + Parent */}
        {(isAdmin() || isParent()) && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Transcripts
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-base-content/60">
                    {allAssessments.filter(a => a.transcript && a.transcript.trim()).length} transcript{allAssessments.filter(a => a.transcript && a.transcript.trim()).length !== 1 ? 's' : ''} available
                  </div>
                  {isAdmin() && allAssessments.filter(a => a.transcript && a.transcript.trim()).length > 0 && (
                    <button
                      onClick={() => {
                        // Combine all transcripts into one file
                        const transcriptsWithDates = allAssessments
                          .filter(a => a.transcript && a.transcript.trim())
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((assessment) => {
                            const dateStr = new Date(assessment.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            const activityLine = assessment.activity ? `Activity: ${assessment.activity}\n` : '';
                            return `=== Transcript from ${dateStr} ===\n${activityLine}${assessment.uploadedBy ? `Uploaded by: ${assessment.uploadedBy}\n` : ''}${assessment.transcript}\n\n`;
                          });
                        
                        const allTranscriptsText = transcriptsWithDates.join('\n');
                        const blob = new Blob([allTranscriptsText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${child?.name || 'child'}_all_transcripts_${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success("All transcripts downloaded");
                      }}
                      className="btn btn-primary btn-sm gap-2"
                      title="Download all transcripts"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                </div>
              </div>

              {allAssessments.filter(a => a.transcript && a.transcript.trim()).length === 0 ? (
                <div className="alert alert-info">
                  <FileText className="w-5 h-5" />
                  <span>No transcripts available yet. Transcripts will appear here after recordings are processed and accepted.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {allAssessments
                    .filter(a => a.transcript && a.transcript.trim())
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((assessment) => (
                      <div key={assessment._id} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>
                                  {new Date(assessment.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {assessment.activity && (
                                  <span
                                    className="badge badge-outline badge-primary badge-sm font-normal"
                                    title={
                                      assessment.activityContext === 'school'
                                        ? 'Activity recorded at school'
                                        : 'Activity recorded at home'
                                    }
                                  >
                                    {assessment.activity}
                                  </span>
                                )}
                              </h3>
                              {assessment.uploadedBy && (
                                <p className="text-sm text-base-content/60 mt-1">
                                  Uploaded by: {assessment.uploadedBy}
                                </p>
                              )}
                            </div>
                            {isAdmin() && (
                              <button
                                onClick={() => handleDeleteChildAssessment(assessment._id)}
                                className="btn btn-ghost btn-sm btn-circle text-error"
                                title="Delete transcript"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="bg-base-100 p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto">
                            {(() => {
                              const segments = getSegmentsForHighlighting(assessment.transcript, assessment.ragSegments);
                              return segments.length > 0 ? (
                                <>
                                  <RAGColorLegend />
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-base-content">
                                    {highlightRAGSegments(assessment.transcript, segments)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed text-base-content">
                                  {assessment.transcript}
                                </p>
                              );
                            })()}
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-base-content/60">
                              <span>
                                {assessment.transcript.length} characters • {assessment.transcript.split(/\s+/).filter(w => w.length > 0).length} words
                                {assessment.durationSeconds != null && (
                                  <span className="ml-2">
                                    • {Math.floor(assessment.durationSeconds / 60)} min {Math.round(assessment.durationSeconds % 60)} sec
                                  </span>
                                )}
                              </span>
                              {assessment.wordsPerMinute != null ? (
                                <span className="badge badge-sm badge-primary">
                                  {Math.round(assessment.wordsPerMinute * 10) / 10} WPM
                                </span>
                              ) : (
                                <span className="badge badge-sm badge-ghost">WPM: N/A</span>
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
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChildDataPage;



