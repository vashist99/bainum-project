import { useState, useEffect } from "react";
import { FileText, User, Calendar, Plus, Trash2 } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_PLACEHOLDERS = {
  child:
    "Enter your observations, notes, or comments about the child's progress...",
  classroom:
    "Enter classroom-wide notes, announcements, or observations for parents...",
};

/**
 * Shared notes list + add/delete UI for child and classroom scopes.
 * `canWrite` hides the composer and delete controls (parent read-only on
 * classroom homepage).
 */
export default function NotesSection({
  scope,
  scopeId,
  canWrite = true,
  placeholder,
  className = "",
}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPath =
    scope === "child"
      ? `/api/notes/child/${scopeId}`
      : `/api/notes/classroom/${scopeId}`;

  useEffect(() => {
    if (!scopeId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(fetchPath);
        if (!cancelled) setNotes(response.data.notes || []);
      } catch (error) {
        if (!cancelled) setNotes([]);
        if (error.response?.status !== 403 && error.response?.status !== 404) {
          console.error("Error fetching notes:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNotes();
    return () => {
      cancelled = true;
    };
  }, [scopeId, fetchPath]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const noteData = {
        content: newNote,
        author: user?.name || "Unknown User",
        authorId: user?.id,
        ...(scope === "child"
          ? { childId: scopeId }
          : { classroomId: scopeId }),
      };

      const response = await axios.post("/api/notes", noteData);
      setNotes([response.data.note, ...notes]);
      setNewNote("");
      toast.success("Note added successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to add note";
      toast.error(errorMessage);
      console.error("Error adding note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axios.delete(`/api/notes/${noteId}`);
      setNotes(notes.filter((note) => note._id !== noteId));
      toast.success("Note deleted successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete note";
      toast.error(errorMessage);
      console.error("Error deleting note:", error);
    }
  };

  const emptyMessage = canWrite
    ? "No notes yet. Add your first observation above!"
    : "No notes yet.";

  const resolvedPlaceholder =
    placeholder ?? DEFAULT_PLACEHOLDERS[scope] ?? "Enter a note...";

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Notes & Observations
          <span className="badge badge-primary">{notes.length}</span>
        </h2>
        <div className="divider" />

        {canWrite && (
          <div className="mb-6">
            <label className="label">
              <span className="label-text font-semibold">Add New Note</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-24 focus:textarea-primary"
              placeholder={resolvedPlaceholder}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleAddNote();
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-base-content/60">
                Press Ctrl+Enter to add note
              </span>
              <button
                onClick={handleAddNote}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-6 flex justify-center">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Recent Notes</h3>
            {notes.map((note) => (
              <div key={note._id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-base-content whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div
                        className="flex items-center gap-4 mt-3 text-xs text-base-content/60"
                      >
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(note.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{emptyMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
