/**
 * Pure UI authorization helpers for classroom membership actions on
 * `/classrooms/:id`. Keeps the visibility rules testable without a DOM harness.
 */

/** Admin or the classroom's lead teacher may remove a child (D7). */
export function canRemoveChildFromClassroom({
  isAdmin,
  userRole,
  userId,
  leadTeacherId,
}) {
  if (isAdmin) return true;
  if (userRole !== "teacher") return false;
  return String(userId ?? "") === String(leadTeacherId ?? "");
}

/** Copy shown in the per-child remove confirmation modal. */
export const REMOVE_CHILD_MODAL_BULLETS = [
  "Past recordings stay on the child's data page; classroom aggregates and transcripts no longer include them.",
  "If the parent has no other children in this classroom, they are also removed and will receive a notification.",
  "The parent and child accounts themselves are not deleted.",
  "Historical assessments retain their classroom attribution for reporting.",
];
