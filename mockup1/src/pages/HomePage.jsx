import { useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, isParent, user } = useAuth();

  // Redirect parents to their child's page
  useEffect(() => {
    if (isParent() && user?.childId) {
      navigate(`/data/child/${user.childId}`);
    }
  }, [isParent, user, navigate]);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="text-center max-w-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-6 rounded-full">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome!
          </h1>
          
          <p className="text-xl text-base-content/70 mb-8">
            Your comprehensive platform for managing teachers, children, and educational data.
          </p>
          
          <div className={`grid gap-4 mt-8 ${isAdmin() ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {isAdmin() && (
              <a href="/teachers" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
                <div className="card-body items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="card-title">Teachers</h2>
                  <p className="text-base-content/60">Manage teacher profiles and assignments</p>
                </div>
              </a>
            )}
            
            {!isParent() && (
            <a href="/data" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
              <div className="card-body items-center text-center">
                <div className="bg-secondary/10 p-4 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="card-title">Children & Data</h2>
                <p className="text-base-content/60">Track student progress and view analytics</p>
              </div>
            </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

