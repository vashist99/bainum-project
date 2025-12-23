import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Plus, Users, ChevronRight, UserPlus, Mail } from "lucide-react";
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
      console.log("Auto-selecting teacher:", user.name);
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
        
        toast.success("Invitation created! Email not configured.", {
          duration: 5000,
        });
        
        // Show the link in a more visible way
        setTimeout(() => {
          const shareLink = prompt(
            "Email not configured. Please copy and share this invitation link with the parent:\n\n" + link,
            link
          );
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

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6">
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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Data
          </h1>
          <div className="flex gap-2">
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
                  <option value="">{loading ? "Loading teachers..." : "Choose a teacher..."}</option>
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
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Language</th>
                      <th>Assessment Score</th>
                      <th>Progress</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChildren.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center text-base-content/60"
                        >
                          No children found for this teacher.
                        </td>
                      </tr>
                    ) : (
                      filteredChildren.map((child, index) => (
                        <tr key={child._id || child.id} className="hover">
                          <td>{index + 1}</td>
                          <td>
                            <button
                              onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="link link-primary font-semibold hover:scale-105 transition-transform inline-flex items-center gap-1"
                            >
                              {child.name}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                          <td>
                            <span className="badge badge-ghost">-</span>
                          </td>
                          <td>{child.primaryLanguage}</td>
                          <td>
                            <span className="badge badge-info">-</span>
                          </td>
                          <td>
                            <progress
                              className="progress progress-primary w-20"
                              value="0"
                              max="100"
                            ></progress>
                          </td>
                          <td className="text-base-content/60">-</td>
                          <td>
                            <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="btn btn-ghost btn-xs"
                            >
                              View Details
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
            <div className="modal-box">
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

