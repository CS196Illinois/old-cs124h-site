"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../dashboard.module.css";

export default function PMDashboard() {
  const { data: session, status } = useSession();
  const [myRecord, setMyRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const netID = session?.user?.netID;
  const base = "/user/pm";

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

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  const groupNumber = myRecord?.group_number;
  const openItems = actionItems.filter((a) => !a.is_done);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>PM Dashboard</h1>
        <p>
          {session?.user?.name || netID}
          {groupNumber ? ` · Group ${groupNumber}` : " · No group assigned"}
        </p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "My Students", val: students.length },
          { label: "Open Items", val: openItems.length },
          { label: "My Group", val: groupNumber ?? "—" },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Students preview */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>My Students</span>
            <Link href={`${base}/students`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : students.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1.5rem 0" }}>
              No students assigned yet
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Open Items</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((u) => {
                    const open = actionItems.filter((a) => a.net_id === u.net_id && !a.is_done).length;
                    return (
                      <tr key={u.net_id}>
                        <td>
                          <div>{u.name || <span style={{ opacity: 0.4 }}>—</span>}</div>
                          <div className={styles.cellMono} style={{ fontSize: "0.78rem", opacity: 0.55 }}>{u.net_id}</div>
                        </td>
                        <td>
                          <span style={{ color: open > 0 ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>{open}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action items preview */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>Pending Action Items</span>
            <Link href={`${base}/action_items`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : openItems.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1.5rem 0" }}>
              No pending items
            </div>
          ) : (
            <div className={styles.actionList}>
              {openItems.slice(0, 5).map((item) => (
                <div key={item.id} className={styles.actionCard}>
                  <div className={styles.actionBody}>
                    <div className={styles.actionTitle}>{item.title}</div>
                    <div className={styles.actionMeta}>
                      <span className={styles.actionMetaItem}>{item.net_id}</span>
                      {item.due_date && (
                        <span className={styles.actionMetaItem}>
                          Due {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {openItems.length > 5 && (
                <div style={{ padding: "0.5rem 0.25rem", color: "rgba(249,249,249,0.35)", fontSize: "0.8rem", fontFamily: "Inter" }}>
                  +{openItems.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
