import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { School, ArrowLeft, Plus } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const CreateClassroomForm = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isTeacher } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [name, setName] = useState("");
  const [centers, setCenters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assistantTeacherId, setAssistantTeacherId] = useState("");
  // Teacher view: own record (name + center), displayed read-only.
  const [ownTeacher, setOwnTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Create Classroom", href: "/classrooms/create" }
  ];

  // Admin: load centers for the selector.
  useEffect(() => {
    if (!isAdmin()) return;
    axios.get("/api/centers")
      .then((res) => setCenters(res.data.centers || []))
      .catch(() => setCenters([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teacher: lead + center come from the logged-in teacher (JWT has no center,
  // so fetch the teacher record for display; the backend derives both anyway).
  useEffect(() => {
    if (!isTeacher() || !user?.id) return;
    axios.get(`/api/teachers/${user.id}`)
      .then((res) => setOwnTeacher(res.data.teacher || null))
      .catch(() => setOwnTeacher(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Center-filtered teacher options (admin lead select + both roles' assistant select).
  const effectiveCenter = isAdmin() ? selectedCenter : ownTeacher?.center || "";
  useEffect(() => {
    if (!effectiveCenter) {
      setTeachers([]);
      return;
    }
    axios.get(`/api/centers/${encodeURIComponent(effectiveCenter)}/teachers`)
      .then((res) => setTeachers(res.data.teachers || []))
      .catch(() => setTeachers([]));
  }, [effectiveCenter]);

  // Keep dependent selections valid when the center changes.
  useEffect(() => {
    setSelectedTeacherId("");
    setAssistantTeacherId("");
  }, [selectedCenter]);

  const leadId = isAdmin() ? selectedTeacherId : user?.id;
  const assistantOptions = teachers.filter((t) => String(t._id) !== String(leadId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Classroom name is required");
      return;
    }
    if (isAdmin() && (!selectedCenter || !selectedTeacherId)) {
      setFormError("Please select a center and a lead teacher");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: name.trim() };
      if (isAdmin()) {
        payload.center = selectedCenter;
        payload.teacherId = selectedTeacherId;
      }
      if (assistantTeacherId) {
        payload.assistantTeacherId = assistantTeacherId;
      }
      const response = await axios.post("/api/classrooms", payload);
      toast.success("Classroom created!");
      const id = response.data.classroom?.id;
      navigate(id ? `/classrooms/${id}` : isAdmin() ? "/classrooms" : "/home");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create classroom";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPath="/classrooms/create"
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebar={sidebarOpen}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-5 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <School className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Create Classroom</h1>
                    <p className="text-sm text-base-content/70">
                      {isAdmin()
                        ? "Pick a center, lead teacher, and optionally an assistant."
                        : "You will be the lead teacher of this classroom."}
                    </p>
                  </div>
                </div>
                <div className="divider my-2" />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text font-semibold">Classroom Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-primary w-full"
                      placeholder="e.g., Sunflowers Room"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      required
                    />
                  </div>

                  {isAdmin() ? (
                    <>
                      <div className="form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-semibold">Center</span>
                        </label>
                        <select
                          className="select select-bordered select-primary w-full"
                          value={selectedCenter}
                          onChange={(e) => setSelectedCenter(e.target.value)}
                          required
                        >
                          <option value="">Select a center...</option>
                          {centers.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-semibold">Lead Teacher</span>
                        </label>
                        <select
                          className="select select-bordered select-primary w-full"
                          value={selectedTeacherId}
                          onChange={(e) => {
                            setSelectedTeacherId(e.target.value);
                            if (e.target.value === assistantTeacherId) setAssistantTeacherId("");
                          }}
                          disabled={!selectedCenter}
                          required
                        >
                          <option value="">
                            {selectedCenter ? "Select a teacher..." : "Select a center first"}
                          </option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-semibold">Lead Teacher</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={ownTeacher?.name || user?.name || ""}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-semibold">Center</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={ownTeacher?.center || "Loading..."}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text font-semibold">Assistant Teacher</span>
                      <span className="label-text-alt text-base-content/60">Optional</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={assistantTeacherId}
                      onChange={(e) => setAssistantTeacherId(e.target.value)}
                      disabled={!effectiveCenter || (isAdmin() && !selectedTeacherId)}
                    >
                      <option value="">
                        {effectiveCenter ? "No assistant" : "Select a center first"}
                      </option>
                      {assistantOptions.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                    <label className="label py-1">
                      <span className="label-text-alt text-base-content/60">
                        Assistants get the same classroom access as the lead teacher.
                      </span>
                    </label>
                  </div>

                  {formError && (
                    <div className="alert alert-error py-2 text-sm">
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="btn btn-ghost w-full sm:w-auto"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary gap-2 w-full sm:w-auto"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Create Classroom
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateClassroomForm;
