"use client";

import React, { useState } from "react";
import styles from "./HallOfFame.module.css";
import projects_data from "../../data/projects_data.json";
import SemesterTabs from "../../components/SemesterTabs.js";
import ProjectCard from "../../components/ProjectCard.js";

export default function HallOfFamePage() {
  // state to keep track of the selected sem
  const [selectedSemester, setSelectedSemester] = useState(0);
  // list of sems from the data keys
  const semesters = projects_data.map((entry) => entry.semester);
  const projects = projects_data.map((entry) => {if (entry.semester === semesters[selectedSemester]) return entry.data;}).flat().filter(Boolean);

  return (
    <div className={`${styles.pageContainer} pageContainer`}>
      {/* Main content area */}
      <main className={styles.mainContent}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to the Hall of Fame!</h1>
        </div>

        {/* Semester Selection Tabs */}
        <SemesterTabs
          semesters={semesters}
          selectedSemester={selectedSemester}
          onSelectSemester={setSelectedSemester}
        />

        {/* Project Grid Section */}
        {projects.length > 0 ? (
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className={styles.noProjects}>
            No projects found for this semester.
          </p>
        )}
      </main>
    </div>
  );
}
