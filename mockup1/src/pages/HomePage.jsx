import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Sparkles, Mic, Radio, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import ActivityRecordingModal from "../components/ActivityRecordingModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, isParent, isTeacher, user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const handleUploadSuccess = (teacherId) => {
    if (isTeacher()) {
      navigate("/profile");
    } else if (isAdmin() && teacherId) {
      navigate(`/data/teacher/${teacherId}`);
    }
  };

  const handleActivitySuccess = () => {
    if (isParent()) {
      const primary = getPrimaryChildId(user);
      if (primary) navigate(`/data/child/${primary}`);
    } else if (isTeacher()) {
      navigate("/profile");
    }
  };

  const showActivityButton = isTeacher() || isParent();

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="flex items-start sm:items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6">
        <div className="text-center max-w-3xl w-full">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-primary/10 p-4 sm:p-6 rounded-full">
              <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome!
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-base-content/70 mb-6 sm:mb-8 px-2">
            Your comprehensive platform for managing teachers, children, and educational data.
          </p>

          <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {showActivityButton && (
              <button
                onClick={() => setShowActivityModal(true)}
                className="card bg-base-100 shadow-xl active:scale-95 md:hover:shadow-2xl md:hover:scale-105 transition-all duration-200 text-left"
              >
                <div className="card-body items-center text-center p-4 sm:p-6">
                  <div className="bg-error/10 p-3 sm:p-4 rounded-full mb-2">
                    <Radio className="h-7 w-7 sm:h-8 sm:w-8 text-error" />
                  </div>
                  <h2 className="card-title text-lg sm:text-xl">Record Activity</h2>
                  <p className="text-sm sm:text-base text-base-content/60">
                    {isTeacher()
                      ? "Record now — shared with every child you supervise."
                      : "Record now — shared with every child linked to you."}
                  </p>
                </div>
              </button>
            )}

            {(isAdmin() || isTeacher()) && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="card bg-base-100 shadow-xl active:scale-95 md:hover:shadow-2xl md:hover:scale-105 transition-all duration-200 text-left"
              >
                <div className="card-body items-center text-center p-4 sm:p-6">
                  <div className="bg-accent/10 p-3 sm:p-4 rounded-full mb-2">
                    <Mic className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
                  </div>
                  <h2 className="card-title text-lg sm:text-xl">Upload Classroom Recording</h2>
                  <p className="text-sm sm:text-base text-base-content/60">
                    {isAdmin()
                      ? "Upload classroom recording for a teacher"
                      : "Upload a classroom recording for yourself"}
                  </p>
                </div>
              </button>
            )}

            {isAdmin() && (
              <a
                href="/teachers"
                className="card bg-base-100 shadow-xl active:scale-95 md:hover:shadow-2xl md:hover:scale-105 transition-all duration-200"
              >
                <div className="card-body items-center text-center p-4 sm:p-6">
                  <div className="bg-primary/10 p-3 sm:p-4 rounded-full mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="card-title text-lg sm:text-xl">Teachers</h2>
                  <p className="text-sm sm:text-base text-base-content/60">
                    Manage teacher profiles and assignments
                  </p>
                </div>
              </a>
            )}

            {!isParent() && (
              <a
                href="/data"
                className="card bg-base-100 shadow-xl active:scale-95 md:hover:shadow-2xl md:hover:scale-105 transition-all duration-200"
              >
                <div className="card-body items-center text-center p-4 sm:p-6">
                  <div className="bg-secondary/10 p-3 sm:p-4 rounded-full mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h2 className="card-title text-lg sm:text-xl">Children &amp; Data</h2>
                  <p className="text-sm sm:text-base text-base-content/60">
                    Track student progress and view analytics
                  </p>
                </div>
              </a>
            )}

            {isParent() && getPrimaryChildId(user) && (
              <a
                href={`/data/child/${getPrimaryChildId(user)}`}
                className="card bg-base-100 shadow-xl active:scale-95 md:hover:shadow-2xl md:hover:scale-105 transition-all duration-200"
              >
                <div className="card-body items-center text-center p-4 sm:p-6">
                  <div className="bg-secondary/10 p-3 sm:p-4 rounded-full mb-2">
                    <ArrowRight className="h-7 w-7 sm:h-8 sm:w-8 text-secondary" />
                  </div>
                  <h2 className="card-title text-lg sm:text-xl">View My Child&apos;s Data</h2>
                  <p className="text-sm sm:text-base text-base-content/60">
                    See assessments, transcripts, and WPM progress.
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <ClassroomUploadModal
          isAdmin={isAdmin()}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showActivityModal && (
        <ActivityRecordingModal
          role={isTeacher() ? "teacher" : "parent"}
          onSuccess={handleActivitySuccess}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
