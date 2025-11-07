import React from "react";
import Navbar from "../../components/navbar.js";
import "./Timeline.css";

export default function TimelinePage() {
  return (
    <div className={"container"}>
      <Navbar />
      <main className={"main"}>
        <div className={"boxWrapper"}>
          <div className={"whiteBox"}>
            <h2>
              Add our GCAL{" "}
              <a
                href="https://calendar.google.com/calendar/embed?src=cs124honors%40gmail.com&ctz=America%2FChicago"
                target="_blank"
              >
                here
              </a>
            </h2>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                align: "center",
                height: "85%",
                width: "100%",
              }}
            >
              {/* add &mode=WEEK at the end of the url to change to week view */}
              <iframe
                src="https://calendar.google.com/calendar/embed?src=cs124honors%40gmail.com&ctz=America%2FChicago"
                style={{
                  border: "10",
                  flex: 1,
                }}
              ></iframe>
            </div>
          </div>
          <div className={"greyBox"}>
            <h2>Upcoming Events</h2>
          </div>
        </div>
      </main>
    </div>
  );
}
