"use client";

import { useState } from "react";
import styles from "./ActionItems.module.css";

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [todoSelected, setTodoSelected] = useState(true);
  return (
    <div className={`${styles.pageContainer} pageContainer`}>
      <main>
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setTodoSelected(!todoSelected)}
            className={`${styles.tabButton} ${todoSelected ? styles.activeTab : ""}`}
          >
            To Do
          </button>
          <button
            onClick={() => setTodoSelected(!todoSelected)}
            className={`${styles.tabButton} ${todoSelected ? "" : styles.activeTab}`}
          >
            Completed
          </button>
        </div>
      </main>
    </div>
  );
}
