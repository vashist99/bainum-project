import { useState } from "react";
import { Link } from "react-router";
import { Mail, KeyRound } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
      toast.success("Check your email for reset instructions.");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
              Forgot Password
            </h2>
            <p className="text-base-content/60 mt-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="alert alert-success">
                <span>If an account exists with that email, you will receive password reset instructions shortly.</span>
              </div>
              <Link to="/" className="btn btn-primary w-full">
                Back to Sign In
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="btn btn-ghost w-full"
              >
                Request another link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="your@email.com"
                    className="input input-bordered input-primary w-full pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
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
                    "Send Reset Link"
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link to="/" className="link link-primary text-sm">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
