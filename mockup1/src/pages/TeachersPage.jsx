import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { CardLoading, EmptyTeachers } from "../components/LoadingStates";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, User, Mail, Building2, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
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
  /** Lowercased emails that already have a teacher invitation sent */
  const [invitedTeacherEmails, setInvitedTeacherEmails] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Teachers" }
  ];

  useEffect(() => {
    if (!isAdmin()) return;
    axios
      .get("/api/teacher-invitations/list")
      .then((res) => {
        const next = new Set();
        (res.data?.invitations || []).forEach((inv) => {
          const e = (inv?.email || "").toLowerCase().trim();
          if (e) next.add(e);
        });
        setInvitedTeacherEmails(next);
      })
      .catch(() => {});
  }, [isAdmin]);

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
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((t) => 
        t.name?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.center?.toLowerCase().includes(term) ||
        t.education?.toLowerCase().includes(term)
      );
    }
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
    const em = (teacher?.email || "").toLowerCase().trim();
    if (em && invitedTeacherEmails.has(em)) return;
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

      const em = inviteEmail.toLowerCase().trim();
      if (em) {
        setInvitedTeacherEmails((prev) => new Set([...prev, em]));
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
  
  const handleAddTeacher = () => {
    navigate("/teachers/add");
  };

  const TeacherCard = ({ teacher, index }) => {
    const teacherChildren = getChildrenForTeacher(teacher.name);
    const hasChildren = teacherChildren.length > 0;
    const isExpanded = expandedTeachers.has(teacher._id);
    const primaryLanguage = getPrimaryLanguageForTeacher(teacher.name);
    const isInvited = invitedTeacherEmails.has((teacher.email || "").toLowerCase().trim());

    return (
      <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300">
        <div className="card-body p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-lg font-bold text-base-content">
                  {isAdmin() ? (
                    <button
                      onClick={() => navigate(`/teachers/${teacher.username || teacher._id}`)}
                      className="hover:text-primary transition-colors"
                    >
                      {teacher.name}
                    </button>
                  ) : (
                    teacher.name
                  )}
                  {hasChildren && (
                    <span className="badge badge-secondary badge-sm">
                      {teacherChildren.length} {teacherChildren.length === 1 ? 'student' : 'students'}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <span>Teacher #{index + 1}</span>
                  {teacher.center && (
                    <span className="badge badge-outline badge-sm">{teacher.center}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-sm btn-circle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 border">
                <li>
                  <button
                    onClick={() => navigate(`/teachers/edit/${teacher._id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Teacher
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleDelete(teacher._id)}
                    className="flex items-center gap-2 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Teacher
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{teacher.email}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-base-content/60">Education:</span>
                <p className="font-medium">{teacher.education || 'N/A'}</p>
              </div>
              <div>
                <span className="text-base-content/60">Date of Birth:</span>
                <p className="font-medium">
                  {teacher.dateOfBirth 
                    ? new Date(teacher.dateOfBirth).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric', 
                        year: 'numeric'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            {primaryLanguage && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base-content/60">Primary Language:</span>
                <span className="badge badge-info badge-sm">{primaryLanguage}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-base-200">
            <div className="flex gap-2">
              {isInvited ? (
                <span className="btn btn-ghost btn-sm no-animation opacity-80 cursor-default border border-base-300">
                  Invited
                </span>
              ) : (
                <button
                  onClick={() => openInviteModal(teacher)}
                  className="btn btn-primary btn-sm gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Invite
                </button>
              )}
            </div>
            
            {isAdmin() && hasChildren && (
              <button
                onClick={() => toggleTeacherExpansion(teacher._id)}
                className="btn btn-ghost btn-sm gap-1"
              >
                <Users className="w-4 h-4" />
                {isExpanded ? 'Hide' : 'View'} Students
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Students Section */}
          {isAdmin() && isExpanded && (
            <div className="mt-4 pt-4 border-t border-base-200">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {teacherChildren.length > 0 ? (
                  teacherChildren.map((child) => (
                    <div
                      key={child._id}
                      onClick={() => navigate(`/data/child/${child._id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-base-50 hover:bg-base-200 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{child.name}</p>
                        <div className="flex gap-2 text-xs text-base-content/60">
                          {child.dateOfBirth && (
                            <span>Age: {(() => {
                              const birthDate = new Date(child.dateOfBirth);
                              const today = new Date();
                              const yearsDiff = today.getFullYear() - birthDate.getFullYear();
                              const monthsDiff = today.getMonth() - birthDate.getMonth();
                              const totalMonths = yearsDiff * 12 + monthsDiff;
                              return `${totalMonths} months`;
                            })()}</span>
                          )}
                          {child.gender && <span>Gender: {child.gender}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-base-content/40" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-base-content/60 text-center py-4">
                    No students assigned
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-base-content mb-2">
                  Teachers
                </h1>
                <p className="text-base-content/70">
                  Manage teacher profiles and class assignments
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="form-control">
                  <div className="input-group">
                    <span className="bg-base-300">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      className="input input-bordered input-sm w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* View Toggle */}
                <div className="btn-group">
                  <button 
                    className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('cards')}
                  >
                    Cards
                  </button>
                  <button 
                    className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </button>
                </div>
                
                {/* Add Button */}
                <button
                  onClick={handleAddTeacher}
                  className="btn btn-primary gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Teacher
                </button>
              </div>
            </div>
            
            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-primary">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Teachers</div>
                  <div className="stat-value text-primary">{teachers.length}</div>
                  <div className="stat-desc">Active teachers</div>
                </div>
                
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-secondary">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Centers</div>
                  <div className="stat-value text-secondary">{centers.length}</div>
                  <div className="stat-desc">Locations served</div>
                </div>
                
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-accent">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Students</div>
                  <div className="stat-value text-accent">{children.length}</div>
                  <div className="stat-desc">Under supervision</div>
                </div>
                
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-info">
                    <Filter className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Filtered Results</div>
                  <div className="stat-value text-info">{filteredTeachers.length}</div>
                  <div className="stat-desc">Matching criteria</div>
                </div>
              </div>
            )}

            {/* Filters */}
            {isAdmin() && centers.length > 0 && (
              <div className="card bg-base-100 shadow-lg mb-6">
                <div className="card-body p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Filter by Center
                        </span>
                      </label>
                      <select
                        className="select select-bordered select-sm w-full max-w-xs"
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
                    
                    {(selectedCenter || searchTerm) && (
                      <button
                        onClick={() => {
                          setSelectedCenter("");
                          setSearchTerm("");
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* Content */}
            {loading ? (
              <CardLoading count={6} />
            ) : filteredTeachers.length === 0 ? (
              searchTerm || selectedCenter ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <h3 className="text-xl font-bold text-base-content mb-2">No results found</h3>
                  <p className="text-base-content/60 mb-4">
                    No teachers match your search criteria
                  </p>
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCenter("");
                    }}
                    className="btn btn-ghost"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <EmptyTeachers onAdd={handleAddTeacher} />
              )
            ) : (
              <>
                {/* Cards View */}
                {viewMode === "cards" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher, index) => (
                      <TeacherCard key={teacher._id} teacher={teacher} index={index} />
                    ))}
                  </div>
                )}
                
                {/* Table View */}
                {viewMode === "table" && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body p-0">
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
                            {filteredTeachers.map((teacher, index) => {
                              const teacherChildren = getChildrenForTeacher(teacher.name);
                              const hasChildren = teacherChildren.length > 0;
                              const isExpanded = expandedTeachers.has(teacher._id);
                              const isInvited = invitedTeacherEmails.has((teacher.email || "").toLowerCase().trim());

                              return (
                                <>
                                  <tr key={teacher._id} className="hover">
                                    {isAdmin() && (
                                      <td>
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
                                        {isAdmin() ? (
                                          <button
                                            onClick={() => navigate(`/teachers/${teacher.username || teacher._id}`)}
                                            className="link link-primary font-semibold hover:underline"
                                          >
                                            {teacher.name}
                                          </button>
                                        ) : (
                                          <span className="font-semibold">{teacher.name}</span>
                                        )}
                                        {hasChildren && (
                                          <span className="badge badge-secondary badge-sm">
                                            {teacherChildren.length}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>{teacher.email}</td>
                                    <td>{teacher.education}</td>
                                    <td>
                                      {teacher.dateOfBirth 
                                        ? new Date(teacher.dateOfBirth).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })
                                        : 'N/A'
                                      }
                                    </td>
                                    <td>
                                      {teacher.center ? (
                                        <span className="badge badge-primary">{teacher.center}</span>
                                      ) : (
                                        <span className="text-base-content/50">None</span>
                                      )}
                                    </td>
                                    <td>
                                      <span className="badge badge-info badge-sm">
                                        {getPrimaryLanguageForTeacher(teacher.name) || "—"}
                                      </span>
                                    </td>
                                    <td>
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
                                        {isInvited ? (
                                          <span className="btn btn-ghost btn-xs no-animation opacity-80 cursor-default border border-base-300">
                                            Invited
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => openInviteModal(teacher)}
                                            className="btn btn-primary btn-xs gap-1"
                                            title="Send invitation"
                                          >
                                            <Mail className="w-3 h-3" />
                                            Invite
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded children details */}
                                  {isAdmin() && isExpanded && hasChildren && (
                                    <tr>
                                      <td colSpan={9} className="bg-base-50 p-0">
                                        <div className="p-4">
                                          <h4 className="font-semibold mb-3 text-sm">
                                            Students Under {teacher.name} ({teacherChildren.length})
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {teacherChildren.map((child) => (
                                              <div
                                                key={child._id}
                                                onClick={() => navigate(`/data/child/${child._id}`)}
                                                className="p-3 bg-base-100 rounded-lg hover:bg-base-200 cursor-pointer transition-colors border"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <User className="w-4 h-4 text-accent" />
                                                  <div>
                                                    <p className="font-medium text-sm">{child.name}</p>
                                                    <div className="flex gap-2 text-xs text-base-content/60">
                                                      {child.dateOfBirth && (
                                                        <span>Age: {(() => {
                                                          const birthDate = new Date(child.dateOfBirth);
                                                          const today = new Date();
                                                          const yearsDiff = today.getFullYear() - birthDate.getFullYear();
                                                          const monthsDiff = today.getMonth() - birthDate.getMonth();
                                                          const totalMonths = yearsDiff * 12 + monthsDiff;
                                                          return `${totalMonths} months`;
                                                        })()}</span>
                                                      )}
                                                      {child.gender && <span>Gender: {child.gender}</span>}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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
    </AppLayout>
  );
};

export default TeachersPage;
