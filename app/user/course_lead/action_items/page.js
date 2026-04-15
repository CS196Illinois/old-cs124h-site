"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../../dashboard.module.css";

const ROLE_LABELS = { LEAD: "Course Lead", HEAD: "Head PM", PM: "PM", WEB: "Web Dev", STUDENT: "Student" };
const ROLE_ORDER  = { LEAD: 0, HEAD: 1, PM: 2, WEB: 3, STUDENT: 4 };

export default function CourseLeadActionItems() {
  const { data: session } = useSession();
  const myNetId = session?.user?.netID;

  const [actionItems, setActionItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [scope,        setScope]        = useState("mine"); // "mine" | "all"
  const [roleFilter,   setRoleFilter]   = useState("ALL");
  const [groupFilter,  setGroupFilter]  = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("open");
  const [titleFilter,  setTitleFilter]  = useState("");
  const [search,       setSearch]       = useState("");
  const [collapsed,    setCollapsed]    = useState({});

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", due_date: "",
    target_type: "individual", target_net_id: "", target_group: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = useCallback(async (currentScope) => {
    setLoading(true);
    const [itemsRes, usersRes] = await Promise.all([
      fetch(`/api/action_items?scope=${currentScope}`),
      fetch("/api/users"),
    ]);
    if (itemsRes.ok) setActionItems(await itemsRes.json());
    if (usersRes.ok) setUsers(await usersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(scope); }, [fetchData, scope]);

  const userByNetId = Object.fromEntries(users.map((u) => [u.net_id, u]));
  const groups = [...new Set(users.filter((u) => u.group_number).map((u) => u.group_number))].sort((a, b) => a - b);
  const openCount = actionItems.filter((a) => !a.is_done).length;
  const doneCount = actionItems.filter((a) =>  a.is_done).length;
  const allTitles = [...new Set(actionItems.map((i) => i.title))].sort();

  // Per-role open counts for summary strip
  const roleSummary = ["HEAD", "PM", "WEB", "STUDENT"].map((role) => ({
    role,
    open: actionItems.filter((a) => !a.is_done && userByNetId[a.net_id]?.role === role).length,
    total: actionItems.filter((a) => userByNetId[a.net_id]?.role === role).length,
  }));

  const filteredItems = actionItems.filter((item) => {
    const u = userByNetId[item.net_id];
    if (roleFilter  !== "ALL" && u?.role !== roleFilter) return false;
    if (groupFilter !== "ALL" && String(u?.group_number) !== groupFilter) return false;
    if (statusFilter === "open" && item.is_done) return false;
    if (statusFilter === "done" && !item.is_done) return false;
    if (titleFilter && item.title !== titleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const assignedBy = item.assigned_by || item.additional_info?.assigned_by || "";
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.net_id.toLowerCase().includes(q) &&
        !u?.name?.toLowerCase().includes(q) &&
        !assignedBy.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleToggle = async (id, is_done) => {
    await fetch(`/api/action_items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !is_done }),
    });
    await fetchData(scope);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this action item?")) return;
    await fetch(`/api/action_items/${id}`, { method: "DELETE" });
    await fetchData(scope);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || "",
      due_date: item.due_date ? item.due_date.split("T")[0] : "",
    });
    setEditError("");
  };

  const handleSaveEdit = async () => {
    setEditError("");
    if (!editForm.title.trim()) { setEditError("Title is required."); return; }
    setEditLoading(true);
    const res = await fetch(`/api/action_items/${editItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        due_date: editForm.due_date || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setEditError(json.error || "Failed to save."); setEditLoading(false); return; }
    setEditItem(null);
    setEditLoading(false);
    await fetchData(scope);
  };

  const handleCreate = async () => {
    setFormError("");
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setFormLoading(true);
    const res = await fetch("/api/action_items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) { setFormError(json.error || "Failed to create action item."); setFormLoading(false); return; }
    setFormSuccess(`Assigned to ${json.count} person${json.count !== 1 ? "s" : ""}.`);
    await fetchData(scope);
    setTimeout(() => {
      setShowModal(false);
      setFormSuccess("");
      setForm({ title: "", description: "", due_date: "", target_type: "individual", target_net_id: "", target_group: "" });
    }, 1200);
    setFormLoading(false);
  };

  // Title filter active: flat table showing everyone with that title
  const renderTitleGrouped = () => {
    if (filteredItems.length === 0) return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>✅</span>No items match your filters
      </div>
    );
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Role</th>
              <th>Group</th>
              <th>Assigned By</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const u = userByNetId[item.net_id];
              const assignedBy = item.assigned_by || item.additional_info?.assigned_by;
              return (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{item.net_id}</span>
                    {u?.name && <span style={{ color: "rgba(249,249,249,0.45)", fontSize: "0.78rem", marginLeft: "0.4rem" }}>{u.name}</span>}
                  </td>
                  <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.8rem" }}>{ROLE_LABELS[u?.role] || "—"}</td>
                  <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.82rem" }}>{u?.group_number || "—"}</td>
                  <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.82rem", fontFamily: "monospace" }}>
                    {assignedBy || "—"}
                    {assignedBy === myNetId && <span style={{ marginLeft: "0.35rem", color: "#4f8dde", fontSize: "0.72rem" }}>(you)</span>}
                  </td>
                  <td style={{ color: "rgba(249,249,249,0.6)", fontSize: "0.85rem" }}>
                    {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {item.is_done ? (
                      <span className={styles.statusDone}><span className={`${styles.statusDot} ${styles.statusDoneDot}`} />Done</span>
                    ) : (
                      <span className={styles.statusPending}><span className={`${styles.statusDot} ${styles.statusPendingDot}`} />Pending</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.cellActions}>
                      <button
                        className={`${styles.btnSmall} ${item.is_done ? styles.btnReopen : styles.btnComplete}`}
                        onClick={() => handleToggle(item.id, item.is_done)}
                      >
                        {item.is_done ? "Reopen" : "Complete"}
                      </button>
                      <button
                        className={styles.btnSmall}
                        style={{ background: "rgba(79,141,222,0.15)", color: "#4f8dde", border: "1px solid rgba(79,141,222,0.25)" }}
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </button>
                      <button className={styles.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Default: group by assignee
  const renderPersonGrouped = () => {
    const grouped = filteredItems.reduce((acc, item) => {
      (acc[item.net_id] = acc[item.net_id] || []).push(item);
      return acc;
    }, {});
    const netIds = Object.keys(grouped).sort((a, b) => {
      const ua = userByNetId[a], ub = userByNetId[b];
      const roleA = ROLE_ORDER[ua?.role] ?? 99;
      const roleB = ROLE_ORDER[ub?.role] ?? 99;
      if (roleA !== roleB) return roleA - roleB;
      return (ua?.name || a).localeCompare(ub?.name || b);
    });
    if (netIds.length === 0) return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>✅</span>No action items match your filters
      </div>
    );
    return netIds.map((net_id) => {
      const u = userByNetId[net_id];
      const items = grouped[net_id];
      const openItems = items.filter((i) => !i.is_done).length;
      const isCollapsed = collapsed[net_id];
      return (
        <div key={net_id} style={{ marginBottom: "0.75rem" }}>
          <div
            onClick={() => setCollapsed((c) => ({ ...c, [net_id]: !c[net_id] }))}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.6rem 1rem", cursor: "pointer",
              background: "rgba(255,255,255,0.04)", borderRadius: "8px",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>{isCollapsed ? "▶" : "▼"}</span>
            <span style={{ color: "#f9f9f9", fontWeight: 600, fontFamily: "Inter" }}>{u?.name || net_id}</span>
            {u?.name && <span style={{ color: "rgba(249,249,249,0.4)", fontFamily: "monospace", fontSize: "0.82rem" }}>{net_id}</span>}
            {u?.role && (
              <span style={{
                background: "rgba(255,255,255,0.08)", color: "rgba(249,249,249,0.55)",
                borderRadius: "6px", padding: "0.05rem 0.5rem", fontSize: "0.72rem", fontWeight: 600,
              }}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
            )}
            {u?.group_number && (
              <span style={{ color: "rgba(249,249,249,0.35)", fontSize: "0.78rem" }}>Group {u.group_number}</span>
            )}
            <span style={{
              marginLeft: "auto",
              background: openItems > 0 ? "rgba(225,145,48,0.2)" : "rgba(255,255,255,0.07)",
              color: openItems > 0 ? "#e19130" : "rgba(249,249,249,0.5)",
              borderRadius: "10px", padding: "0.1rem 0.55rem",
              fontSize: "0.75rem", fontWeight: 600,
            }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
              {openItems > 0 && ` · ${openItems} open`}
            </span>
          </div>

          {!isCollapsed && (
            <div className={styles.tableWrapper} style={{ marginTop: "0.25rem" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned By</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const assignedBy = item.assigned_by || item.additional_info?.assigned_by;
                    return (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.82rem", fontFamily: "monospace" }}>
                          {assignedBy || "—"}
                          {assignedBy === myNetId && <span style={{ marginLeft: "0.35rem", color: "#4f8dde", fontSize: "0.72rem" }}>(you)</span>}
                        </td>
                        <td style={{ color: "rgba(249,249,249,0.6)", fontSize: "0.85rem" }}>
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          {item.is_done ? (
                            <span className={styles.statusDone}><span className={`${styles.statusDot} ${styles.statusDoneDot}`} />Done</span>
                          ) : (
                            <span className={styles.statusPending}><span className={`${styles.statusDot} ${styles.statusPendingDot}`} />Pending</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.cellActions}>
                            <button
                              className={`${styles.btnSmall} ${item.is_done ? styles.btnReopen : styles.btnComplete}`}
                              onClick={() => handleToggle(item.id, item.is_done)}
                            >
                              {item.is_done ? "Reopen" : "Complete"}
                            </button>
                            <button
                              className={styles.btnSmall}
                              style={{ background: "rgba(79,141,222,0.15)", color: "#4f8dde", border: "1px solid rgba(79,141,222,0.25)" }}
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </button>
                            <button className={styles.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Action Items</h1>
        <p>{openCount} open · {doneCount} completed</p>
      </div>

      {/* Role summary strip — only meaningful in scope=all */}
      {scope === "all" && (
        <div className={styles.statsGrid}>
          {roleSummary.map(({ role, open, total }) => (
            <div
              key={role}
              className={styles.statCard}
              style={{ cursor: "pointer", outline: roleFilter === role ? "2px solid rgba(79,141,222,0.6)" : "none" }}
              onClick={() => setRoleFilter((r) => r === role ? "ALL" : role)}
            >
              <div className={styles.statNumber}>{open}</div>
              <div className={styles.statLabel}>{ROLE_LABELS[role]} open</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(249,249,249,0.35)", marginTop: "0.15rem" }}>{total} total</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.panel}>
        {/* Toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${scope === "mine" ? styles.activeChip : ""}`}
                onClick={() => { setScope("mine"); setRoleFilter("ALL"); setGroupFilter("ALL"); }}
              >
                My Items
              </button>
              <button
                className={`${styles.chip} ${scope === "all" ? styles.activeChip : ""}`}
                onClick={() => setScope("all")}
              >
                All Items
              </button>
            </div>
            <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
              + Assign Action Item
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Status chips */}
            <div className={styles.filterChips}>
              {[
                { key: "open", label: `Open (${openCount})` },
                { key: "done", label: `Done (${doneCount})` },
                { key: "all",  label: `All (${actionItems.length})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.chip} ${statusFilter === key ? styles.activeChip : ""}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Role + group filters (only in all-scope) */}
            {scope === "all" && (
              <>
                <div className={styles.filterChips}>
                  {["ALL", "HEAD", "PM", "WEB", "STUDENT"].map((r) => (
                    <button
                      key={r}
                      className={`${styles.chip} ${roleFilter === r ? styles.activeChip : ""}`}
                      onClick={() => setRoleFilter(r)}
                    >
                      {r === "ALL" ? "All Roles" : ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className={styles.roleSelect}
                  style={{ minWidth: 120 }}
                >
                  <option value="ALL">All Groups</option>
                  {groups.map((g) => <option key={g} value={String(g)}>Group {g}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Title filter + search */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select
              className={styles.roleSelect}
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              style={{ minWidth: 200, flex: 1 }}
            >
              <option value="">All action items</option>
              {allTitles.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              className={styles.searchBar}
              placeholder="Search title, person, or assigner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2, minWidth: 160 }}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : titleFilter ? renderTitleGrouped() : renderPersonGrouped()}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Assign Action Item</h2>
            {formError && <div className={styles.alertError}>{formError}</div>}
            {formSuccess && <div className={styles.alertSuccess}>{formSuccess}</div>}
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Complete project proposal" />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any additional details…" />
            </div>
            <div className={styles.formGroup}>
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Assign To</label>
              <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value, target_net_id: "", target_group: "" })}>
                <option value="individual">Specific Person</option>
                <option value="role_HEAD">All Head PMs</option>
                <option value="role_PM">All PMs</option>
                <option value="role_WEB">Web Dev Team</option>
                <option value="role_STUDENT">All Students</option>
                <option value="group">Student Group</option>
              </select>
            </div>
            {form.target_type === "individual" && (
              <div className={styles.formGroup}>
                <label>NetID</label>
                <input
                  value={form.target_net_id}
                  onChange={(e) => setForm({ ...form, target_net_id: e.target.value })}
                  placeholder="jdoe2"
                  list="cl-ai-users-list"
                />
                <datalist id="cl-ai-users-list">
                  {users.map((u) => (
                    <option key={u.net_id} value={u.net_id}>{u.name ? `${u.name} (${u.net_id})` : u.net_id}</option>
                  ))}
                </datalist>
              </div>
            )}
            {form.target_type === "group" && (
              <div className={styles.formGroup}>
                <label>Group Number</label>
                <select value={form.target_group} onChange={(e) => setForm({ ...form, target_group: e.target.value })}>
                  <option value="">Select a group…</option>
                  {groups.map((g) => <option key={g} value={g}>Group {g}</option>)}
                </select>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={formLoading}>
                {formLoading ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editItem && (
        <div className={styles.overlay} onClick={() => setEditItem(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit Action Item</h2>
            {editError && <div className={styles.alertError}>{editError}</div>}
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional details…" />
            </div>
            <div className={styles.formGroup}>
              <label>Due Date</label>
              <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setEditItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={editLoading}>
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
