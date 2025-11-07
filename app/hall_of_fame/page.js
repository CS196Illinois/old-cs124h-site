"use client"; // Required for useState and event handlers

import React, { useState } from "react";
import Navbar from "../../components/navbar.js";
import "./HallOfFame.css";
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
    <div className={"pageContainer"}>
      <Navbar />
      {/* Main content area */}
      <main className={"mainContent"}>
        {/* Header Section */}
        <div className={"header"}>
          <h1 className={"title"}>Welcome to the Hall of Fame!</h1>
        </div>

        {/* Semester Selection Tabs */}
        <SemesterTabs
          semesters={semesters}
          selectedSemester={selectedSemester}
          onSelectSemester={setSelectedSemester}
        />

        {/* Project Grid Section */}
        {projects.length > 0 ? (
          <div className={"projectGrid"}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className={"noProjects"}>
            No projects found for this semester.
          </p>
        )}
      </main>
    </div>
  );
}
