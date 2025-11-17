"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar.js";
import styles from "./Events.module.css";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" or "past"
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  // Lock scroll & add ESC-to-close when modal is open
  useEffect(() => {
    if (!selectedEvent) return;

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
  }, [selectedEvent]);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events:', data.error);
        // Fallback to empty array on error
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (event) => setSelectedEvent(event);
  const closeModal = () => setSelectedEvent(null);

  const openAdminModal = () => setShowAdminModal(true);
  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminCode("");
    setAdminError("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");

    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_code: adminCode })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('admin_token', data.token);
        // Redirect to manage page
        window.location.href = '/events/manage';
      } else {
        setAdminError(data.error || 'Invalid admin code');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setAdminError('Failed to authenticate. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const now = new Date();
  const upcomingEvents = events.filter(
    (event) => new Date(event.start_time) > now
  );
  const pastEvents = events.filter(
    (event) => new Date(event.start_time) <= now
  );

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={selectedEvent || showAdminModal ? styles.headerBlurred : ""}>
              Events
            </h1>
          </div>
          <button
            className={styles.manageButton}
            onClick={openAdminModal}
          >
            Manage
          </button>
        </div>

        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`${styles.tabButton} ${
              activeTab === "upcoming" ? styles.activeTab : ""
            }`}
            type="button"
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`${styles.tabButton} ${
              activeTab === "past" ? styles.activeTab : ""
            }`}
            type="button"
          >
            Past Events ({pastEvents.length})
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading events...</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>
              {activeTab === "upcoming"
                ? "No upcoming events at the moment. Check back soon!"
                : "No past events to display."}
            </p>
          </div>
        ) : (
          <div
            className={`${styles.eventsGrid} ${
              selectedEvent ? styles.gridBlurred : ""
            }`}
          >
            {displayEvents.map((event) => (
              <div
                className={styles.eventCard}
                key={event.id}
                onClick={() => openModal(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && openModal(event)
                }
              >
                <div className={styles.eventCardHeader}>
                  <h3>{event.title}</h3>
                  {event.point_value > 0 && (
                    <span className={styles.pointsBadge}>
                      {event.point_value} pts
                    </span>
                  )}
                </div>

                <div className={styles.eventCardBody}>
                  <div className={styles.eventDetail}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{formatDate(event.start_time)}</span>
                  </div>

                  <div className={styles.eventDetail}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </span>
                  </div>

                  <div className={styles.eventDetail}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                </div>

                <p className={styles.eventDescription}>
                  {event.description.length > 100
                    ? event.description.substring(0, 100) + "..."
                    : event.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div
            className={styles.modal}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              role="document"
            >
              <button
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Close"
              >
                &times;
              </button>

              <div className={styles.modalHeader}>
                <h2 id="event-title">{selectedEvent.title}</h2>
                {selectedEvent.point_value > 0 && (
                  <span className={styles.pointsBadgeLarge}>
                    {selectedEvent.point_value} points
                  </span>
                )}
              </div>

              <div className={styles.modalBody}>
                <div className={styles.eventInfo}>
                  <div className={styles.infoRow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div>
                      <strong>Date:</strong>
                      <p>{formatDate(selectedEvent.start_time)}</p>
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div>
                      <strong>Time:</strong>
                      <p>
                        {formatTime(selectedEvent.start_time)} -{" "}
                        {formatTime(selectedEvent.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div>
                      <strong>Location:</strong>
                      <p>{selectedEvent.location}</p>
                    </div>
                  </div>

                  {selectedEvent.presenter && (
                    <div className={styles.infoRow}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <div>
                        <strong>Presenter:</strong>
                        <p>{selectedEvent.presenter}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.descriptionSection}>
                  <h3>About This Event</h3>
                  <p>{selectedEvent.description}</p>
                </div>

                {activeTab === "upcoming" && (
                  <div className={styles.modalActions}>
                    {selectedEvent.join_link ? (
                      <a
                        href={selectedEvent.join_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.checkInButton}
                      >
                        RSVP Now on Discord
                      </a>
                    ) : (
                      <button className={styles.checkInButton} disabled>
                        RSVP Link Coming Soon
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {showAdminModal && (
          <div
            className={styles.modal}
            onClick={closeAdminModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <div
              className={styles.adminModalContent}
              onClick={(e) => e.stopPropagation()}
              role="document"
            >
              <button
                className={styles.closeButton}
                onClick={closeAdminModal}
                aria-label="Close"
              >
                &times;
              </button>

              <div className={styles.adminModalHeader}>
                <h2 id="admin-modal-title">Admin Login</h2>
                <p>Enter the admin code to manage events</p>
              </div>

              <form onSubmit={handleAdminLogin} className={styles.adminForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="admin-code">Admin Code</label>
                  <input
                    id="admin-code"
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter admin code"
                    className={styles.adminInput}
                    autoFocus
                    required
                  />
                </div>

                {adminError && (
                  <div className={styles.errorMessage}>
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.adminSubmitButton}
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
