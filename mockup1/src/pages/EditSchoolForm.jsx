import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import AppLayout from "../components/AppLayout";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import axios from "../lib/axios";
import { schoolFromEntityResponse } from "../utils/schools.js";

const EditSchoolForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoadingSchool(true);
        const response = await axios.get(`/api/schools/${id}`);
        const school = schoolFromEntityResponse(response.data);
        
        if (school) {
          setFormData({
            name: school.name || "",
            address: school.address || "",
            phone: school.phone || "",
            email: school.email || "",
            description: school.description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching school:", error);
        toast.error("Failed to load school data");
        navigate("/schools");
      } finally {
        setLoadingSchool(false);
      }
    };

    if (id) {
      fetchSchool();
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error("School name is required");
      return false;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await axios.put(`/api/schools/${id}`, formData);

      toast.success("School updated successfully!");

      navigate("/schools");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update school. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating school:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSchool) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/schools")}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit School
          </h1>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">School Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter school name"
                  className="input input-bordered input-primary w-full"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Address</span>
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter school address"
                  className="input input-bordered input-primary w-full"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Phone</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  className="input input-bordered input-primary w-full"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="school@email.com"
                  className="input input-bordered input-primary w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Enter school description (optional)"
                  className="textarea textarea-bordered textarea-primary w-full"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Updating School...
                    </>
                  ) : (
                    "Update School"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditSchoolForm;
