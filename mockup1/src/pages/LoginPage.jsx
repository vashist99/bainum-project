import { useState } from "react";
import { User } from "lucide-react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 backdrop-blur-sm">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <User className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-base-content/60 mt-2">
              {isLogin
                ? "Sign in to your account to continue"
                : "Sign up to get started"}
            </p>
          </div>

          {/* Form */}
          {isLogin ? <LoginForm /> : <SignupForm />}

          {/* Toggle Between Login/Signup */}
          <div className="divider text-base-content/40">OR</div>
          <div className="text-center">
            <p className="text-base-content/60">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="link link-primary ml-1 font-bold hover:scale-105 transition-transform inline-block"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;