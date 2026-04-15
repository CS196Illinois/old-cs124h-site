"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../dashboard.module.css";

const ROLES = ["LEAD", "HEAD", "PM", "WEB", "STUDENT"];
const ROLE_LABELS = { LEAD: "Course Lead", HEAD: "Head PM", PM: "PM", WEB: "Web Dev", STUDENT: "Student" };

function roleBadge(role, s) {
  const cls = { LEAD: s.badgeLEAD, HEAD: s.badgeHEAD, PM: s.badgePM, WEB: s.badgeWEB, STUDENT: s.badgeSTUDENT };
  return <span className={`${s.badge} ${cls[role] ?? ""}`}>{role}</span>;
}

export default function CourseLeadDashboard() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const base = "/user/course_lead";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, itemsRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/action_items"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (itemsRes.ok) setActionItems(await itemsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (status === "loading") return <div className={styles.loading}>Loading…</div>;

  const stats = {
    LEAD: users.filter((u) => u.role === "LEAD").length,
    HEAD: users.filter((u) => u.role === "HEAD").length,
    PM: users.filter((u) => u.role === "PM").length,
    WEB: users.filter((u) => u.role === "WEB").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
  };
  const openItems = actionItems.filter((a) => !a.is_done);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Course Lead Dashboard</h1>
        <p>Welcome, {session?.user?.name || session?.user?.netID}</p>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "Course Leads", val: stats.LEAD },
          { label: "Head PMs", val: stats.HEAD },
          { label: "PMs", val: stats.PM },
          { label: "Web Devs", val: stats.WEB },
          { label: "Students", val: stats.STUDENT },
          { label: "Open Items", val: openItems.length },
        ].map(({ label, val }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statNumber}>{val}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* People overview */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>Team Overview</span>
            <Link href={`${base}/people`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          {loading ? (
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {ROLES.map((r) => (
                <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily: "Inter", fontSize: "0.9rem" }}>{roleBadge(r, styles)}</span>
                  <span style={{ color: "rgba(249,249,249,0.6)", fontFamily: "Inter", fontSize: "0.88rem" }}>
                    {stats[r]} member{stats[r] !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open action items */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#f9f9f9", fontFamily: "Inter", fontWeight: 600 }}>Open Action Items</span>
            <Link href={`${base}/action_items`} style={{ color: "#ecb557", fontSize: "0.82rem", fontFamily: "Inter", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div className={styles.loading} style={{ padding: "1rem 0" }}>Loading…</div>
          ) : openItems.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1.5rem 0" }}>
              No open items
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {openItems.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                      <td className={styles.cellMono}>{item.net_id}</td>
                      <td style={{ color: "rgba(249,249,249,0.55)", fontSize: "0.82rem" }}>
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {openItems.length > 6 && (
                <div style={{ padding: "0.5rem 0.9rem", color: "rgba(249,249,249,0.35)", fontSize: "0.8rem", fontFamily: "Inter" }}>
                  +{openItems.length - 6} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
