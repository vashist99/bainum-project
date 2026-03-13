import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 backdrop-blur-sm">
          <div className="card-body">
            <div className="text-center">
              <div className="avatar placeholder mb-4">
                <div className="bg-error/20 text-error rounded-full w-16">
                  <KeyRound className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-error">Invalid Reset Link</h2>
              <p className="text-base-content/60 mt-2">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password" className="btn btn-primary mt-6">
                Request New Reset Link
              </Link>
              <Link to="/" className="btn btn-ghost mt-2">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 backdrop-blur-sm">
          <div className="card-body">
            <div className="text-center">
              <div className="avatar placeholder mb-4">
                <div className="bg-success/20 text-success rounded-full w-16">
                  <Lock className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-success">Password Reset Successfully</h2>
              <p className="text-base-content/60 mt-2">
                You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="btn btn-primary mt-6 w-full"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 backdrop-blur-sm">
        <div className="card-body">
          <div className="text-center mb-6">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <KeyRound className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Set New Password
            </h2>
            <p className="text-base-content/60 mt-2">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">New Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary/60" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="••••••••"
                  className="input input-bordered input-primary w-full pl-10 pr-10"
                  value={formData.newPassword}
                  onChange={handleChange}
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-primary/60" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary/60" />
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  className="input input-bordered input-primary w-full pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5 text-primary/60" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/" className="link link-primary text-sm">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
