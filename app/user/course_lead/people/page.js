"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../../dashboard.module.css";

const ROLES = ["LEAD", "HEAD", "PM", "WEB", "STUDENT"];
const ROLE_LABELS = { LEAD: "Course Lead", HEAD: "Head PM", PM: "PM", WEB: "Web Dev", STUDENT: "Student" };

function roleBadge(role, s) {
  const cls = { LEAD: s.badgeLEAD, HEAD: s.badgeHEAD, PM: s.badgePM, WEB: s.badgeWEB, STUDENT: s.badgeSTUDENT };
  return <span className={`${s.badge} ${cls[role] ?? ""}`}>{role}</span>;
}

const ROLE_ORDER = { LEAD: 0, HEAD: 1, PM: 2, WEB: 3, STUDENT: 4 };

function sortUsers(users, key, dir) {
  const mul = dir === "asc" ? 1 : -1;
  return [...users].sort((a, b) => {
    if (key === "name") {
      const na = (a.name || "").toLowerCase();
      const nb = (b.name || "").toLowerCase();
      if (!na && !nb) return 0;
      if (!na) return 1;   // blanks always last
      if (!nb) return -1;
      return mul * na.localeCompare(nb);
    }
    if (key === "net_id") {
      return mul * a.net_id.localeCompare(b.net_id);
    }
    if (key === "role") {
      return mul * ((ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99));
    }
    if (key === "group_number") {
      const ga = a.group_number ?? Infinity;  // unassigned last
      const gb = b.group_number ?? Infinity;
      return mul * (ga - gb);
    }
    return 0;
  });
}

export default function CourseLeadPeople() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredUsers = sortUsers(
    users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || u.net_id.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q));
      return matchRole && matchSearch;
    }),
    sortKey,
    sortDir,
  );

  const handleAddUser = async () => {
    setAddError("");
    if (!addForm.net_id.trim() || !addForm.role) { setAddError("NetID and role are required."); return; }
    setAddLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const json = await res.json();
    if (!res.ok) { setAddError(json.error || "Failed to add user."); setAddLoading(false); return; }
    await fetchUsers();
    setShowAddModal(false);
    setAddForm({ name: "", net_id: "", role: "STUDENT", group_number: "" });
    setAddLoading(false);
  };

  const handleRemoveUser = async (net_id) => {
    if (!confirm(`Remove ${net_id} from the course?`)) return;
    await fetch(`/api/users/${encodeURIComponent(net_id)}`, { method: "DELETE" });
    await fetchUsers();
  };

  const handleRoleChange = async (net_id, role) => {
    await fetch(`/api/users/${encodeURIComponent(net_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await fetchUsers();
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
        <p>{users.length} total member{users.length !== 1 ? "s" : ""}</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.filterChips}>
              {["ALL", ...ROLES].map((r) => (
                <button
                  key={r}
                  className={`${styles.chip} ${roleFilter === r ? styles.activeChip : ""}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === "ALL" ? "All" : ROLE_LABELS[r]}
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
            + Add Person
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading people…</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>👤</span>No users found
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {[
                    { key: "name",         label: "Name" },
                    { key: "net_id",       label: "NetID" },
                    { key: "role",         label: "Role" },
                    { key: "group_number", label: "Group" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                    >
                      {label}
                      <span style={{ marginLeft: "0.4rem", opacity: sortKey === key ? 1 : 0.25, fontSize: "0.75rem" }}>
                        {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.net_id}>
                    <td>{u.name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td className={styles.cellMono}>{u.net_id}</td>
                    <td>{roleBadge(u.role, styles)}</td>
                    <td>{u.group_number || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td>
                      <div className={styles.cellActions}>
                        <select
                          className={styles.roleSelect}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.net_id, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className={styles.roleSelect}
                          style={{ width: 70 }}
                          placeholder="Grp"
                          defaultValue={u.group_number || ""}
                          onBlur={(e) => handleGroupChange(u.net_id, e.target.value)}
                        />
                        <button className={styles.btnDanger} onClick={() => handleRemoveUser(u.net_id)}>
                          Remove
                        </button>
                      </div>
                    </td>
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
            <h2>Add Person</h2>
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
              <label>Role *</label>
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Group Number</label>
              <input type="number" value={addForm.group_number} onChange={(e) => setAddForm({ ...addForm, group_number: e.target.value })} placeholder="e.g. 3" />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleAddUser} disabled={addLoading}>
                {addLoading ? "Adding…" : "Add Person"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
