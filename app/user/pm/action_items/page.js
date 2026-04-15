"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../../dashboard.module.css";

export default function PMActionItems() {
  const { data: session, status } = useSession();
  const [actionItems, setActionItems] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState("mine"); // "mine" | "all"
  const [statusFilter, setStatusFilter] = useState("open");
  const [titleFilter, setTitleFilter] = useState(""); // filter by specific title
  const [collapsed, setCollapsed] = useState({});

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", target_type: "group", target_net_id: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = useCallback(async (currentScope) => {
    setLoading(true);
    const [meRes, itemsRes] = await Promise.all([
      fetch("/api/users/me"),
      fetch(`/api/action_items?scope=${currentScope}`),
    ]);
    if (meRes.ok) {
      const me = await meRes.json();
      setMyRecord(me);
      if (me?.group_number) {
        const stuRes = await fetch(`/api/users?role=STUDENT&group=${me.group_number}`);
        if (stuRes.ok) setStudents(await stuRes.json());
      }
    }
    if (itemsRes.ok) setActionItems(await itemsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData(scope);
  }, [status, fetchData, scope]);

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
    const payload = { ...form };
    if (form.target_type === "group") {
      payload.target_group = myRecord?.group_number;
      payload.target_type = "group";
    }
    setFormLoading(true);
    const res = await fetch("/api/action_items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setFormError(json.error || "Failed."); setFormLoading(false); return; }
    setFormSuccess(`Assigned to ${json.count} student${json.count !== 1 ? "s" : ""}.`);
    await fetchData(scope);
    setTimeout(() => {
      setShowModal(false);
      setFormSuccess("");
      setForm({ title: "", description: "", due_date: "", target_type: "group", target_net_id: "" });
    }, 1200);
    setFormLoading(false);
  };

  // All distinct titles for the title filter dropdown
  const allTitles = [...new Set(actionItems.map((i) => i.title))].sort();

  // Apply status + title filters
  const filteredItems = actionItems.filter((item) => {
    if (statusFilter === "open" && item.is_done) return false;
    if (statusFilter === "done" && !item.is_done) return false;
    if (titleFilter && item.title !== titleFilter) return false;
    return true;
  });

  const myNetId = session?.user?.netID;

  // When a specific title is selected: show a flat list grouped by person for that title
  // Otherwise: group by student (same as before)
  const renderTitleGrouped = () => {
    const byNetId = filteredItems.reduce((acc, item) => {
      (acc[item.net_id] = acc[item.net_id] || []).push(item);
      return acc;
    }, {});
    const netIds = Object.keys(byNetId).sort();
    if (netIds.length === 0) return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>✅</span>No items match
      </div>
    );
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Assigned By</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const stu = students.find((s) => s.net_id === item.net_id);
              return (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{item.net_id}</span>
                    {stu?.name && <span style={{ color: "rgba(249,249,249,0.45)", fontSize: "0.78rem", marginLeft: "0.4rem" }}>{stu.name}</span>}
                  </td>
                  <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.82rem", fontFamily: "monospace" }}>
                    {item.assigned_by || item.additional_info?.assigned_by || "—"}
                    {(item.assigned_by || item.additional_info?.assigned_by) === myNetId && (
                      <span style={{ marginLeft: "0.35rem", color: "#4f8dde", fontSize: "0.72rem" }}>(you)</span>
                    )}
                  </td>
                  <td style={{ color: "rgba(249,249,249,0.6)", fontSize: "0.85rem" }}>
                    {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {item.is_done
                      ? <span className={styles.statusDone}>● Done</span>
                      : <span className={styles.statusPending}>● Pending</span>}
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

  // Default: group by student
  const renderStudentGrouped = () => {
    const itemsByNetId = filteredItems.reduce((acc, item) => {
      (acc[item.net_id] = acc[item.net_id] || []).push(item);
      return acc;
    }, {});
    const allNetIds = [...new Set([...students.map((s) => s.net_id), ...Object.keys(itemsByNetId)])];
    const studentRows = allNetIds
      .map((net_id) => {
        const stu = students.find((s) => s.net_id === net_id) || { net_id, name: null };
        const items = itemsByNetId[net_id] || [];
        const open = items.filter((i) => !i.is_done).length;
        return { ...stu, items, open };
      })
      .filter((r) => r.items.length > 0)
      .sort((a, b) => b.open - a.open);

    if (studentRows.length === 0) return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>{statusFilter === "open" ? "✅" : "📭"}</span>
        {statusFilter === "open" ? "No pending items — great work!" : "No items here yet"}
      </div>
    );

    return studentRows.map((row) => {
      const isCollapsed = collapsed[row.net_id];
      return (
        <div key={row.net_id} style={{ marginBottom: "0.75rem" }}>
          <div
            onClick={() => setCollapsed((c) => ({ ...c, [row.net_id]: !c[row.net_id] }))}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.6rem 1rem", cursor: "pointer",
              background: "rgba(255,255,255,0.04)", borderRadius: "8px",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>{isCollapsed ? "▶" : "▼"}</span>
            <span style={{ color: "#f9f9f9", fontWeight: 600, fontFamily: "Inter" }}>
              {row.name || row.net_id}
            </span>
            {row.name && (
              <span style={{ color: "rgba(249,249,249,0.4)", fontFamily: "monospace", fontSize: "0.82rem" }}>{row.net_id}</span>
            )}
            <span style={{
              marginLeft: "auto",
              background: row.open > 0 ? "rgba(225,145,48,0.2)" : "rgba(255,255,255,0.07)",
              color: row.open > 0 ? "#e19130" : "rgba(249,249,249,0.5)",
              borderRadius: "10px", padding: "0.1rem 0.55rem",
              fontSize: "0.75rem", fontWeight: 600,
            }}>
              {row.items.length} item{row.items.length !== 1 ? "s" : ""}
              {row.open > 0 && ` · ${row.open} open`}
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
                  {row.items.map((item) => {
                    const assignedBy = item.assigned_by || item.additional_info?.assigned_by;
                    return (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td style={{ color: "rgba(249,249,249,0.5)", fontSize: "0.82rem", fontFamily: "monospace" }}>
                          {assignedBy || "—"}
                          {assignedBy === myNetId && (
                            <span style={{ marginLeft: "0.35rem", color: "#4f8dde", fontSize: "0.72rem" }}>(you)</span>
                          )}
                        </td>
                        <td style={{ color: "rgba(249,249,249,0.6)", fontSize: "0.85rem" }}>
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          {item.is_done
                            ? <span className={styles.statusDone}>● Done</span>
                            : <span className={styles.statusPending}>● Pending</span>}
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

  const totalOpen = actionItems.filter((a) => !a.is_done).length;
  const totalDone = actionItems.filter((a) =>  a.is_done).length;

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Group Action Items</h1>
        <p>Group {myRecord?.group_number ?? "—"}</p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "Open",      val: totalOpen },
          { label: "Completed", val: totalDone },
          { label: "Students",  val: students.length },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        {/* Top toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            {/* Scope toggle */}
            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${scope === "mine" ? styles.activeChip : ""}`}
                onClick={() => setScope("mine")}
              >
                My Items
              </button>
              <button
                className={`${styles.chip} ${scope === "all" ? styles.activeChip : ""}`}
                onClick={() => setScope("all")}
              >
                All Group Items
              </button>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowModal(true)}
              disabled={!myRecord?.group_number}
            >
              + Assign to Group
            </button>
          </div>

          {/* Status + title filter row */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className={styles.filterChips}>
              {[
                { key: "open", label: `Open (${totalOpen})` },
                { key: "done", label: `Done (${totalDone})` },
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

            <select
              className={styles.roleSelect}
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              style={{ minWidth: 180, flex: 1 }}
            >
              <option value="">All action items</option>
              {allTitles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : titleFilter ? renderTitleGrouped() : renderStudentGrouped()}
      </div>

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

      {/* ── Create modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Assign Action Item</h2>
            {formError && <div className={styles.alertError}>{formError}</div>}
            {formSuccess && <div className={styles.alertSuccess}>{formSuccess}</div>}
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Action item…" />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details…" />
            </div>
            <div className={styles.formGroup}>
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Assign To</label>
              <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value, target_net_id: "" })}>
                <option value="group">Entire Group ({students.length} students)</option>
                <option value="individual">Specific Student</option>
              </select>
            </div>
            {form.target_type === "individual" && (
              <div className={styles.formGroup}>
                <label>Student NetID</label>
                <input
                  value={form.target_net_id}
                  onChange={(e) => setForm({ ...form, target_net_id: e.target.value })}
                  placeholder="jdoe2"
                  list="pm-ai-students"
                />
                <datalist id="pm-ai-students">
                  {students.map((u) => (
                    <option key={u.net_id} value={u.net_id}>{u.name ? `${u.name} (${u.net_id})` : u.net_id}</option>
                  ))}
                </datalist>
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
    </div>
  );
}
