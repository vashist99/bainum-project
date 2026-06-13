import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ClassroomCard from "../components/ClassroomCard";
import { Sparkles, Radio, ArrowRight, Plus, School, LayoutGrid } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import axios from "../lib/axios";
import ActivityRecordingModal from "../components/ActivityRecordingModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, isParent, isTeacher, user } = useAuth();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" }
  ];

  // Teachers see cards for every classroom they lead or assist; parents see
  // cards for the classrooms their children are enrolled in.
  useEffect(() => {
    if (!isTeacher() && !isParent()) return;
    setClassroomsLoading(true);
    axios.get("/api/classrooms")
      .then((res) => setClassrooms(res.data.classrooms || []))
      .catch(() => setClassrooms([]))
      .finally(() => setClassroomsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleActivitySuccess = () => {
    const primary = getPrimaryChildId(user);
    if (primary) navigate(`/data/child/${primary}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                  </h1>
                  <p className="text-base-content/70 mt-1">
                    Here's what's happening in your educational platform today.
                  </p>
                </div>
              </div>
            </div>

            {/* Teacher: classroom cards (lead + assisted) */}
            {isTeacher() && (
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    My Classrooms
                  </h2>
                  <button
                    onClick={() => navigate("/classrooms/create")}
                    className="btn btn-primary btn-sm sm:btn-md gap-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create Classroom
                  </button>
                </div>

                {classroomsLoading ? (
                  <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                  </div>
                ) : classrooms.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {classrooms.map((classroom) => (
                      <ClassroomCard key={classroom.id} classroom={classroom} />
                    ))}
                  </div>
                ) : (
                  <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                    <div className="card-body items-center text-center py-12">
                      <div className="bg-primary/10 p-4 rounded-full mb-2">
                        <School className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="card-title">No classrooms yet</h3>
                      <p className="text-base-content/70 max-w-md">
                        Create your first classroom to start recording sessions and
                        tracking your children's language development together.
                      </p>
                      <button
                        onClick={() => navigate("/classrooms/create")}
                        className="btn btn-primary gap-2 mt-3"
                      >
                        <Plus className="w-4 h-4" />
                        Create Classroom
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin: classroom quick actions (full list lives on the Classrooms page) */}
            {isAdmin() && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  Classrooms
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-3xl">
                  <button
                    onClick={() => navigate("/classrooms/create")}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-primary/50"
                  >
                    <div className="card-body p-6">
                      <div className="bg-primary/10 p-3 rounded-lg w-fit mb-3">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="card-title text-lg">Create Classroom</h3>
                      <p className="text-sm text-base-content/70 mt-2">
                        Set up a new classroom with a lead teacher (and optional assistant) at any center.
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/classrooms")}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-secondary/50"
                  >
                    <div className="card-body p-6">
                      <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                        <LayoutGrid className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="card-title text-lg">View All Classrooms</h3>
                      <p className="text-sm text-base-content/70 mt-2">
                        Browse every classroom across all centers.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Parent: classrooms their children are enrolled in (no stat cards) */}
            {isParent() && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    My Children's Classrooms
                  </h2>
                  {classroomsLoading ? (
                    <div className="flex justify-center py-12">
                      <span className="loading loading-spinner loading-lg text-primary" />
                    </div>
                  ) : classrooms.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {classrooms.map((classroom) => (
                        <ClassroomCard key={classroom.id} classroom={classroom} variant="parent" />
                      ))}
                    </div>
                  ) : (
                    <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                      <div className="card-body items-center text-center py-10">
                        <div className="bg-primary/10 p-4 rounded-full mb-2">
                          <School className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="card-title">No classrooms yet</h3>
                        <p className="text-base-content/70 max-w-md">
                          Classrooms will appear here once your child's teacher or an
                          admin enrolls them in a classroom.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-base-content mb-4">Recording Tools</h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-error/50"
                    >
                      <div className="card-body p-6">
                        <div className="bg-error/10 p-3 rounded-lg w-fit mb-3">
                          <Radio className="h-6 w-6 text-error" />
                        </div>
                        <h3 className="card-title text-lg">Record Activity</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                          Record now — shared with every child linked to you.
                        </p>
                      </div>
                    </button>

                    {getPrimaryChildId(user) && (
                      <a
                        href={`/data/child/${getPrimaryChildId(user)}`}
                        className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 border border-base-200 hover:border-secondary/50"
                      >
                        <div className="card-body p-6">
                          <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                            <ArrowRight className="h-6 w-6 text-secondary" />
                          </div>
                          <h3 className="card-title text-lg">View My Child's Data</h3>
                          <p className="text-sm text-base-content/70 mt-2">
                            See assessments, transcripts, and WPM progress.
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

      {/* Parent activity recording modal (opened from the Record Activity card) */}
      {showActivityModal && (
        <ActivityRecordingModal
          role="parent"
          onSuccess={handleActivitySuccess}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </AppLayout>
  );
};

export default HomePage;
