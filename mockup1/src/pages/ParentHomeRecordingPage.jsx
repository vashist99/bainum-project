import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ActivityRecordingForm from "../components/ActivityRecordingForm";
import { Radio } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "../lib/axios";

const ParentHomeRecordingPage = () => {
  const navigate = useNavigate();
  const { isParent, user } = useAuth();
  const [linkedChildren, setLinkedChildren] = useState([]);
  const [childId, setChildId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isParent()) {
      setLoading(false);
      return;
    }
    axios
      .get("/api/children")
      .then((res) => {
        const kids = (res.data.children || []).map((c) => ({
          _id: c._id,
          name: c.name,
        }));
        setLinkedChildren(kids);
        if (kids.length === 1) {
          setChildId(String(kids[0]._id));
        }
      })
      .catch(() => setLinkedChildren([]))
      .finally(() => setLoading(false));
  }, [isParent, user?.id]);

  if (!isParent()) {
    return <Navigate to="/home" replace />;
  }

  const breadcrumbs = [
    { label: "Home", href: "/home/recording" },
  ];

  const handleSuccess = () => {
    if (childId) {
      navigate(`/data/child/${childId}`);
    } else {
      navigate("/home");
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-error/10 p-3 rounded-xl">
              <Radio className="w-7 h-7 text-error" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Home Recording</h1>
              <p className="text-base-content/70 mt-1">
                Record or upload audio from home for a linked child.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : linkedChildren.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
            <div className="card-body items-center text-center py-12">
              <h2 className="card-title">No children linked yet</h2>
              <p className="text-base-content/70 max-w-md">
                Accept your parent invitation email to link a child before recording at home.
              </p>
            </div>
          </div>
        ) : (
          <ActivityRecordingForm
            role="parent"
            variant="page"
            linkedChildren={linkedChildren}
            childId={childId}
            onChildIdChange={setChildId}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ParentHomeRecordingPage;
