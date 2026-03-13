import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Plus, Users, ChevronRight, UserPlus, Mail, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const DataPage = () => {
  const navigate = useNavigate();
  const { user, isTeacher, isParent, isAdmin } = useAuth();

  // Redirect parents to their child's page
  useEffect(() => {
    if (isParent() && user?.childId) {
      navigate(`/data/child/${user.childId}`, { replace: true });
    }
  }, [isParent, user, navigate]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedChildForInvite, setSelectedChildForInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sortBy, setSortBy] = useState(null); // 'age' | 'teacher' | 'language'
  const [sortAsc, setSortAsc] = useState(true);

  // Load teachers and children from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teachers from database
        const teachersResponse = await axios.get("/api/teachers");
        const teachersList = teachersResponse.data.teachers || [];
        // console.log("Teachers from DB:", teachersList);
        setTeachers(teachersList);

        // Fetch children from database
        const childrenResponse = await axios.get("/api/children");
        const childrenList = childrenResponse.data.children || [];
        // console.log("Children from DB:", childrenList);
        setChildren(childrenList);

      } catch (error) {
        console.error("Error fetching data:", error);
        setTeachers([]);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Separate effect to handle teacher auto-selection after data loads
  useEffect(() => {
    if (!loading && isTeacher() && user?.name && !selectedTeacher) {
      setSelectedTeacher(user.name);
    }
  }, [loading, isTeacher, user, selectedTeacher]);

  // Filter children by selected teacher
  useEffect(() => {
    if (selectedTeacher) {
      const filtered = children.filter(
        (child) => {
          // console.log(`Child: ${child.name}, Lead Teacher: ${child.leadTeacher}`);
          return child.leadTeacher === selectedTeacher;
        }
      );
      setFilteredChildren(filtered);
    } else {
      // For admins, show all children if no teacher is selected
      if (isAdmin()) {
        setFilteredChildren(children);
      } else {
        setFilteredChildren([]);
      }
    }
  }, [selectedTeacher, children, isAdmin]);

  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!selectedChildForInvite) {
      toast.error("No child selected");
      return;
    }

    setSendingInvite(true);
    try {
      const response = await axios.post("/api/invitations/send", {
        email: inviteEmail,
        childId: selectedChildForInvite._id || selectedChildForInvite.id,
        userId: user?.id,
        userRole: user?.role,
        userName: user?.name
      });

      // Check if email failed but invitation was created
      if (response.data.warning || response.data.invitation?.invitationLink) {
        const link = response.data.invitation?.invitationLink || 
          response.data.invitationLink ||
          `${window.location.origin}/parent/register?token=${response.data.invitation?.token}`;
        
        const errorMsg = response.data.emailError ? `\n\nError: ${response.data.emailError}` : '';
        toast.error(`Invitation created but email failed to send.${errorMsg}`, {
          duration: 15000,
        });
        
        // Show the link in a more visible way
        setTimeout(() => {
          const message = `Email not configured. Please copy and share this invitation link with the parent:${errorMsg}\n\n${link}`;
          navigator.clipboard.writeText(link).then(() => {
            toast.success("Invitation link copied to clipboard!");
            alert(message);
          }).catch(() => {
            prompt(message, link);
          });
        }, 500);
      } else {
        toast.success("Invitation sent successfully!");
      }
      
      setShowInviteModal(false);
      setInviteEmail("");
      setSelectedChildForInvite(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send invitation";
      toast.error(errorMessage);
      
      // If invitation was created but email failed, show the link
      if (error.response?.data?.invitation?.invitationLink || error.response?.data?.invitationLink) {
        const link = error.response.data.invitation?.invitationLink || error.response.data.invitationLink;
        setTimeout(() => {
          prompt("Invitation created but email failed. Share this link manually:", link);
        }, 500);
      }
    } finally {
      setSendingInvite(false);
    }
  };

  const openInviteModal = (child) => {
    setSelectedChildForInvite(child);
    setShowInviteModal(true);
  };

  const getAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return 9999; // put missing at end when sorting
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return 9999;
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months -= 1;
    return Math.max(0, months);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "—";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return "—";
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months -= 1;
    if (months < 0) return "—";
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years} yrs` : `${years} yrs ${rem} mo`;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  const sortedChildren = (() => {
    if (!sortBy) return filteredChildren;
    return [...filteredChildren].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'age') {
        const ma = getAgeInMonths(a.dateOfBirth);
        const mb = getAgeInMonths(b.dateOfBirth);
        cmp = ma - mb;
      } else if (sortBy === 'teacher') {
        const ta = (a.leadTeacher || '').toLowerCase();
        const tb = (b.leadTeacher || '').toLowerCase();
        cmp = ta.localeCompare(tb);
      } else if (sortBy === 'language') {
        const la = (a.primaryLanguage || '').toLowerCase();
        const lb = (b.primaryLanguage || '').toLowerCase();
        cmp = la.localeCompare(lb);
      }
      return sortAsc ? cmp : -cmp;
    });
  })();

  const handleDeleteChild = async (childId) => {
    if (window.confirm("Are you sure you want to delete this child? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/children/${childId}`);
        setChildren(children.filter((child) => (child._id || child.id) !== childId));
        setFilteredChildren(filteredChildren.filter((child) => (child._id || child.id) !== childId));
        toast.success("Child deleted successfully");
      } catch (error) {
        console.error("Error deleting child:", error);
        const errorMessage = error.response?.data?.message || "Failed to delete child";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4 md:p-6">
        {/* DEBUG INFO - REMOVE LATER */}
        {/* <div className="alert alert-warning mb-4">
          <div>
            <h3 className="font-bold">Debug Info:</h3>
            <p>User: {JSON.stringify(user)}</p>
            <p>Is Teacher: {isTeacher() ? "Yes" : "No"}</p>
            <p>Selected Teacher: {selectedTeacher || "None"}</p>
            <p>Children Count: {children.length}</p>
            <p>Filtered Children: {filteredChildren.length}</p>
          </div>
        </div> */}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Data
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/children/add")}
              className="btn btn-primary gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Child
            </button>
          </div>
        </div>

        {/* Teacher Selection - Hidden for teachers, info card shown instead */}
        {isTeacher() ? (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="alert alert-info">
                <Users className="w-5 h-5" />
                <span>Viewing your students: <strong>{selectedTeacher}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="form-control w-full max-w-md">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Teacher ({teachers.length} available)
                  </span>
                </label>
                <select
                  className="select select-bordered select-primary w-full"
                  value={selectedTeacher}
                  onChange={handleTeacherChange}
                  disabled={loading}
                >
                  <option value="">{loading ? "Loading teachers..." : "All teachers"}</option>
                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher.name}
                    >
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              {!loading && teachers.length === 0 && (
                <div className="alert alert-warning mt-4">
                  <span>No teachers found. Add teachers using the Add Teacher form.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Children Table - Show for selected teacher or all children for admins */}
        {(selectedTeacher || (isAdmin() && children.length > 0)) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">
                {selectedTeacher ? `Children under ${selectedTeacher}` : "All Children"}
              </h2>
              {/* Mobile: Card layout */}
              <div className="block md:hidden space-y-3">
                {filteredChildren.length === 0 ? (
                  <p className="text-center text-base-content/60 py-8">
                    No children found for this teacher.
                  </p>
                ) : (
                  sortedChildren.map((child, index) => (
                    <div
                      key={child._id || child.id}
                      className="card bg-base-200 border border-base-300 overflow-hidden"
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-semibold text-base flex items-center gap-1">
                              <span className="text-base-content/60">#{index + 1}</span>
                              <button
                                onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                                className="link link-primary hover:underline"
                              >
                                {child.name}
                              </button>
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </h3>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-base-content/70">
                              <span>Age: {calculateAge(child.dateOfBirth)}</span>
                              <span>Lang: {child.primaryLanguage}</span>
                              <span>Teacher: {child.leadTeacher || "—"}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            <button
                              onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="btn btn-ghost btn-xs"
                            >
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/children/edit/${child._id || child.id}`)}
                              className="btn btn-ghost btn-xs"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(child._id || child.id)}
                              className="btn btn-ghost btn-xs text-error"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openInviteModal(child)}
                              className="btn btn-primary btn-xs gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Desktop: Table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('age')}
                          className="flex items-center gap-1 hover:underline"
                        >
                          Age
                          {sortBy === 'age' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('language')}
                          className="flex items-center gap-1 hover:underline"
                        >
                          Language
                          {sortBy === 'language' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('teacher')}
                          className="flex items-center gap-1 hover:underline"
                        >
                          Teacher
                          {sortBy === 'teacher' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChildren.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-base-content/60"
                        >
                          No children found for this teacher.
                        </td>
                      </tr>
                    ) : (
                      sortedChildren.map((child, index) => (
                        <tr key={child._id || child.id} className="hover">
                          <td className="align-middle">{index + 1}</td>
                          <td className="align-middle">
                            <button
                              onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="link link-primary font-semibold hover:scale-105 transition-transform inline-flex items-center gap-1"
                            >
                              {child.name}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="align-middle">{calculateAge(child.dateOfBirth)}</td>
                          <td className="align-middle">{child.primaryLanguage}</td>
                          <td className="align-middle">{child.leadTeacher || "—"}</td>
                          <td className="align-middle">
                            <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="btn btn-ghost btn-xs"
                                title="View details"
                            >
                              View Details
                            </button>
                              <button
                                onClick={() => navigate(`/children/edit/${child._id || child.id}`)}
                                className="btn btn-ghost btn-xs"
                                title="Edit child"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteChild(child._id || child.id)}
                                className="btn btn-ghost btn-xs text-error"
                                title="Delete child"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openInviteModal(child)}
                                className="btn btn-primary btn-xs gap-1"
                                title="Send invitation to parent"
                              >
                                <Mail className="w-3 h-3" />
                                Invite
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Only show for non-teachers and non-admins */}
        {!selectedTeacher && !isTeacher() && !isAdmin() && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-primary/10 p-8 rounded-full mb-6">
                  <Users className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Select a Teacher</h2>
                <p className="text-base-content/60 text-center max-w-md">
                  Choose a teacher from the dropdown above to view their
                  students' data and track progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {showInviteModal && selectedChildForInvite && (
          <div className="modal modal-open">
            <div className="modal-box w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                Send Parent Invitation
              </h3>
              
              <div className="divider"></div>

              <div className="mb-4">
                <p className="text-sm text-base-content/70 mb-2">
                  Sending invitation for: <strong>{selectedChildForInvite.name}</strong>
                </p>
                <p className="text-xs text-base-content/60">
                  The parent will receive an email with a link to create their account and view their child's data.
                </p>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Parent Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
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
                    setSelectedChildForInvite(null);
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
    </div>
  );
};

export default DataPage;

