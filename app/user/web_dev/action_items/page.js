"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../../dashboard.module.css";

export default function WebDevActionItems() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("todo");
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/action_items");
    if (res.ok) setActionItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status, fetchItems]);

  const handleToggle = async (id, is_done) => {
    await fetch(`/api/action_items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !is_done }),
    });
    await fetchItems();
  };

  const todo = actionItems.filter((a) => !a.is_done);
  const done = actionItems.filter((a) => a.is_done);
  const display = activeTab === "todo" ? todo : done;

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Action Items</h1>
        <p>{session?.user?.name || session?.user?.netID}</p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "To Do", val: todo.length },
          { label: "Completed", val: done.length },
          { label: "Total", val: actionItems.length },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "todo" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("todo")}
        >
          To Do
          {todo.length > 0 && (
            <span style={{ background: "#ecb557", color: "#112a67", borderRadius: "10px", padding: "0.05rem 0.45rem", fontSize: "0.75rem", marginLeft: "0.4rem", fontWeight: 700 }}>
              {todo.length}
            </span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "done" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("done")}
        >
          Completed
        </button>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : display.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{activeTab === "todo" ? "🎉" : "📭"}</span>
            {activeTab === "todo" ? "You're all caught up!" : "No completed items yet"}
          </div>
        ) : (
          <div className={styles.actionList}>
            {display.map((item) => (
              <div key={item.id} className={`${styles.actionCard} ${item.is_done ? styles.done : ""}`}>
                <button
                  className={`${styles.actionCheckbox} ${item.is_done ? styles.checked : ""}`}
                  onClick={() => handleToggle(item.id, item.is_done)}
                  aria-label={item.is_done ? "Mark incomplete" : "Mark complete"}
                >
                  {item.is_done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className={styles.actionBody}>
                  <div className={`${styles.actionTitle} ${item.is_done ? styles.strikethrough : ""}`}>
                    {item.title}
                  </div>
                  {item.description && <div className={styles.actionDesc}>{item.description}</div>}
                  <div className={styles.actionMeta}>
                    {item.due_date && (
                      <span className={styles.actionMetaItem}>Due {new Date(item.due_date).toLocaleDateString()}</span>
                    )}
                    {item.completion_date && item.is_done && (
                      <span className={styles.actionMetaItem}>Completed {new Date(item.completion_date).toLocaleDateString()}</span>
                    )}
                    {(item.assigned_by || item.additional_info?.assigned_by) && (
                      <span className={styles.actionMetaItem}>From {item.assigned_by || item.additional_info.assigned_by}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
