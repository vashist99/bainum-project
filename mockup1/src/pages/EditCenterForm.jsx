import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import axios from "../lib/axios";

const EditCenterForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingCenter, setLoadingCenter] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  // Load center data
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        setLoadingCenter(true);
        const response = await axios.get(`/api/centers/${id}`);
        const center = response.data.center;
        
        if (center) {
          setFormData({
            name: center.name || "",
            address: center.address || "",
            phone: center.phone || "",
            email: center.email || "",
            description: center.description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching center:", error);
        toast.error("Failed to load center data");
        navigate("/centers");
      } finally {
        setLoadingCenter(false);
      }
    };

    if (id) {
      fetchCenter();
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
      toast.error("Center name is required");
      return false;
    }

    // Basic email validation if provided
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
      // Make API call to update center
      await axios.put(`/api/centers/${id}`, formData);

      toast.success("Center updated successfully!");

      // Navigate to centers page
      navigate("/centers");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update center. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating center:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCenter) {
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
            onClick={() => navigate("/centers")}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit Center
          </h1>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Center Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Center Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter center name"
                  className="input input-bordered input-primary w-full"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Address */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Address</span>
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter center address"
                  className="input input-bordered input-primary w-full"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              {/* Phone */}
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

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="center@email.com"
                  className="input input-bordered input-primary w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Enter center description (optional)"
                  className="textarea textarea-bordered textarea-primary w-full"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
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
                      Updating Center...
                    </>
                  ) : (
                    "Update Center"
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

export default EditCenterForm;
