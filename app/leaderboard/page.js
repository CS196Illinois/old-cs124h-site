'use client';
import React, { useState, useEffect } from "react";
import "./Leaderboard.css";
import Navbar from "../../components/navbar";
import { getGroupPointsSummary } from "./leaderboard_supabase";

const groups = [
  { rank: 1, name: "Group 1: DOMinators", points: 90 },
  { rank: 2, name: "Group 10: Swift & Steady", points: 80 },
  { rank: 3, name: "Group 7: The Dev-iators", points: 65 },
  { rank: 4, name: "Group 13: Hack Overflow", points: 40 },
  { rank: 5, name: "Group 3: Cookie Bytes", points: 30 },
  { rank: 6, name: "Group 8: Stack Breakers", points: 25 },
  { rank: 7, name: "Group 2: HiHihihi", points: 20 },
];

export default function LeaderboardPage() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const newLeaderboardData = await getGroupPointsSummary();
      setLeaderboardData(newLeaderboardData || []);
    }

    fetchData()
  }, []) // empty dependency array => runs on mount
  

  const handleToggle = () => {
    if (visibleCount === groups.length) {
      setVisibleCount(4); // Collapse
    } else {
      setVisibleCount(groups.length); // Show all
    }
  };

  return (
    <>
      <Navbar />
      <div className={"container"}>
        <h1 className={"title"}>
          Leaderboard{" "}
          <span role="img" aria-label="trophy">
            🏆
          </span>
        </h1>

        <div className={"groupList"}>
          {leaderboardData.slice(0, visibleCount).map((group, index) => (
            <div
              key={group.rank}
              className={`${"card"} ${
                index < 3 ? "topThree" : "fourth"
              }`}
            >
              <div className={"rank"}>#{group.rank}</div>
              <div className={"name"}>Group: {group.group_number}</div>
              <div className={"points"}>
                Points: <span>{group.total_points}</span> 🏆
              </div>
            </div>
          ))}
        </div>

        <button className={"moreButton"} onClick={handleToggle}>
          {visibleCount === groups.length ? "Show Less" : "Show More"}
        </button>
      </div>
    </>
  );
}
