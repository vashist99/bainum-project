import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { ArrowLeft } from "lucide-react";

const AddDataForm = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/data")}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Add Data
          </h1>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Data entry form will be implemented here.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDataForm;

