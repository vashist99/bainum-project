import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in email and password");
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
      const response = await axios.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      toast.success("Login successful!");

      // Login user with response data from database
      login(response.data.user);

      // Navigate to homepage
      navigate("/home");

      // Reset form
      setFormData({
        email: "",
        password: "",
        role: "",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Email</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-primary/60" />
          </div>
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="input input-bordered input-primary w-full pl-10 focus:input-primary transition-all duration-200"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Role Field - Optional, for admin/teacher login */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Role (Optional)</span>
          <span className="label-text-alt text-base-content/60">Leave blank for parent login</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Shield className="h-5 w-5 text-primary/60" />
          </div>
          <select
            name="role"
            className="select select-bordered select-primary w-full pl-10 focus:select-primary transition-all duration-200"
            value={formData.role}
            onChange={handleInputChange}
          >
            <option value="">Auto-detect (Parent/Teacher/Admin)</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Password Field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Password</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-primary/60" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            className="input input-bordered input-primary w-full pl-10 pr-10 focus:input-primary transition-all duration-200"
            value={formData.password}
            onChange={handleInputChange}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-primary/60 hover:text-primary" />
            ) : (
              <Eye className="h-5 w-5 text-primary/60 hover:text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="text-right">
        <a href="#" className="label-text-alt link link-hover text-primary font-semibold">
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <div className="form-control mt-6">
        <button
          type="submit"
          className={`btn btn-primary w-full text-lg shadow-lg hover:shadow-xl transition-all duration-200 ${
            loading ? "loading" : ""
          }`}
          disabled={loading}
          >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;

