import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { CardLoading, EmptyCenters } from "../components/LoadingStates";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Building2, Users, Mail, MapPin, Phone, Search, Filter } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const CentersPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [centers, setCenters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCenters, setExpandedCenters] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  
  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Centers", href: "/centers" }
  ];

  // Load centers from API on component mount
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/centers");
        setCenters(response.data.centers || []);
      } catch (error) {
        console.error("Error fetching centers:", error);
        toast.error("Failed to load centers");
        setCenters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCenters();
  }, []);

  // Load teachers from API if user is admin
  useEffect(() => {
    const fetchTeachers = async () => {
      if (isAdmin()) {
        try {
          const response = await axios.get("/api/teachers");
          setTeachers(response.data.teachers || []);
        } catch (error) {
          console.error("Error fetching teachers:", error);
          setTeachers([]);
        }
      }
    };

    fetchTeachers();
  }, [isAdmin]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this center? This will not delete the teachers, but they will need to be reassigned to another center.")) {
      try {
        await axios.delete(`/api/centers/${id}`);
        setCenters(centers.filter((center) => center._id !== id));
        toast.success("Center deleted successfully");
      } catch (error) {
        console.error("Error deleting center:", error);
        const errorMessage = error.response?.data?.message || "Failed to delete center";
        toast.error(errorMessage);
      }
    }
  };

  const toggleCenterExpansion = (centerId) => {
    const newExpanded = new Set(expandedCenters);
    if (newExpanded.has(centerId)) {
      newExpanded.delete(centerId);
    } else {
      newExpanded.add(centerId);
    }
    setExpandedCenters(newExpanded);
  };

  const getTeachersForCenter = (centerName) => {
    if (!isAdmin()) return [];
    return teachers.filter(teacher => teacher.center === centerName);
  };
  
  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleAddCenter = () => {
    navigate("/centers/add");
  };

  const CenterCard = ({ center, index }) => {
    const centerTeachers = getTeachersForCenter(center.name);
    const hasTeachers = centerTeachers.length > 0;
    const isExpanded = expandedCenters.has(center._id);

    return (
      <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300">
        <div className="card-body p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-lg font-bold text-base-content">
                  {center.name}
                  {hasTeachers && (
                    <span className="badge badge-secondary badge-sm">
                      {centerTeachers.length} {centerTeachers.length === 1 ? 'teacher' : 'teachers'}
                    </span>
                  )}
                </h3>
                <span className="text-sm text-base-content/60">Center #{index + 1}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-sm btn-circle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 border">
                <li>
                  <button
                    onClick={() => navigate(`/centers/edit/${center._id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleDelete(center._id)}
                    className="flex items-center gap-2 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{center.address || "No address provided"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{center.phone || "No phone provided"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{center.email || "No email provided"}</span>
            </div>
          </div>

          {/* Teachers Section */}
          {isAdmin() && hasTeachers && (
            <>
              <div className="divider my-4"></div>
              <div>
                <button
                  onClick={() => toggleCenterExpansion(center._id)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-3"
                >
                  <Users className="w-4 h-4" />
                  View Teachers ({centerTeachers.length})
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {centerTeachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        onClick={() => navigate(`/data/teacher/${teacher._id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-base-50 hover:bg-base-200 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{teacher.name}</p>
                          <p className="text-xs text-base-content/60">{teacher.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-base-content/40" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={handleSidebarToggle}
        currentPath="/centers"
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar 
          onToggleSidebar={handleSidebarToggle}
          showSidebar={sidebarOpen}
          breadcrumbs={breadcrumbs}
        />
        
        <main className="flex-1 overflow-auto">

          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-base-content mb-2">
                  Education Centers
                </h1>
                <p className="text-base-content/70">
                  Manage and organize your educational centers
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
                      placeholder="Search centers..."
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
                  onClick={handleAddCenter}
                  className="btn btn-primary gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Center
                </button>
              </div>
            </div>
            
            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-primary">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Centers</div>
                  <div className="stat-value text-primary">{centers.length}</div>
                  <div className="stat-desc">Across all locations</div>
                </div>
                
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-secondary">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Teachers</div>
                  <div className="stat-value text-secondary">{teachers.length}</div>
                  <div className="stat-desc">Working across centers</div>
                </div>
                
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                  <div className="stat-figure text-accent">
                    <Filter className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Filtered Results</div>
                  <div className="stat-value text-accent">{filteredCenters.length}</div>
                  <div className="stat-desc">Matching search criteria</div>
                </div>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <CardLoading count={6} />
            ) : filteredCenters.length === 0 ? (
              searchTerm ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <h3 className="text-xl font-bold text-base-content mb-2">No results found</h3>
                  <p className="text-base-content/60 mb-4">
                    No centers match your search for "{searchTerm}"
                  </p>
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="btn btn-ghost"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <EmptyCenters onAdd={handleAddCenter} />
              )
            ) : (
              <>
                {/* Cards View */}
                {viewMode === "cards" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCenters.map((center, index) => (
                      <CenterCard key={center._id} center={center} index={index} />
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
                              <th>Address</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>Teachers</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCenters.map((center, index) => {
                              const centerTeachers = getTeachersForCenter(center.name);
                              const hasTeachers = centerTeachers.length > 0;
                              const isExpanded = expandedCenters.has(center._id);

                              return (
                                <>
                                  <tr 
                                    key={center._id} 
                                    className="hover"
                                  >
                                    {isAdmin() && (
                                      <td>
                                        {hasTeachers ? (
                                          <button
                                            onClick={() => toggleCenterExpansion(center._id)}
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
                                        <Building2 className="w-5 h-5 text-primary" />
                                        <span className="font-semibold">{center.name}</span>
                                      </div>
                                    </td>
                                    <td>{center.address || 'N/A'}</td>
                                    <td>{center.phone || 'N/A'}</td>
                                    <td className="max-w-xs truncate">{center.email || 'N/A'}</td>
                                    <td>
                                      {hasTeachers ? (
                                        <span className="badge badge-secondary">
                                          {centerTeachers.length}
                                        </span>
                                      ) : (
                                        <span className="text-base-content/50">None</span>
                                      )}
                                    </td>
                                    <td>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => navigate(`/centers/edit/${center._id}`)}
                                          className="btn btn-ghost btn-xs"
                                          title="Edit center"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(center._id)}
                                          className="btn btn-ghost btn-xs text-error"
                                          title="Delete center"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded teacher details */}
                                  {isAdmin() && isExpanded && hasTeachers && (
                                    <tr>
                                      <td colSpan={8} className="bg-base-50 p-0">
                                        <div className="p-4">
                                          <h4 className="font-semibold mb-3 text-sm">
                                            Teachers at {center.name}
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {centerTeachers.map((teacher) => (
                                              <div
                                                key={teacher._id}
                                                onClick={() => navigate(`/data/teacher/${teacher._id}`)}
                                                className="p-3 bg-base-100 rounded-lg hover:bg-base-200 cursor-pointer transition-colors border"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Users className="w-4 h-4 text-secondary" />
                                                  <div>
                                                    <p className="font-medium text-sm">{teacher.name}</p>
                                                    <p className="text-xs text-base-content/60">{teacher.email}</p>
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
        </main>
      </div>
    </div>
  );
};

export default CentersPage;
