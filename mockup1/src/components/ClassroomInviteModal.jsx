import { useState, useEffect } from "react";
import { UserPlus, X, Users } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

/**
 * Invite-to-classroom panel: lists parents who have accepted their primary
 * invitation and are not yet classroom members, labelled "Parent of <child
 * name(s)>". Confirming adds the selected parents (and their same-center
 * children — enforced server-side) to the classroom.
 */
export default function ClassroomInviteModal({ classroomId, onInvited, onClose }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  // parentId -> Set of selected childIds. Selecting a parent defaults to ALL
  // their children; individual children can then be unchecked (per-child
  // enrollment drives which child pages receive classroom recording data).
  const [selected, setSelected] = useState(new Map());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/classrooms/${classroomId}/eligible-parents`)
      .then((res) => setParents(res.data.parents || []))
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to load parents");
        setParents([]);
      })
      .finally(() => setLoading(false));
  }, [classroomId]);

  const toggleParent = (parent) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(parent.id)) {
        next.delete(parent.id);
      } else {
        next.set(parent.id, new Set((parent.children || []).map((c) => String(c.id))));
      }
      return next;
    });
  };

  const toggleChild = (parentId, childId) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const childSet = new Set(next.get(parentId) || []);
      if (childSet.has(String(childId))) {
        childSet.delete(String(childId));
      } else {
        childSet.add(String(childId));
      }
      next.set(parentId, childSet);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one parent");
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/classrooms/${classroomId}/invite`, {
        invites: [...selected.entries()].map(([parentId, childSet]) => ({
          parentId,
          childIds: [...childSet],
        })),
      });
      const { addedParents = 0, addedChildren = 0, skippedChildren = [] } = response.data || {};
      toast.success(
        `Added ${addedParents} parent${addedParents === 1 ? "" : "s"} and ${addedChildren} child${addedChildren === 1 ? "" : "ren"} to the classroom`
      );
      if (skippedChildren.length > 0) {
        toast(`${skippedChildren.length} child${skippedChildren.length === 1 ? "" : "ren"} skipped (different center)`, { icon: "ℹ️" });
      }
      onInvited?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add parents");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-backdrop bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="modal-box max-w-lg w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto relative z-[100] bg-base-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xl sm:text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary shrink-0" />
            Add Parents to Classroom
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-base-content/70 mb-3">
          Parents who accepted their invitation and are not yet in this classroom.
          Their children at this classroom's center are added automatically.
        </p>
        <div className="divider my-2" />

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : parents.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-base-200 p-4 rounded-full w-fit mx-auto mb-3">
              <Users className="w-8 h-8 text-base-content/50" />
            </div>
            <p className="font-semibold">No eligible parents</p>
            <p className="text-sm text-base-content/60 mt-1">
              Every accepted parent is already in this classroom, or no parents
              have accepted their invitation yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {parents.map((parent) => {
              const children = parent.children || [];
              const childNames = children.map((c) => c.name);
              const isSelected = selected.has(parent.id);
              const childSet = selected.get(parent.id) || new Set();
              return (
                <div
                  key={parent.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:bg-base-200"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mt-1 shrink-0"
                      checked={isSelected}
                      onChange={() => toggleParent(parent)}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {childNames.length > 0
                          ? `Parent of ${childNames.join(", ")}`
                          : parent.name}
                      </p>
                      <p className="text-sm text-base-content/70 truncate">{parent.name}</p>
                    </div>
                  </label>
                  {/* Per-child enrollment: choose WHICH children join the classroom */}
                  {isSelected && children.length > 0 && (
                    <div className="mt-2 ml-8 space-y-1">
                      {children.length > 1 && (
                        <p className="text-xs text-base-content/60">
                          Choose which children to enroll:
                        </p>
                      )}
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-2 cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-secondary shrink-0"
                            checked={childSet.has(String(child.id))}
                            onChange={() => toggleChild(parent.id, child.id)}
                          />
                          <span className="text-sm truncate">{child.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-action flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button onClick={onClose} className="btn btn-ghost w-full sm:w-auto" disabled={submitting}>
            Cancel
          </button>
          <button
            onClick={handleInvite}
            className="btn btn-primary gap-2 w-full sm:w-auto"
            disabled={submitting || selected.size === 0}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Add {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
