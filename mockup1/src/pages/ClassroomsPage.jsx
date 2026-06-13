import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ClassroomCard from "../components/ClassroomCard";
import { Plus, School, Search } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ClassroomsPage = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Classrooms", href: "/classrooms" }
  ];

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/classrooms");
        setClassrooms(response.data.classrooms || []);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        toast.error("Failed to load classrooms");
        setClassrooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const term = searchTerm.trim().toLowerCase();
  const filteredClassrooms = term
    ? classrooms.filter((c) =>
        [c.name, c.teacher?.name, c.assistantTeacher?.name, c.center]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))
      )
    : classrooms;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <School className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Classrooms</h1>
                  <p className="text-base-content/70 text-sm">
                    All classrooms across every center
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/classrooms/create")}
                className="btn btn-primary gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Create Classroom
              </button>
            </div>

            <div className="form-control w-full max-w-md mb-6">
              <label className="input input-bordered flex items-center gap-2">
                <Search className="w-4 h-4 text-base-content/50" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Search by classroom, teacher, or center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : filteredClassrooms.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClassrooms.map((classroom) => (
                  <ClassroomCard key={classroom.id} classroom={classroom} />
                ))}
              </div>
            ) : (
              <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                <div className="card-body items-center text-center py-16">
                  <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <School className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="card-title">
                    {term ? "No classrooms match your search" : "No classrooms yet"}
                  </h3>
                  <p className="text-base-content/70 max-w-md">
                    {term
                      ? "Try a different classroom, teacher, or center name."
                      : "Create the first classroom to get started."}
                  </p>
                  {!term && (
                    <button
                      onClick={() => navigate("/classrooms/create")}
                      className="btn btn-primary gap-2 mt-3"
                    >
                      <Plus className="w-4 h-4" />
                      Create Classroom
                    </button>
                  )}
                </div>
              </div>
            )}
      </div>
    </AppLayout>
  );
};

export default ClassroomsPage;
