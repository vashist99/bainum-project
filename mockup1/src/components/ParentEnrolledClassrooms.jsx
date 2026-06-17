import { useEffect, useState } from "react";
import { School } from "lucide-react";
import axios from "../lib/axios";
import ClassroomCard from "./ClassroomCard";

/**
 * Grid of classrooms where the signed-in parent's children are enrolled.
 */
export default function ParentEnrolledClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get("/api/classrooms")
      .then((res) => {
        if (!cancelled) setClassrooms(res.data.classrooms || []);
      })
      .catch(() => {
        if (!cancelled) setClassrooms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (classrooms.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
        <div className="card-body items-center text-center py-10">
          <div className="bg-primary/10 p-4 rounded-full mb-2">
            <School className="w-8 h-8 text-primary" />
          </div>
          <h3 className="card-title">No classrooms yet</h3>
          <p className="text-base-content/70 max-w-md">
            Classrooms will appear here once your child&apos;s teacher or an admin
            enrolls them in a classroom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {classrooms.map((classroom) => (
        <ClassroomCard key={classroom.id} classroom={classroom} variant="parent" />
      ))}
    </div>
  );
}
