"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../../dashboard.module.css";

const ROLE_LABELS = { PM: "PM", STUDENT: "Student" };

function roleBadge(role, s) {
  const cls = { PM: s.badgePM, STUDENT: s.badgeSTUDENT };
  return <span className={`${s.badge} ${cls[role] ?? ""}`}>{role}</span>;
}

export default function HeadPMPeople() {
  const [users, setUsers] = useState([]);
  const [subTab, setSubTab] = useState("PM");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", net_id: "", role: "STUDENT", group_number: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const pms = users.filter((u) => u.role === "PM");
  const students = users.filter((u) => u.role === "STUDENT");

  const displayUsers = subTab === "PM" ? pms : students;
  const filteredUsers = displayUsers.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.net_id.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q));
  });

  const handleAddUser = async () => {
    setAddError("");
    if (!addForm.net_id.trim()) { setAddError("NetID is required."); return; }
    setAddLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const json = await res.json();
    if (!res.ok) { setAddError(json.error || "Failed."); setAddLoading(false); return; }
    await fetchUsers();
    setShowAddModal(false);
    setAddForm({ name: "", net_id: "", role: "STUDENT", group_number: "" });
    setAddLoading(false);
  };

  const handleGroupChange = async (net_id, group_number) => {
    await fetch(`/api/users/${encodeURIComponent(net_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_number: group_number ? Number(group_number) : null }),
    });
    await fetchUsers();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>People</h1>
        <p>{pms.length} PM{pms.length !== 1 ? "s" : ""} · {students.length} Student{students.length !== 1 ? "s" : ""}</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.subTabs}>
              {["PM", "STUDENT"].map((r) => (
                <button
                  key={r}
                  className={`${styles.subTab} ${subTab === r ? styles.activeSubTab : ""}`}
                  onClick={() => { setSubTab(r); setSearch(""); }}
                >
                  {ROLE_LABELS[r]}s ({r === "PM" ? pms.length : students.length})
                </button>
              ))}
            </div>
            <input
              className={styles.searchBar}
              placeholder="Search name or NetID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
            + Add {ROLE_LABELS[subTab]}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>👤</span>No users found
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NetID</th>
                  <th>Role</th>
                  {subTab === "STUDENT" && <th>Group</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.net_id}>
                    <td>{u.name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td className={styles.cellMono}>{u.net_id}</td>
                    <td>{roleBadge(u.role, styles)}</td>
                    {subTab === "STUDENT" && (
                      <td>
                        <input
                          type="number"
                          className={styles.roleSelect}
                          style={{ width: 70 }}
                          placeholder="Grp"
                          defaultValue={u.group_number || ""}
                          onBlur={(e) => handleGroupChange(u.net_id, e.target.value)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className={styles.overlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Add {ROLE_LABELS[subTab]}</h2>
            {addError && <div className={styles.alertError}>{addError}</div>}
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className={styles.formGroup}>
              <label>NetID *</label>
              <input value={addForm.net_id} onChange={(e) => setAddForm({ ...addForm, net_id: e.target.value })} placeholder="jdoe2" />
            </div>
            <div className={styles.formGroup}>
              <label>Role</label>
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                <option value="PM">PM</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            {addForm.role === "STUDENT" && (
              <div className={styles.formGroup}>
                <label>Group Number</label>
                <input type="number" value={addForm.group_number} onChange={(e) => setAddForm({ ...addForm, group_number: e.target.value })} placeholder="e.g. 3" />
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleAddUser} disabled={addLoading}>
                {addLoading ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
