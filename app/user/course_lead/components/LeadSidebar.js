"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./UserSidebar.module.css";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/people", label: "People" },
  { href: "/action_items", label: "Action Items" },
  { href: "/events", label: "Events" },
];

export default function LeadSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const role = session?.user?.role;
  const base = role ? `/user/${role}` : null;
  if (!base) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.siteTitle}>CS 124H</div>
      <div className={styles.roleTitle}>Course Lead</div>
      {session?.user?.name && (
        <div className={styles.userName}>{session.user.name}</div>
      )}
      <div className={styles.linkGroup}>
        {links.map((link) => {
          const fullHref = link.href === "/" ? base : `${base}${link.href}`;
          const isActive = link.href === "/"
            ? pathname === fullHref
            : pathname === fullHref || pathname.startsWith(`${fullHref}/`);
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
      <button
        className={styles.logoutBtn}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Logout
      </button>
    </aside>
  );
}
