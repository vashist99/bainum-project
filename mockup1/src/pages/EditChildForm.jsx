import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import axios from "../lib/axios";

const EditChildForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingChild, setLoadingChild] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    diagnosis: "",
    primaryLanguage: "",
    leadTeacher: "",
  });

  // Fetch teachers from database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const response = await axios.get("/api/teachers");
        setTeachers(response.data.teachers || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  // Load child data
  useEffect(() => {
    const fetchChild = async () => {
      try {
        setLoadingChild(true);
        const response = await axios.get(`/api/children/${id}`);
        const child = response.data.child;
        
        if (child) {
          // Split name into first and last name
          const nameParts = child.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setFormData({
            firstName,
            lastName,
            dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : "",
            gender: child.gender || "",
            diagnosis: child.diagnosis || "",
            primaryLanguage: child.primaryLanguage || "",
            leadTeacher: child.leadTeacher || "",
          });
        }
      } catch (error) {
        console.error("Error fetching child:", error);
        toast.error("Failed to load child data");
        navigate("/data");
      } finally {
        setLoadingChild(false);
      }
    };

    if (id) {
      fetchChild();
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
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.diagnosis ||
      !formData.primaryLanguage ||
      !formData.leadTeacher
    ) {
      toast.error("Please fill in all fields");
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
      const childData = {
        name: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        diagnosis: formData.diagnosis,
        primaryLanguage: formData.primaryLanguage,
        leadTeacher: formData.leadTeacher,
      };

      // Make API call to update child
      await axios.put(`/api/children/${id}`, childData);

      toast.success("Child updated successfully!");

      // Navigate to data page
      navigate("/data");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update child. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating child:", error);
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    "English",
    "Spanish",
    "Mandarin",
    "French",
    "German",
    "Arabic",
    "Hindi",
    "Portuguese",
    "Russian",
    "Japanese",
    "Korean",
    "Italian",
    "Other",
  ];

  if (loadingChild) {
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
            onClick={() => navigate("/data")}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit Child
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

              {/* Gender */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Gender</span>
                </label>
                <select
                  name="gender"
                  className="select select-bordered select-primary w-full"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Diagnosis */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Diagnosis</span>
                </label>
                <select
                  name="diagnosis"
                  className="select select-bordered select-primary w-full"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                >
                  <option value="">Select diagnosis status</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Primary Language */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Primary Language</span>
                </label>
                <select
                  name="primaryLanguage"
                  className="select select-bordered select-primary w-full"
                  value={formData.primaryLanguage}
                  onChange={handleInputChange}
                >
                  <option value="">Select primary language</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Teacher */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Lead Teacher</span>
                </label>
                <select
                  name="leadTeacher"
                  className="select select-bordered select-primary w-full"
                  value={formData.leadTeacher}
                  onChange={handleInputChange}
                  disabled={loadingTeachers}
                >
                  <option value="">
                    {loadingTeachers ? "Loading teachers..." : "Select lead teacher"}
                  </option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher.name}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                {!loadingTeachers && teachers.length === 0 && (
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      No teachers available. Please add teachers first.
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
                      Updating Child...
                    </>
                  ) : (
                    "Update Child"
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

export default EditChildForm;
