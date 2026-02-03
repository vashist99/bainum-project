import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import axios from "../lib/axios";

const EditTeacherForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(true);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    education: "",
    dateOfBirth: "",
    center: "",
  });

  // Fetch centers from database
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setLoadingCenters(true);
        const response = await axios.get("/api/centers");
        setCenters(response.data.centers || []);
      } catch (error) {
        console.error("Error fetching centers:", error);
        setCenters([]);
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  // Load teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoadingTeacher(true);
        const response = await axios.get(`/api/teachers/${id}`);
        const teacher = response.data.teacher;
        
        if (teacher) {
          // Split name into first and last name
          const nameParts = teacher.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setFormData({
            firstName,
            lastName,
            email: teacher.email || "",
            education: teacher.education || "",
            dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : "",
            center: teacher.center || "",
          });
        }
      } catch (error) {
        console.error("Error fetching teacher:", error);
        toast.error("Failed to load teacher data");
        navigate("/teachers");
      } finally {
        setLoadingTeacher(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.education ||
      !formData.dateOfBirth ||
      !formData.center
    ) {
      toast.error("Please fill in all fields");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare data for backend
      const teacherData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        center: formData.center,
        education: formData.education,
        dateOfBirth: formData.dateOfBirth,
      };

      // Make API call to update teacher
      await axios.put(`/api/teachers/${id}`, teacherData);

      toast.success("Teacher updated successfully!");

      // Navigate to teachers page
      navigate("/teachers");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update teacher. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating teacher:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTeacher) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/teachers")}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit Teacher
          </h1>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  className="input input-bordered input-primary w-full"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Last Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  className="input input-bordered input-primary w-full"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="teacher@email.com"
                  className="input input-bordered input-primary w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Education */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Education</span>
                </label>
                <input
                  type="text"
                  name="education"
                  placeholder="e.g., Bachelor's in Education"
                  className="input input-bordered input-primary w-full"
                  value={formData.education}
                  onChange={handleInputChange}
                />
              </div>

              {/* Date of Birth */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Date of Birth</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered input-primary w-full"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              {/* Center Dropdown */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Center</span>
                </label>
                <select
                  name="center"
                  className="select select-bordered select-primary w-full"
                  value={formData.center}
                  onChange={handleInputChange}
                  disabled={loadingCenters}
                >
                  <option value="">
                    {loadingCenters ? "Loading centers..." : "Select a center"}
                  </option>
                  {centers.map((center) => (
                    <option key={center._id} value={center.name}>
                      {center.name}
                    </option>
                  ))}
                </select>
                {!loadingCenters && centers.length === 0 && (
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      No centers available. Please add centers first.
                    </span>
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Updating Teacher...
                    </>
                  ) : (
                    "Update Teacher"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeacherForm;
