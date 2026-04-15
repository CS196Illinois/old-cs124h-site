"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../dashboard.module.css";

export default function WebDevDashboard() {
  const { data: session, status } = useSession();
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const base = "/user/web_dev";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/action_items");
    if (res.ok) setActionItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status, fetchItems]);

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  const todo = actionItems.filter((a) => !a.is_done);
  const done = actionItems.filter((a) => a.is_done);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Web Dev Dashboard</h1>
        <p>{session?.user?.name || session?.user?.netID}</p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "To Do", val: todo.length },
          { label: "Completed", val: done.length },
          { label: "Total Items", val: actionItems.length },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>
            Pending Action Items
            {todo.length > 0 && (
              <span style={{ background: "#ecb557", color: "#112a67", borderRadius: "10px", padding: "0.05rem 0.45rem", fontSize: "0.72rem", marginLeft: "0.5rem", fontWeight: 700 }}>
                {todo.length}
              </span>
            )}
          </span>
          <Link href={`${base}/action_items`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : todo.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎉</span>
            You're all caught up!
          </div>
        ) : (
          <div className={styles.actionList}>
            {todo.slice(0, 8).map((item) => (
              <div key={item.id} className={styles.actionCard}>
                <div className={styles.actionBody}>
                  <div className={styles.actionTitle}>{item.title}</div>
                  {item.description && <div className={styles.actionDesc}>{item.description}</div>}
                  <div className={styles.actionMeta}>
                    {item.due_date && (
                      <span className={styles.actionMetaItem}>Due {new Date(item.due_date).toLocaleDateString()}</span>
                    )}
                    {item.additional_info?.assigned_by && (
                      <span className={styles.actionMetaItem}>From {item.additional_info.assigned_by}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {todo.length > 8 && (
              <div style={{ padding: "0.5rem 0.25rem", color: "rgba(249,249,249,0.35)", fontSize: "0.8rem", fontFamily: "Inter" }}>
                +{todo.length - 8} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
