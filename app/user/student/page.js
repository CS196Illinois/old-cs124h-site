"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../dashboard.module.css";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [actionItems, setActionItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [checkedIn, setCheckedIn] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const base = "/user/student";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [itemsRes, eventsRes, attendRes] = await Promise.all([
      fetch("/api/action_items"),
      fetch("/api/events"),
      fetch("/api/events/my-checkins"),
    ]);
    if (itemsRes.ok) setActionItems(await itemsRes.json());
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (attendRes.ok) {
      const data = await attendRes.json();
      setCheckedIn(new Set(data.map((r) => r.event_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  const todo = actionItems.filter((a) => !a.is_done);
  const done = actionItems.filter((a) => a.is_done);
  const openEvents = events.filter((e) => e.check_in_open && !checkedIn.has(e.id));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Dashboard</h1>
        <p>{session?.user?.name || session?.user?.netID}</p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "To Do", val: todo.length },
          { label: "Completed", val: done.length },
          { label: "Events Attended", val: checkedIn.size },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Open check-in alert */}
      {openEvents.length > 0 && (
        <div style={{
          background: "rgba(74, 222, 128, 0.1)",
          border: "1px solid rgba(74, 222, 128, 0.3)",
          borderRadius: "10px",
          padding: "0.85rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <span style={{ color: "#4ade80", fontFamily: "Inter", fontSize: "0.9rem", fontWeight: 600 }}>
            Check-in is open for {openEvents.length} event{openEvents.length !== 1 ? "s" : ""}
          </span>
          <Link href={`${base}/attendance`} style={{ color: "#4ade80", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none", fontWeight: 600 }}>
            Check in now →
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Pending action items */}
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
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : todo.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1.5rem 0" }}>
              You're all caught up!
            </div>
          ) : (
            <div className={styles.actionList}>
              {todo.slice(0, 5).map((item) => (
                <div key={item.id} className={styles.actionCard}>
                  <div className={styles.actionBody}>
                    <div className={styles.actionTitle}>{item.title}</div>
                    <div className={styles.actionMeta}>
                      {item.due_date && (
                        <span className={styles.actionMetaItem}>
                          Due {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {item.additional_info?.assigned_by && (
                        <span className={styles.actionMetaItem}>
                          From {item.additional_info.assigned_by}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {todo.length > 5 && (
                <div style={{ padding: "0.5rem 0.25rem", color: "rgba(249,249,249,0.35)", fontSize: "0.8rem", fontFamily: "Inter" }}>
                  +{todo.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completed items */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>Recently Completed</span>
            <Link href={`${base}/action_items`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : done.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1.5rem 0" }}>
              No completed items yet
            </div>
          ) : (
            <div className={styles.actionList}>
              {done.slice(0, 5).map((item) => (
                <div key={item.id} className={`${styles.actionCard} ${styles.done}`}>
                  <div className={styles.actionBody}>
                    <div className={`${styles.actionTitle} ${styles.strikethrough}`}>{item.title}</div>
                    <div className={styles.actionMeta}>
                      {item.completion_date && (
                        <span className={styles.actionMetaItem}>
                          Completed {new Date(item.completion_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {done.length > 5 && (
                <div style={{ padding: "0.5rem 0.25rem", color: "rgba(249,249,249,0.35)", fontSize: "0.8rem", fontFamily: "Inter" }}>
                  +{done.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
