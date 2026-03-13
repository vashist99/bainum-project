import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, User, Mail, Building2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const TeachersPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeacherForInvite, setSelectedTeacherForInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sortByCenter, setSortByCenter] = useState(null); // null | 'asc' | 'desc'
  const [sortByLanguage, setSortByLanguage] = useState(null); // null | 'asc' | 'desc'

  // Load teachers from API on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/teachers");
        setTeachers(response.data.teachers || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        toast.error("Failed to load teachers");
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Load children from API if user is admin
  useEffect(() => {
    const fetchChildren = async () => {
      if (isAdmin()) {
        try {
          const response = await axios.get("/api/children");
          const childrenList = response.data.children || [];
          setChildren(childrenList);
        } catch (error) {
          console.error("Error fetching children:", error);
          setChildren([]);
        }
      }
    };

    fetchChildren();
  }, [isAdmin]);

  // Load centers from API if user is admin
  useEffect(() => {
    const fetchCenters = async () => {
      if (isAdmin()) {
        try {
          const response = await axios.get("/api/centers");
          setCenters(response.data.centers || []);
        } catch (error) {
          console.error("Error fetching centers:", error);
          setCenters([]);
        }
      }
    };

    fetchCenters();
  }, [isAdmin]);

  const filteredTeachers = (() => {
    let list = selectedCenter
      ? teachers.filter((t) => t.center === selectedCenter)
      : teachers;
    if (sortByCenter) {
      list = [...list].sort((a, b) => {
        const ca = (a.center || '').toLowerCase();
        const cb = (b.center || '').toLowerCase();
        const cmp = ca.localeCompare(cb);
        return sortByCenter === 'asc' ? cmp : -cmp;
      });
    }
    if (sortByLanguage) {
      list = [...list].sort((a, b) => {
        const la = getPrimaryLanguageForTeacher(a.name).toLowerCase();
        const lb = getPrimaryLanguageForTeacher(b.name).toLowerCase();
        const cmp = la.localeCompare(lb);
        return sortByLanguage === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  })();

  const handleSortByCenter = () => {
    setSortByLanguage(null);
    setSortByCenter(sortByCenter === 'asc' ? 'desc' : sortByCenter === 'desc' ? null : 'asc');
  };

  const handleSortByLanguage = () => {
    setSortByCenter(null);
    setSortByLanguage(sortByLanguage === 'asc' ? 'desc' : sortByLanguage === 'desc' ? null : 'asc');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await axios.delete(`/api/teachers/${id}`);
        setTeachers(teachers.filter((teacher) => teacher._id !== id));
        toast.success("Teacher deleted successfully");
      } catch (error) {
        console.error("Error deleting teacher:", error);
        toast.error("Failed to delete teacher");
      }
    }
  };

  const toggleTeacherExpansion = (teacherId) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  const getChildrenForTeacher = (teacherName) => {
    if (!isAdmin()) return [];
    const filtered = children.filter(child => {
      // Match by exact name or trim whitespace
      const childLeadTeacher = child.leadTeacher?.trim() || '';
      const teacherNameTrimmed = teacherName?.trim() || '';
      return childLeadTeacher === teacherNameTrimmed;
    });
    return filtered;
  };

  /** Returns the most common primary language among teacher's children, or '' if none */
  const getPrimaryLanguageForTeacher = (teacherName) => {
    const teacherChildren = getChildrenForTeacher(teacherName);
    if (teacherChildren.length === 0) return '';
    const langCounts = {};
    teacherChildren.forEach(c => {
      const lang = (c.primaryLanguage || '').trim() || '—';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    });
    return Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  };

  const openInviteModal = (teacher) => {
    setSelectedTeacherForInvite(teacher);
    setInviteEmail(teacher.email || "");
    setShowInviteModal(true);
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!selectedTeacherForInvite) {
      toast.error("No teacher selected");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email");
      return;
    }

    // Verify user is admin
    if (!isAdmin()) {
      toast.error("Only administrators can send teacher invitations");
      return;
    }

    setSendingInvite(true);

    try {
      // Verify user is logged in
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        toast.error("Please log in to send invitations");
        setSendingInvite(false);
        return;
      }

      // Prepare invitation data using teacher's existing data
      const invitationData = {
        email: inviteEmail,
        firstName: selectedTeacherForInvite.name.split(' ')[0] || "",
        lastName: selectedTeacherForInvite.name.split(' ').slice(1).join(' ') || "",
        education: selectedTeacherForInvite.education || "",
        dateOfBirth: selectedTeacherForInvite.dateOfBirth || new Date().toISOString().split('T')[0],
        center: selectedTeacherForInvite.center || "",
      };

      // Send invitation - axios interceptor will automatically add the Authorization header
      const response = await axios.post("/api/teacher-invitations/send", invitationData);

      // Check if email was sent successfully or if manual sharing is needed
      if (response.data.warning) {
        // Email failed, show invitation link with error details
        const errorMsg = response.data.emailError ? `\n\nError: ${response.data.emailError}` : '';
        toast.error(`Invitation created but email failed to send.${errorMsg}`, {
          duration: 15000
        });
        if (response.data.invitation?.invitationLink) {
          const link = response.data.invitation.invitationLink;
          navigator.clipboard.writeText(link).then(() => {
            toast.success("Invitation link copied to clipboard!");
          }).catch(() => {
            alert(`Invitation link:\n${link}${errorMsg}`);
          });
        }
      } else {
        toast.success("Teacher invitation sent successfully!");
      }

      // Reset and close modal
      setShowInviteModal(false);
      setInviteEmail("");
      setSelectedTeacherForInvite(null);
    } catch (error) {
      console.error("Error sending invitation:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      
      let errorMessage = "Failed to send invitation. Please try again.";
      
      if (error.response?.status === 403) {
        errorMessage = "Access denied. Only admins can send teacher invitations. Please check your login status.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log out and log back in.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Teachers
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/teachers/add")}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Teacher
            </button>
          </div>
        </div>

        {isAdmin() && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Filter by Center
                  </span>
                </label>
                <select
                  className="select select-bordered select-primary w-full"
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  disabled={loading}
                >
                  <option value="">All centers</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
              {/* Mobile: Card layout */}
              <div className="block md:hidden space-y-3">
                {filteredTeachers.length === 0 ? (
                  <p className="text-center text-base-content/60 py-8">
                    {selectedCenter
                      ? `No teachers found at ${selectedCenter}.`
                      : "No teachers added yet. Click \"Add Teacher\" to get started."}
                  </p>
                ) : (
                  filteredTeachers.map((teacher, index) => {
                    const isExpanded = expandedTeachers.has(teacher._id);
                    const teacherChildren = getChildrenForTeacher(teacher.name);
                    const hasChildren = teacherChildren.length > 0;
                    return (
                      <div key={teacher._id} className="card bg-base-200 border border-base-300 overflow-hidden">
                        <div
                          className="card-body p-4"
                          onClick={() => isAdmin() && toggleTeacherExpansion(teacher._id)}
                          role={isAdmin() ? "button" : undefined}
                          tabIndex={isAdmin() ? 0 : undefined}
                          onKeyDown={(e) => isAdmin() && (e.key === "Enter" || e.key === " ") && toggleTeacherExpansion(teacher._id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isAdmin() && hasChildren && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleTeacherExpansion(teacher._id); }}
                                    className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                )}
                                <h3 className="font-semibold text-base flex items-center gap-1">
                                  <span className="text-base-content/60">#{index + 1}</span>
                                  {isAdmin() ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigate(`/teachers/${teacher.username || teacher._id}`); }}
                                      className="link link-primary hover:underline"
                                    >
                                      {teacher.name}
                                    </button>
                                  ) : (
                                    <span>{teacher.name}</span>
                                  )}
                                  {hasChildren && <span className="badge badge-sm badge-secondary">{teacherChildren.length}</span>}
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-base-content/70">
                                <span className="truncate">{teacher.email}</span>
                                <span>{teacher.center}</span>
                              </div>
                              <div className="text-xs text-base-content/60 mt-1">
                                {teacher.education} • DOB: {teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openInviteModal(teacher)} className="btn btn-primary btn-xs gap-1">
                                <Mail className="w-3 h-3" /> Invite
                              </button>
                              <button onClick={() => navigate(`/teachers/edit/${teacher._id}`)} className="btn btn-ghost btn-xs">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(teacher._id)} className="btn btn-ghost btn-xs text-error">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {isAdmin() && isExpanded && (
                            <div className="mt-3 pt-3 border-t border-base-300 space-y-2">
                              <h4 className="font-semibold text-sm text-base-content/70">Children ({teacherChildren.length})</h4>
                              {teacherChildren.length > 0 ? (
                                teacherChildren.map((child) => (
                                  <div
                                    key={child._id}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/data/child/${child._id}`); }}
                                    className="flex items-center justify-between p-2 rounded-lg bg-base-100 hover:bg-base-300 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-primary" />
                                      <span className="font-medium text-sm">{child.name}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-base-content/60" />
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-base-content/60">No children assigned.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Desktop: Table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      {isAdmin() && <th className="w-12"></th>}
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Education</th>
                      <th>Date of Birth</th>
                      <th>
                        <button
                          type="button"
                          onClick={handleSortByCenter}
                          className="flex items-center gap-1 hover:underline"
                        >
                          Center
                          {sortByCenter === 'asc' && <ArrowUp className="w-3 h-3" />}
                          {sortByCenter === 'desc' && <ArrowDown className="w-3 h-3" />}
                          {!sortByCenter && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={handleSortByLanguage}
                          className="flex items-center gap-1 hover:underline"
                        >
                          Language
                          {sortByLanguage === 'asc' && <ArrowUp className="w-3 h-3" />}
                          {sortByLanguage === 'desc' && <ArrowDown className="w-3 h-3" />}
                          {!sortByLanguage && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin() ? 9 : 8} className="text-center text-base-content/60">
                          {selectedCenter
                            ? `No teachers found at ${selectedCenter}.`
                            : "No teachers added yet. Click \"Add Teacher\" to get started."}
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.flatMap((teacher, index) => {
                        const isExpanded = expandedTeachers.has(teacher._id);
                        const teacherChildren = getChildrenForTeacher(teacher.name);
                        const hasChildren = teacherChildren.length > 0;

                        const rows = [
                          <tr 
                            key={teacher._id} 
                            onClick={(e) => {
                              // Don't expand if clicking on action buttons
                              if (!e.target.closest('button, .btn')) {
                                if (isAdmin()) {
                                  toggleTeacherExpansion(teacher._id);
                                }
                              }
                            }}
                            className={isAdmin() ? "cursor-pointer hover:bg-base-200" : ""}
                          >
                            {isAdmin() && (
                              <td onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => toggleTeacherExpansion(teacher._id)}
                                  className="btn btn-ghost btn-xs btn-circle"
                                  title={hasChildren ? `View ${teacherChildren.length} children` : "View children (none assigned)"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            )}
                            <td className="align-middle">{index + 1}</td>
                            <td className="align-middle pl-3">
                              <div className="flex items-center gap-2">
                                {isAdmin() ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/teachers/${teacher.username || teacher._id}`);
                                    }}
                                    className="link link-primary font-semibold hover:underline inline-flex items-center gap-1"
                                    title="View classroom talk data"
                                  >
                                    {teacher.name}
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                ) : (
                                  teacher.name
                                )}
                                {isAdmin() && hasChildren && (
                                  <span className="badge badge-sm badge-secondary">
                                    {teacherChildren.length}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInviteModal(teacher);
                                  }}
                                  className="btn btn-primary btn-xs gap-1 ml-2"
                                  title="Send invitation to teacher"
                                >
                                  <Mail className="w-3 h-3" />
                                  Invite
                                </button>
                              </div>
                            </td>
                            <td className="align-middle">{teacher.email}</td>
                            <td className="align-middle">{teacher.education}</td>
                            <td className="align-middle">{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                            <td className="align-middle">
                              <span className="badge badge-primary inline-flex items-center justify-center whitespace-nowrap">
                                {teacher.center}
                              </span>
                            </td>
                            <td className="align-middle">{getPrimaryLanguageForTeacher(teacher.name) || "—"}</td>
                            <td className="align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => navigate(`/teachers/edit/${teacher._id}`)}
                                  className="btn btn-ghost btn-xs"
                                  title="Edit teacher"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(teacher._id)}
                                  className="btn btn-ghost btn-xs text-error"
                                  title="Delete teacher"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ];

                        // Add children row if expanded (always show for admins, even if no children)
                        if (isAdmin() && isExpanded) {
                          rows.push(
                            <tr key={`${teacher._id}-children`}>
                              <td colSpan={isAdmin() ? 9 : 8} className="bg-base-200 p-0">
                                <div className="p-4 pl-12">
                                  <h4 className="font-semibold mb-3 text-sm text-base-content/70">
                                    Children Under Supervision ({teacherChildren.length})
                                  </h4>
                                  {teacherChildren.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {teacherChildren.map((child) => (
                                        <div
                                          key={child._id}
                                          onClick={() => navigate(`/data/child/${child._id}`)}
                                          className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300 hover:border-primary"
                                        >
                                          <div className="card-body p-4">
                                            <div className="flex items-center gap-2">
                                              <User className="w-4 h-4 text-primary" />
                                              <h5 className="font-semibold text-sm">{child.name}</h5>
                                            </div>
                                            <div className="text-xs text-base-content/60 mt-2">
                                              {child.dateOfBirth && (
                                                <p>Age: {(() => {
                                                  const birthDate = new Date(child.dateOfBirth);
                                                  const today = new Date();
                                                  const yearsDiff = today.getFullYear() - birthDate.getFullYear();
                                                  const monthsDiff = today.getMonth() - birthDate.getMonth();
                                                  const totalMonths = yearsDiff * 12 + monthsDiff;
                                                  const finalMonths = today.getDate() < birthDate.getDate() ? Math.max(0, totalMonths - 1) : totalMonths;
                                                  return `${finalMonths} months`;
                                                })()}</p>
                                              )}
                                              {child.gender && <p>Gender: {child.gender}</p>}
                                              {child.diagnosis && (
                                                <p>
                                                  Diagnosis: <span className={child.diagnosis === "Yes" ? "text-warning" : "text-success"}>{child.diagnosis}</span>
                                                </p>
                                              )}
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
                                      <p className="text-sm">No children assigned to this teacher.</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invite Teacher Modal */}
      {showInviteModal && selectedTeacherForInvite && (
        <div className="modal modal-open">
          <div className="modal-box w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Send Teacher Invitation
            </h3>
            
            <div className="divider"></div>

            <div className="mb-4">
              <p className="text-sm text-base-content/70 mb-2">
                Sending invitation for: <strong>{selectedTeacherForInvite.name}</strong>
              </p>
              <p className="text-xs text-base-content/60">
                The teacher will receive an email with a link to create their account and access the system.
              </p>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Teacher Email Address</span>
              </label>
              <input
                type="email"
                placeholder="teacher@example.com"
                className="input input-bordered input-primary w-full"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={sendingInvite}
              />
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setSelectedTeacherForInvite(null);
                }}
                className="btn btn-ghost"
                disabled={sendingInvite}
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitation}
                className="btn btn-primary gap-2"
                disabled={sendingInvite || !inviteEmail.trim()}
              >
                {sendingInvite ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !sendingInvite && setShowInviteModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;

