"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./UserSidebar.module.css";
import { useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/action_items", label: "Action Items" },
  { href: "/student_attendance", label: "Student Attendance" },
  { href: "/settings", label: "Settings" },
  { href: "/logout", label: "Logout" },
];

export default function LeadSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  console.log(session);

  // Don't render sidebar until session is loaded to avoid fallback routes
  if (status === "loading") {
    return null;
  }

  const role = session?.user?.role;
  const base = role ? `/user/${role}` : null;

  // If user is not authenticated, don't render the sidebar
  if (!base) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.linkGroup}>
        {links.map((link) => {
          const fullHref = link.href === "/" ? base : `${base}${link.href}`;
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

          return (
            <Link
              key={link.href}
              href={fullHref}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
