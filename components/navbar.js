"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className={styles.navbar}>
        {/* Mobile hamburger menu */}
        {isMobile && (
          <button 
            className={styles["hamburger-menu"]}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
          </button>
        )}

        {/* Desktop navigation */}
        <div className={`${styles["nav-items"]} ${isMobile ? styles.hidden : ''}`}>
          <Link href="/">
            <button
              className={`${styles["nav-button"]} ${styles["home-button"]} ${
                pathname === "/" ? styles.active : ""
              }`}
            >
              Home
            </button>
          </Link>
          <Link href="/hall_of_fame">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/hall_of_fame" ? styles.active : ""
              }`}
            >
              ⭐ Hall Of Fame ⭐
            </button>
          </Link>
          <Link href="/resources">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/resources" ? styles.active : ""
              }`}
            >
              Resources
            </button>
          </Link>
          <Link href="/course_staff">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/course_staff" ? styles.active : ""
              }`}
            >
              Course Staff
            </button>
          </Link>
          <Link href="/leaderboard">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/leaderboard" ? styles.active : ""
              }`}
            >
              Leaderboard
            </button>
          </Link>
          <Link href="/timeline">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/timeline" ? styles.active : ""
              }`}
            >
              Timeline
            </button>
          </Link>
          <Link href="/events">
            <button
              className={`${styles["nav-button"]} ${
                pathname === "/events" ? styles.active : ""
              }`}
            >
              Events
            </button>
          </Link>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div 
            className={`${styles.overlay} ${isSidebarOpen ? styles.active : ''}`}
            onClick={handleLinkClick}
          ></div>
          
          {/* Sidebar */}
          <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
            <div className={styles["sidebar-content"]}>
              <Link href="/" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${styles["home-button"]} ${
                    pathname === "/" ? styles.active : ""
                  }`}
                >
                  Home
                </button>
              </Link>
              <Link href="/hall_of_fame" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/hall_of_fame" ? styles.active : ""
                  }`}
                >
                  ⭐ Hall Of Fame ⭐
                </button>
              </Link>
              <Link href="/resources" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/resources" ? styles.active : ""
                  }`}
                >
                  Resources
                </button>
              </Link>
              <Link href="/course_staff" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/course_staff" ? styles.active : ""
                  }`}
                >
                  Course Staff
                </button>
              </Link>
              <Link href="/leaderboard" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/leaderboard" ? styles.active : ""
                  }`}
                >
                  Leaderboard
                </button>
              </Link>
              <Link href="/timeline" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/timeline" ? styles.active : ""
                  }`}
                >
                  Timeline
                </button>
              </Link>
              <Link href="/events" onClick={handleLinkClick}>
                <button
                  className={`${styles["nav-button"]} ${
                    pathname === "/events" ? styles.active : ""
                  }`}
                >
                  Events
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
};