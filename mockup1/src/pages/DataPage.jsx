import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { Users, ChevronRight, UserPlus, Mail, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, User } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import ViewModeToggle from "../components/ViewModeToggle.jsx";
import useViewMode, { VIEW_MODE_TILES } from "../hooks/useViewMode.js";
import useSortableList from "../hooks/useSortableList.js";

const DataPage = () => {
  const navigate = useNavigate();
  const { user, isTeacher, isParent, isAdmin } = useAuth();

  // Redirect parents to their child's page
  useEffect(() => {
    const primary = getPrimaryChildId(user);
    if (isParent() && primary) {
      navigate(`/data/child/${primary}`, { replace: true });
    }
  }, [isParent, user, navigate]);

  const [pendingParentAccess, setPendingParentAccess] = useState([]);

  useEffect(() => {
    if (!isTeacher() || !user) return;
    axios
      .get("/api/access/pending-for-teacher")
      .then((res) => setPendingParentAccess(res.data?.pending || []))
      .catch(() => setPendingParentAccess([]));
  }, [isTeacher, user]);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalChildren, setInviteModalChildren] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  /** Child ids selected in the table for bulk invite (checkboxes) */
  const [selectedChildIdsForBulk, setSelectedChildIdsForBulk] = useState(() => new Set());
  /** Child ids that already have a parent invitation sent (any status) */
  const [invitedChildIds, setInvitedChildIds] = useState(() => new Set());
  const [childrenViewMode, setChildrenViewMode] = useViewMode("children");

  useEffect(() => {
    if (!isAdmin() && !isTeacher()) return;
    axios
      .get("/api/invitations/list")
      .then((res) => {
        const next = new Set();
        (res.data?.invitations || []).forEach((inv) => {
          if (Array.isArray(inv?.childIds) && inv.childIds.length) {
            inv.childIds.forEach((id) => id != null && next.add(String(id)));
          } else if (inv?.childId != null) {
            next.add(String(inv.childId));
          }
        });
        setInvitedChildIds(next);
      })
      .catch(() => {});
  }, [isAdmin, isTeacher]);

  // Load teachers and children from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teachers from database
        const teachersResponse = await axios.get("/api/teachers");
        const teachersList = teachersResponse.data.teachers || [];
        // console.log("Teachers from DB:", teachersList);
        setTeachers(teachersList);

        // Fetch children from database
        const childrenResponse = await axios.get("/api/children");
        const childrenList = childrenResponse.data.children || [];
        // console.log("Children from DB:", childrenList);
        setChildren(childrenList);

      } catch (error) {
        console.error("Error fetching data:", error);
        setTeachers([]);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-select the teacher's center when a teacher lands on this page.
  useEffect(() => {
    if (loading || !isTeacher() || selectedTeacher) return;
    const myTeacher = (teachers || []).find(
      (t) => String(t._id) === String(user?.id) || (user?.name && t.name === user.name)
    );
    if (myTeacher?.center) {
      setSelectedTeacher(myTeacher.center);
    }
  }, [loading, isTeacher, user, selectedTeacher, teachers]);

  // Filter children by selected center. Teachers' supervised list is
  // already scoped server-side; the center filter is primarily for admins.
  useEffect(() => {
    if (selectedTeacher) {
      const filtered = children.filter((child) => child.center === selectedTeacher);
      setFilteredChildren(filtered);
    } else {
      if (isAdmin() || isTeacher()) {
        setFilteredChildren(children);
      } else {
        setFilteredChildren([]);
      }
    }
  }, [selectedTeacher, children, isAdmin, isTeacher]);

  useEffect(() => {
    setSelectedChildIdsForBulk((prev) => {
      const allowed = new Set(
        filteredChildren.map((c) => String(c._id || c.id || ""))
      );
      const next = new Set();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredChildren]);

  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
  };

  const childDocId = (child) => String(child?._id || child?.id || "");
  const hasLinkedParentAccount = (child) =>
    Array.isArray(child?.parents) && child.parents.length > 0;

  const isChildEligibleForInvite = (child) => {
    const cid = childDocId(child);
    return cid && !invitedChildIds.has(cid) && !hasLinkedParentAccount(child);
  };

  const toggleBulkChild = (child) => {
    const cid = childDocId(child);
    if (!cid || !isChildEligibleForInvite(child)) return;
    setSelectedChildIdsForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  const processInviteResponse = async (response, label) => {
    if (response.data.warning || response.data.invitation?.invitationLink) {
      const link =
        response.data.invitation?.invitationLink ||
        response.data.invitationLink ||
        `${window.location.origin}/parent/register?token=${response.data.invitation?.token}`;

      const errorMsg = response.data.emailError ? `\n\nError: ${response.data.emailError}` : "";
      toast.error(`Invitation created but email failed to send (${label}).${errorMsg}`, {
        duration: 15000,
      });

      await new Promise((r) => setTimeout(r, 300));
      const message = `Email not configured. Please copy and share this invitation link with the parent (${label}):${errorMsg}\n\n${link}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success(`Invitation link copied (${label})`);
        alert(message);
      } catch {
        prompt(message, link);
      }
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!inviteModalChildren.length) {
      toast.error("No children selected");
      return;
    }

    const ids = inviteModalChildren.map((ch) => ch._id || ch.id).filter(Boolean);
    const label = inviteModalChildren.map((c) => c.name || "child").join(", ");

    setSendingInvite(true);
    try {
      const response = await axios.post("/api/invitations/send", {
        email: inviteEmail.trim(),
        childIds: ids,
        userId: user?.id,
        userRole: user?.role,
        userName: user?.name,
      });

      await processInviteResponse(response, label);

      if (!response.data.warning && !response.data.invitation?.invitationLink) {
        if (response.data.mergedWithPending || response.data.linkedExistingParent) {
          toast.success(
            response.data.message ||
              "Parent contact email saved on each child; no duplicate invitation email was sent."
          );
        } else {
          toast.success(
            ids.length > 1
              ? `One invitation sent to ${inviteEmail.trim()} for ${label}`
              : "Invitation sent successfully!"
          );
        }
      }

      setInvitedChildIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(String(id)));
        return next;
      });

      setShowInviteModal(false);
      setInviteEmail("");
      setInviteModalChildren([]);
      setSelectedChildIdsForBulk((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(String(id)));
        return n;
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send invitation";
      toast.error(errorMessage);

      if (error.response?.data?.invitation?.invitationLink || error.response?.data?.invitationLink) {
        const link =
          error.response.data.invitation?.invitationLink || error.response.data.invitationLink;
        setTimeout(() => {
          prompt(`Invitation created but email failed. Share this link manually:`, link);
        }, 500);
      }
    } finally {
      setSendingInvite(false);
    }
  };

  const openInviteModal = (child) => {
    const cid = childDocId(child);
    if (!cid || invitedChildIds.has(cid)) {
      return;
    }
    setInviteModalChildren([child]);
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteModalChildren([]);
  };

  const getAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return 9999; // put missing at end when sorting
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return 9999;
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months -= 1;
    return Math.max(0, months);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "—";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return "—";
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months -= 1;
    if (months < 0) return "—";
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years} yrs` : `${years} yrs ${rem} mo`;
  };

  // Sortable column descriptors. Keys are persisted into
  // `data-sort:children` and have to stay stable across releases — see
  // design.md D5. `actions`/`avatar`/`select` are omitted because they
  // aren't sortable.
  const childrenColumns = [
    { key: "name", label: "Name", getter: (c) => c?.name },
    { key: "age", label: "Age", getter: (c) => getAgeInMonths(c?.dateOfBirth) },
    { key: "language", label: "Language", getter: (c) => c?.primaryLanguage },
    { key: "center", label: "School", getter: (c) => c?.center ?? c?.school },
  ];

  const {
    sortedItems: sortedChildren,
    activeSort: childrenSort,
    cycleSort: cycleChildrenSort,
    ariaSortFor: childrenAriaSortFor,
  } = useSortableList(filteredChildren, "children", childrenColumns);

  const renderSortIcon = (columnKey, activeSort) => {
    if (!activeSort || activeSort.column !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" aria-hidden="true" />;
    }
    return activeSort.direction === "asc" ? (
      <ArrowUp className="w-3 h-3" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3 h-3" aria-hidden="true" />
    );
  };

  const bulkEligibleChildren = sortedChildren.filter(isChildEligibleForInvite);
  const allBulkEligibleSelected =
    bulkEligibleChildren.length > 0 &&
    bulkEligibleChildren.every((c) => selectedChildIdsForBulk.has(childDocId(c)));

  const toggleSelectAllBulkEligible = () => {
    if (allBulkEligibleSelected) {
      setSelectedChildIdsForBulk(new Set());
      return;
    }
    setSelectedChildIdsForBulk(new Set(bulkEligibleChildren.map((c) => childDocId(c))));
  };

  const openBulkInviteFromSelection = () => {
    const selected = sortedChildren.filter(
      (c) => isChildEligibleForInvite(c) && selectedChildIdsForBulk.has(childDocId(c))
    );
    if (selected.length === 0) {
      toast.error("Select at least one child who has not been invited yet");
      return;
    }
    setInviteModalChildren(selected);
    setShowInviteModal(true);
  };

  const handleApproveParentAccess = async (grantId) => {
    try {
      await axios.patch(`/api/access/grants/${grantId}/approve`);
      toast.success("Access approved");
      setPendingParentAccess((p) => p.filter((g) => g._id !== grantId));
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not approve");
    }
  };

  const handleDeleteChild = async (childId) => {
    if (window.confirm("Are you sure you want to delete this child? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/children/${childId}`);
        setChildren(children.filter((child) => (child._id || child.id) !== childId));
        setFilteredChildren(filteredChildren.filter((child) => (child._id || child.id) !== childId));
        toast.success("Child deleted successfully");
      } catch (error) {
        console.error("Error deleting child:", error);
        const errorMessage = error.response?.data?.message || "Failed to delete child";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6">
        {/* DEBUG INFO - REMOVE LATER */}
        {/* <div className="alert alert-warning mb-4">
          <div>
            <h3 className="font-bold">Debug Info:</h3>
            <p>User: {JSON.stringify(user)}</p>
            <p>Is Teacher: {isTeacher() ? "Yes" : "No"}</p>
            <p>Selected Teacher: {selectedTeacher || "None"}</p>
            <p>Children Count: {children.length}</p>
            <p>Filtered Children: {filteredChildren.length}</p>
          </div>
        </div> */}

        {isTeacher() && pendingParentAccess.length > 0 && (
          <div className="alert alert-info mb-4">
            <div className="w-full">
              <h3 className="font-bold">Parent requests to view your classroom data</h3>
              <ul className="mt-2 space-y-2">
                {pendingParentAccess.map((g) => (
                  <li key={g._id} className="flex flex-wrap items-center justify-between gap-2 border border-base-300 rounded-lg p-2">
                    <span className="text-sm">
                      {(g.parentId?.name || "Parent") + " — child: " + (g.childId?.name || "—")}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleApproveParentAccess(g._id)}
                    >
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content mb-2">Children</h1>
            <p className="text-base-content/70">
              {isAdmin()
                ? "View and manage children across your schools"
                : "View children at your school"}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/children/add")}
              className="btn btn-primary gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Child
            </button>
          </div>
        </div>

        {(() => {
          // Distinct centers derived from the loaded teachers list. Cheap
          // enough to recompute on every render; switch to a memo if the
          // teachers list ever grows materially.
          const centerOptions = [...new Set(
            (teachers || [])
              .map((t) => (t?.center || "").trim())
              .filter(Boolean)
          )].sort((a, b) => a.localeCompare(b));

          if (isTeacher()) {
            return (
              <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body">
                  <div className="alert alert-info">
                    <Users className="w-5 h-5" />
                    <span>
                      Viewing children at your school
                      {selectedTeacher ? <>: <strong>{selectedTeacher}</strong></> : null}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <div className="form-control w-full max-w-md">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Filter by School ({centerOptions.length} available)
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-primary w-full"
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                    disabled={loading}
                  >
                    <option value="">{loading ? "Loading schools..." : "All schools"}</option>
                    {centerOptions.map((centerName) => (
                      <option key={centerName} value={centerName}>
                        {centerName}
                      </option>
                    ))}
                  </select>
                </div>
                {!loading && centerOptions.length === 0 && (
                  <div className="alert alert-warning mt-4">
                    <span>No schools found yet. Add teachers (each carries a school) to populate this list.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Children list - shows for selected teacher or all children for admins.
            Outer card is shared; inner body switches between Tile and Table
            renderers via `childrenViewMode`. */}
        {(selectedTeacher || (isAdmin() && children.length > 0)) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h2 className="card-title">
                  {selectedTeacher ? `Children at ${selectedTeacher}` : "All Children"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <ViewModeToggle
                    value={childrenViewMode}
                    onChange={setChildrenViewMode}
                    ariaLabel="Children list view mode"
                  />
                  {bulkEligibleChildren.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm gap-2"
                      onClick={openBulkInviteFromSelection}
                      disabled={selectedChildIdsForBulk.size === 0}
                      title={
                        selectedChildIdsForBulk.size === 0
                          ? "Select one or more children using the checkboxes"
                          : "Send one parent invitation email covering all selected children"
                      }
                    >
                      <Mail className="w-4 h-4" />
                      Invite parent for selected
                      {selectedChildIdsForBulk.size > 0 ? ` (${selectedChildIdsForBulk.size})` : ""}
                    </button>
                  )}
                </div>
              </div>

              {filteredChildren.length === 0 ? (
                <p className="text-center text-base-content/60 py-8">
                  No children found.
                </p>
              ) : childrenViewMode === VIEW_MODE_TILES ? (
                /* Tile mode — responsive grid of cards. 1 col mobile,
                   2 cols md, 3 cols xl. Each tile mirrors the existing
                   teacher-card visual language (avatar circle, name link,
                   meta badges, action footer). */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedChildren.map((child, index) => (
                    <div
                      key={child._id || child.id}
                      className="card bg-base-200 border border-base-300 hover:shadow-lg transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <label
                            className={`flex items-start pt-1 shrink-0 ${
                              isChildEligibleForInvite(child) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                            }`}
                            title={
                              isChildEligibleForInvite(child)
                                ? "Include in bulk parent invite"
                                : "Invitation already sent for this child"
                            }
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={selectedChildIdsForBulk.has(childDocId(child))}
                              onChange={() => toggleBulkChild(child)}
                              disabled={!isChildEligibleForInvite(child)}
                            />
                          </label>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xs text-base-content/60">#{index + 1}</span>
                              <button
                                onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                                className="link link-primary font-semibold hover:underline truncate"
                              >
                                {child.name}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="badge badge-outline badge-sm">
                                {calculateAge(child.dateOfBirth)}
                              </span>
                              {child.primaryLanguage && (
                                <span className="badge badge-info badge-sm">
                                  {child.primaryLanguage}
                                </span>
                              )}
                              {child.center && (
                                <span className="badge badge-secondary badge-sm">
                                  {child.center}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end pt-3 mt-3 border-t border-base-300">
                          <button
                            onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                            className="btn btn-ghost btn-xs"
                            title="View details"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigate(`/children/edit/${child._id || child.id}`)}
                            className="btn btn-ghost btn-xs"
                            title="Edit child"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteChild(child._id || child.id)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete child"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {hasLinkedParentAccount(child) ? (
                            <span
                              className="btn btn-ghost btn-xs gap-1 no-animation pointer-events-none opacity-80 cursor-default border border-base-300"
                              title="This child already has a linked parent account"
                            >
                              Parent linked
                            </span>
                          ) : invitedChildIds.has(String(child._id || child.id)) ? (
                            <span
                              className="btn btn-ghost btn-xs gap-1 no-animation pointer-events-none opacity-80 cursor-default border border-base-300"
                              title="Invitation already sent for this child"
                            >
                              Invited
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openInviteModal(child)}
                              className="btn btn-primary btn-xs gap-1"
                              title="Send invitation to parent"
                            >
                              <Mail className="w-3 h-3" />
                              Invite
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table mode — preserved structure from before; column
                   headers are now buttons wired into `cycleChildrenSort`
                   with `aria-sort` set per column. */
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-12">
                          {bulkEligibleChildren.length > 0 ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs px-1 min-h-0 h-8"
                              onClick={toggleSelectAllBulkEligible}
                              title={allBulkEligibleSelected ? "Clear selection" : "Select all not yet invited"}
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-base-content/40 text-xs" title="No children available for invite">
                              —
                            </span>
                          )}
                        </th>
                        <th>#</th>
                        <th aria-sort={childrenAriaSortFor("name")}>
                          <button
                            type="button"
                            onClick={() => cycleChildrenSort("name")}
                            className="flex items-center gap-1 hover:underline"
                          >
                            Name
                            {renderSortIcon("name", childrenSort)}
                          </button>
                        </th>
                        <th aria-sort={childrenAriaSortFor("age")}>
                          <button
                            type="button"
                            onClick={() => cycleChildrenSort("age")}
                            className="flex items-center gap-1 hover:underline"
                          >
                            Age
                            {renderSortIcon("age", childrenSort)}
                          </button>
                        </th>
                        <th aria-sort={childrenAriaSortFor("language")}>
                          <button
                            type="button"
                            onClick={() => cycleChildrenSort("language")}
                            className="flex items-center gap-1 hover:underline"
                          >
                            Language
                            {renderSortIcon("language", childrenSort)}
                          </button>
                        </th>
                        <th aria-sort={childrenAriaSortFor("center")}>
                          <button
                            type="button"
                            onClick={() => cycleChildrenSort("center")}
                            className="flex items-center gap-1 hover:underline"
                          >
                            School
                            {renderSortIcon("center", childrenSort)}
                          </button>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChildren.map((child, index) => (
                        <tr key={child._id || child.id} className="hover">
                          <td className="align-middle w-12">
                            {isChildEligibleForInvite(child) ? (
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-sm"
                                checked={selectedChildIdsForBulk.has(childDocId(child))}
                                onChange={() => toggleBulkChild(child)}
                                title="Include in bulk parent invite"
                              />
                            ) : (
                              <span className="inline-block w-6 text-center text-base-content/30" title="Already invited">
                                —
                              </span>
                            )}
                          </td>
                          <td className="align-middle">{index + 1}</td>
                          <td className="align-middle">
                            <button
                              onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                              className="link link-primary font-semibold hover:scale-105 transition-transform inline-flex items-center gap-1"
                            >
                              {child.name}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="align-middle">{calculateAge(child.dateOfBirth)}</td>
                          <td className="align-middle">{child.primaryLanguage}</td>
                          <td className="align-middle">{child.center || "—"}</td>
                          <td className="align-middle">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/data/child/${child._id || child.id}`)}
                                className="btn btn-ghost btn-xs"
                                title="View details"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => navigate(`/children/edit/${child._id || child.id}`)}
                                className="btn btn-ghost btn-xs"
                                title="Edit child"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteChild(child._id || child.id)}
                                className="btn btn-ghost btn-xs text-error"
                                title="Delete child"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {hasLinkedParentAccount(child) ? (
                                <span
                                  className="btn btn-ghost btn-xs gap-1 no-animation pointer-events-none opacity-80 cursor-default border border-base-300"
                                  title="This child already has a linked parent account"
                                >
                                  Parent linked
                                </span>
                              ) : invitedChildIds.has(String(child._id || child.id)) ? (
                                <span
                                  className="btn btn-ghost btn-xs gap-1 no-animation pointer-events-none opacity-80 cursor-default border border-base-300"
                                  title="Invitation already sent for this child"
                                >
                                  Invited
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openInviteModal(child)}
                                  className="btn btn-primary btn-xs gap-1"
                                  title="Send invitation to parent"
                                >
                                  <Mail className="w-3 h-3" />
                                  Invite
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State - Only show for non-teachers and non-admins */}
        {!selectedTeacher && !isTeacher() && !isAdmin() && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-primary/10 p-8 rounded-full mb-6">
                  <Users className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Select a School</h2>
                <p className="text-base-content/60 text-center max-w-md">
                  Choose a school from the dropdown above to view children
                  enrolled there, or leave it blank to see everyone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {showInviteModal && inviteModalChildren.length > 0 && (
          <div className="modal modal-open">
            <div className="modal-box w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                Send Parent Invitation
              </h3>
              
              <div className="divider"></div>

              <div className="mb-4">
                {inviteModalChildren.length === 1 ? (
                  <p className="text-sm text-base-content/70 mb-2">
                    Sending invitation for: <strong>{inviteModalChildren[0].name}</strong>
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-base-content/70 mb-2">
                      One invitation will cover {inviteModalChildren.length} children:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 max-h-40 overflow-y-auto border border-base-300 rounded-lg p-3 bg-base-200">
                      {inviteModalChildren.map((c) => (
                        <li key={childDocId(c)}>
                          <strong>{c.name}</strong>
                          {c.center ? (
                            <span className="text-base-content/60"> — {c.center}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="text-xs text-base-content/60 mt-3">
                  The parent receives one email with a link to register and link all listed children to their account.
                </p>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Parent Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  className="input input-bordered input-primary w-full"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sendingInvite}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => !sendingInvite && closeInviteModal()}
                  className="btn btn-ghost"
                  disabled={sendingInvite}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInvitation}
                  className="btn btn-primary gap-2"
                  disabled={sendingInvite || !inviteEmail.trim()}
                >
                  {sendingInvite ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {inviteModalChildren.length > 1
                        ? "Send combined invitation"
                        : "Send invitation"}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop"
              onClick={() => !sendingInvite && closeInviteModal()}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DataPage;

