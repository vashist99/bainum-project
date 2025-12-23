import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { Mail, Lock, User, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SignupForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.role) {
      toast.error("Please fill in all fields");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      const response = await axios.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      toast.success("Account created successfully!");

      // Login user with response data from database
      login(response.data.user);

      // Navigate to homepage
      navigate("/home");

      // Reset form
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "",
        confirmPassword: "",
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
      {/* Name Field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Full Name</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-primary/60" />
          </div>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            className="input input-bordered input-primary w-full pl-10 focus:input-primary transition-all duration-200"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Role Field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Role</span>
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
            <option value="">Select your role</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

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

      {/* Confirm Password Field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Confirm Password</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-primary/60" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="••••••••"
            className="input input-bordered input-primary w-full pl-10 focus:input-primary transition-all duration-200"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
        </div>
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
            "Sign Up"
          )}
        </button>
      </div>
    </form>
  );
};

export default SignupForm;

