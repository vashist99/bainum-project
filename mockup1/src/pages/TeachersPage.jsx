import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, User, Mail, X } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const TeachersPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeacherForInvite, setSelectedTeacherForInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

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
          setChildren(response.data.children || []);
        } catch (error) {
          console.error("Error fetching children:", error);
          setChildren([]);
        }
      }
    };

    fetchChildren();
  }, [isAdmin]);

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
    return children.filter(child => child.leadTeacher === teacherName);
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

    setSendingInvite(true);

    try {
      // Get token from localStorage
      const savedUser = localStorage.getItem('user');
      const token = savedUser ? JSON.parse(savedUser) : null;

      if (!token) {
        toast.error("Please log in to send invitations");
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

      // Send invitation
      const response = await axios.post("/api/teacher-invitations/send", invitationData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Check if email was sent successfully or if manual sharing is needed
      if (response.data.warning) {
        // Email failed, show invitation link
        toast.success("Invitation created! Email failed to send. Please share the link manually.", {
          duration: 10000
        });
        if (response.data.invitation?.invitationLink) {
          const link = response.data.invitation.invitationLink;
          navigator.clipboard.writeText(link).then(() => {
            toast.success("Invitation link copied to clipboard!");
          }).catch(() => {
            alert(`Invitation link:\n${link}`);
            console.log("Invitation link:", link);
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
      const errorMessage =
        error.response?.data?.message || "Failed to send invitation. Please try again.";
      toast.error(errorMessage);
      console.error("Error sending invitation:", error);
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Teachers
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/teachers/add")}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Teacher
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      {isAdmin() && <th className="w-12"></th>}
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Education</th>
                      <th>Date of Birth</th>
                      <th>Center</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin() ? 8 : 7} className="text-center text-base-content/60">
                          No teachers added yet. Click "Add Teacher" to get started.
                        </td>
                      </tr>
                    ) : (
                      teachers.flatMap((teacher, index) => {
                        const isExpanded = expandedTeachers.has(teacher._id);
                        const teacherChildren = getChildrenForTeacher(teacher.name);
                        const hasChildren = teacherChildren.length > 0;

                        const rows = [
                          <tr 
                            key={teacher._id} 
                            onClick={(e) => {
                              // Don't expand if clicking on action buttons
                              if (!e.target.closest('button, .btn')) {
                                if (isAdmin() && hasChildren) {
                                  toggleTeacherExpansion(teacher._id);
                                }
                              }
                            }}
                            className={isAdmin() && hasChildren ? "cursor-pointer hover:bg-base-200" : ""}
                          >
                            {isAdmin() && (
                              <td onClick={(e) => e.stopPropagation()}>
                                {hasChildren ? (
                                  <button
                                    onClick={() => toggleTeacherExpansion(teacher._id)}
                                    className="btn btn-ghost btn-xs btn-circle"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-6"></span>
                                )}
                              </td>
                            )}
                            <td>{index + 1}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                {teacher.name}
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
                            <td>{teacher.email}</td>
                            <td>{teacher.education}</td>
                            <td>{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                            <td>
                              <span className="badge badge-primary">
                                {teacher.center}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <button className="btn btn-ghost btn-xs">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(teacher._id)}
                                  className="btn btn-ghost btn-xs text-error"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ];

                        // Add children row if expanded
                        if (isAdmin() && isExpanded && hasChildren) {
                          rows.push(
                            <tr key={`${teacher._id}-children`}>
                              <td colSpan={isAdmin() ? 8 : 7} className="bg-base-200 p-0">
                                <div className="p-4 pl-12">
                                  <h4 className="font-semibold mb-3 text-sm text-base-content/70">
                                    Children Under Supervision ({teacherChildren.length})
                                  </h4>
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
                                  {teacherChildren.length === 0 && (
                                    <p className="text-sm text-base-content/60">No children assigned to this teacher.</p>
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
            )}
          </div>
        </div>
      </div>

      {/* Invite Teacher Modal */}
      {showInviteModal && selectedTeacherForInvite && (
        <div className="modal modal-open">
          <div className="modal-box">
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

