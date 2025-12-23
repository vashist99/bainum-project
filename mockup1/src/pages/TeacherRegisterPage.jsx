import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle, GraduationCap, Calendar, Building } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const TeacherRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");

  // Verify invitation token on mount
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setVerifying(false);
        setInvitationValid(false);
        toast.error("No invitation token provided");
        return;
      }

      try {
        const response = await axios.get(`/api/teacher-invitations/verify/${token}`);
        if (response.data.valid) {
          setInvitationValid(true);
          setInvitationData(response.data.invitation);
        } else {
          setInvitationValid(false);
          toast.error("Invalid or expired invitation");
        }
      } catch (error) {
        setInvitationValid(false);
        const errorMessage = error.response?.data?.message || "Invalid invitation";
        toast.error(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!token) {
      toast.error("Invalid invitation link");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/register-teacher", {
        password: formData.password,
        invitationToken: token,
      });

      toast.success("Account created successfully!");

      // Auto-login the teacher
      login(response.data.user);

      // Navigate to home page
      navigate("/home");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create account";
      toast.error(errorMessage);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10">
        <div className="card w-full max-w-md bg-base-100 shadow-2xl">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-base-content/70">Verifying invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-2xl">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-error/10 p-4 rounded-full">
                <XCircle className="w-12 h-12 text-error" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-base-content/70 mb-6">
              This invitation link is invalid or has expired. Please contact an administrator for a new invitation.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-success/10 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Teacher Account
            </h2>
            <p className="text-base-content/60 mt-2">
              You've been invited to join the Bainum Project as a teacher
            </p>
          </div>

          {/* Teacher Info Display */}
          {invitationData && (
            <div className="bg-base-200 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-base-content/60">Name</p>
                  <p className="font-semibold">{invitationData.firstName} {invitationData.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-base-content/60">Email</p>
                  <p className="font-semibold">{invitationData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-base-content/60">Education</p>
                  <p className="font-semibold">{invitationData.education}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-base-content/60">Center</p>
                  <p className="font-semibold">{invitationData.center}</p>
                </div>
              </div>
              {invitationData.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-base-content/60">Date of Birth</p>
                    <p className="font-semibold">
                      {new Date(invitationData.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter password (min. 6 characters)"
                  className="input input-bordered input-primary w-full pl-10 pr-10"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/60" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/60" />
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
                  placeholder="Confirm your password"
                  className="input input-bordered input-primary w-full pl-10"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <div className="divider text-base-content/40">OR</div>
          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="link link-primary font-bold"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegisterPage;

