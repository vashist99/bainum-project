import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Building2, Users, Mail } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Centers
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/centers/add")}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Center
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
              <>
              {/* Mobile: Card layout */}
              <div className="block md:hidden space-y-3">
                {centers.length === 0 ? (
                  <p className="text-center text-base-content/60 py-8">
                    No centers added yet. Click &quot;Add Center&quot; to get started.
                  </p>
                ) : (
                  centers.map((center, index) => {
                    const isExpanded = expandedCenters.has(center._id);
                    const centerTeachers = getTeachersForCenter(center.name);
                    const hasTeachers = centerTeachers.length > 0;
                    return (
                      <div key={center._id} className="card bg-base-200 border border-base-300 overflow-hidden">
                        <div
                          className="card-body p-4"
                          onClick={() => isAdmin() && hasTeachers && toggleCenterExpansion(center._id)}
                          role={isAdmin() && hasTeachers ? "button" : undefined}
                          tabIndex={isAdmin() && hasTeachers ? 0 : undefined}
                          onKeyDown={(e) => isAdmin() && hasTeachers && (e.key === "Enter" || e.key === " ") && toggleCenterExpansion(center._id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isAdmin() && hasTeachers && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleCenterExpansion(center._id); }}
                                    className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span className="text-base-content/60">#{index + 1}</span>
                                  {center.name}
                                  {hasTeachers && (
                                    <span className="badge badge-sm badge-secondary">{centerTeachers.length}</span>
                                  )}
                                </h3>
                              </div>
                              <div className="text-sm text-base-content/70 mt-1 space-y-1">
                                <p>{center.address || "N/A"}</p>
                                <p>{center.phone || "N/A"}</p>
                                <p className="truncate">{center.email || "N/A"}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => navigate(`/centers/edit/${center._id}`)}
                                className="btn btn-ghost btn-xs"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(center._id)}
                                className="btn btn-ghost btn-xs text-error"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {isAdmin() && isExpanded && hasTeachers && (
                            <div className="mt-3 pt-3 border-t border-base-300 space-y-2">
                              <h4 className="font-semibold text-sm text-base-content/70">
                                Teachers at {center.name} ({centerTeachers.length})
                              </h4>
                              {centerTeachers.map((teacher) => (
                                <div
                                  key={teacher._id}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/data/teacher/${teacher._id}`); }}
                                  className="flex items-center justify-between p-2 rounded-lg bg-base-100 hover:bg-base-300 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-sm">{teacher.name}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-base-content/60" />
                                </div>
                              ))}
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
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centers.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin() ? 7 : 6} className="text-center text-base-content/60">
                          No centers added yet. Click "Add Center" to get started.
                        </td>
                      </tr>
                    ) : (
                      centers.flatMap((center, index) => {
                        const isExpanded = expandedCenters.has(center._id);
                        const centerTeachers = getTeachersForCenter(center.name);
                        const hasTeachers = centerTeachers.length > 0;

                        const rows = [
                          <tr 
                            key={center._id} 
                            onClick={(e) => {
                              // Don't expand if clicking on action buttons
                              if (!e.target.closest('button, .btn')) {
                                if (isAdmin() && hasTeachers) {
                                  toggleCenterExpansion(center._id);
                                }
                              }
                            }}
                            className={isAdmin() && hasTeachers ? "cursor-pointer hover:bg-base-200" : ""}
                          >
                            {isAdmin() && (
                              <td onClick={(e) => e.stopPropagation()}>
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
                            <td className="align-middle">{index + 1}</td>
                            <td className="align-middle pl-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                                {center.name}
                                {isAdmin() && hasTeachers && (
                                  <span className="badge badge-sm badge-secondary">
                                    {centerTeachers.length}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="align-middle">{center.address || 'N/A'}</td>
                            <td className="align-middle">{center.phone || 'N/A'}</td>
                            <td className="align-middle">{center.email || 'N/A'}</td>
                            <td className="align-middle" onClick={(e) => e.stopPropagation()}>
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
                        ];

                        // Add teachers row if expanded
                        if (isAdmin() && isExpanded && hasTeachers) {
                          rows.push(
                            <tr key={`${center._id}-teachers`}>
                              <td colSpan={isAdmin() ? 7 : 6} className="bg-base-200 p-0">
                                <div className="p-4 pl-12">
                                  <h4 className="font-semibold mb-3 text-sm text-base-content/70">
                                    Teachers at {center.name} ({centerTeachers.length})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {centerTeachers.map((teacher) => (
                                      <div
                                        key={teacher._id}
                                        onClick={() => navigate(`/data/teacher/${teacher._id}`)}
                                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300 hover:border-primary"
                                      >
                                        <div className="card-body p-4">
                                          <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            <h5 className="font-semibold text-sm">{teacher.name}</h5>
                                          </div>
                                          <div className="text-xs text-base-content/60 mt-2">
                                            <p>Email: {teacher.email}</p>
                                            {teacher.education && <p>Education: {teacher.education}</p>}
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
                                  {centerTeachers.length === 0 && (
                                    <p className="text-sm text-base-content/60">No teachers assigned to this center.</p>
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
    </div>
  );
};

export default CentersPage;
