"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import StaffCard from "../../components/StaffCard";
import SemesterTabs from "../../components/SemesterTabs";
import "./CourseStaff.css";

export default function CourseStaffPage() {
  const [semestersData, setSemestersData] = useState([]); // [{ semester, data:[...] } or { semester, staff:[...] }]
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedSemesterIndex, setSelectedSemesterIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    import("../../data/staff_data.json").then((mod) => {
      // Supports: export default [...] OR { default: { data: [...] } } OR { default: [...] }
      const payload = mod?.default ?? mod;
      const semesters =
        Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

      if (mounted) setSemestersData(semesters);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Lock scroll & enable ESC to close when modal is open
  useEffect(() => {
    if (!selectedMember) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedMember]);

  const openModal = (member) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  if (!semestersData?.length) return null;
  
  const getPeople = (semesterObj) => {
    if (!semesterObj) return [];
    if (Array.isArray(semesterObj.data)) return semesterObj.data;
    if (Array.isArray(semesterObj.staff)) return semesterObj.staff;
    return [];
  };

  const semesterTitles = semestersData.map((s) => s.semester);

  // Guarded index
  const safeSemesterIndex =
    selectedSemesterIndex >= 0 && selectedSemesterIndex < semestersData.length
      ? selectedSemesterIndex
      : 0;

  const currentSemester = semestersData[safeSemesterIndex];
  const people = getPeople(currentSemester);

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="header">
          <h1 className={`title ${selectedMember ? "opacity-20" : "opacity-100"}`}>
            Our Staff
          </h1>
        </div>

        <SemesterTabs
          semesters={semesterTitles}
          selectedSemester={safeSemesterIndex}
          onSelectSemester={(index) => {
            setSelectedSemesterIndex(index);
            if (selectedMember) closeModal();
          }}
        />

        <div
          className={`staff-card-container ${selectedMember ? "opacity-20" : "opacity-100"}`}
        >
          {people.map((member) => (
            <StaffCard key={member.id ?? member.name} member={member} onClick={openModal} />
          ))}
        </div>

        {selectedMember && (
          <div
            className="popup"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-name"
          >
            <div className="popup-content" onClick={(e) => e.stopPropagation()} role="document">
              <button className="close" onClick={closeModal} aria-label="Close">
                &times;
              </button>

              <div className="image-popup">
                <img src={selectedMember.image} alt={selectedMember.name} />
              </div>

              <div className="text-content">
                <h2 id="member-name">{selectedMember.name}</h2>
                <p className="role">{selectedMember.role}</p>

                <div className="staff-details">
                  <div className="detail-item">
                    <div className="label">Year:</div>
                    <div className="value">{selectedMember.year || "N/A"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="label">Major:</div>
                    <div className="value">{selectedMember.major || "N/A"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="label">Semesters as PM:</div>
                    <div className="value">{selectedMember.semesters || "N/A"}</div>
                  </div>

                  {selectedMember.email && (
                    <div className="detail-item">
                      <div className="label">UIUC Email:</div>
                      <div className="value">{selectedMember.email}</div>
                    </div>
                  )}
                </div>

                <div className="bio-section">
                  <div className="bio">{selectedMember.bio}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}