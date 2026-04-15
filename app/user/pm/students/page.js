"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../../dashboard.module.css";

export default function PMStudents() {
  const { data: session, status } = useSession();
  const [myRecord, setMyRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [meRes, itemsRes] = await Promise.all([
      fetch("/api/users/me"),
      fetch("/api/action_items"),
    ]);
    let me = null;
    if (meRes.ok) { me = await meRes.json(); setMyRecord(me); }
    if (itemsRes.ok) setActionItems(await itemsRes.json());
    if (me?.group_number) {
      const stuRes = await fetch(`/api/users?role=STUDENT&group=${me.group_number}`);
      if (stuRes.ok) setStudents(await stuRes.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  const groupNumber = myRecord?.group_number;

  const filteredStudents = students.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.net_id.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q));
  });

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Students</h1>
        <p>
          {groupNumber
            ? `Group ${groupNumber} · ${students.length} student${students.length !== 1 ? "s" : ""}`
            : "No group assigned"}
        </p>
      </div>

      {!groupNumber ? (
        <div className={styles.panel}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            You have no group assigned yet. Contact a Course Lead.
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.toolbar}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>
              Group {groupNumber} · {students.length} student{students.length !== 1 ? "s" : ""}
            </span>
            <input
              className={styles.searchBar}
              placeholder="Search name or NetID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className={styles.loading}>Loading students…</div>
          ) : filteredStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👤</span>No students found
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>NetID</th>
                    <th>Open Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((u) => {
                    const studentOpenItems = actionItems.filter((a) => a.net_id === u.net_id && !a.is_done).length;
                    return (
                      <tr key={u.net_id}>
                        <td>{u.name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                        <td className={styles.cellMono}>{u.net_id}</td>
                        <td>
                          <span style={{ color: studentOpenItems > 0 ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>
                            {studentOpenItems}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
