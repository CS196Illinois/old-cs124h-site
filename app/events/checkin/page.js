"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../../components/navbar.js";
import styles from "./Checkin.module.css";

function CheckinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    net_id: "",
    student_name: "",
    student_email: ""
  });

  // Get event_id and secret from URL params
  const eventId = searchParams.get("event_id");
  const secret = searchParams.get("secret");

  useEffect(() => {
    if (!eventId || !secret) {
      setError("Invalid QR code. Missing event information.");
      setLoading(false);
      return;
    }

    fetchEventDetails();
  }, [eventId, secret]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (response.ok && data.event) {
        // Verify the QR code secret matches
        if (data.event.qr_code_secret !== secret) {
          setError("Invalid QR code secret. Please scan a valid event QR code.");
          setLoading(false);
          return;
        }

        setEvent(data.event);
      } else {
        setError("Event not found.");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          net_id: formData.net_id,
          qr_code_secret: secret,
          student_name: formData.student_name,
          student_email: formData.student_email
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to events page after 3 seconds
        setTimeout(() => {
          router.push("/events");
        }, 3000);
      } else {
        setError(data.error || "Failed to check in. Please try again.");
      }
    } catch (error) {
      console.error("Error checking in:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <p>Loading event details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <h1>Check-In Error</h1>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.backButton}
              onClick={() => router.push("/events")}
            >
              Back to Events
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h1>Check-In Successful!</h1>
            <p className={styles.successMessage}>
              You've earned {event.point_value} points for attending <strong>{event.title}</strong>
            </p>
            <p className={styles.redirectMessage}>
              Redirecting to events page...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.checkinContainer}>
          <div className={styles.eventInfo}>
            <h1>Event Check-In</h1>
            <div className={styles.eventDetails}>
              <h2>{event.title}</h2>
              <div className={styles.detailRow}>
                <span className={styles.label}>Location:</span>
                <span>{event.location || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Presenter:</span>
                <span>{event.presenter || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Time:</span>
                <span>{formatDateTime(event.start_time)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Points:</span>
                <span className={styles.pointBadge}>{event.point_value}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.checkinForm}>
            <h3>Enter Your Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="net_id">NetID *</label>
              <input
                id="net_id"
                name="net_id"
                type="text"
                value={formData.net_id}
                onChange={handleInputChange}
                placeholder="e.g., johndoe2"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="student_name">Full Name *</label>
              <input
                id="student_name"
                name="student_name"
                type="text"
                value={formData.student_name}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="student_email">Email</label>
              <input
                id="student_email"
                name="student_email"
                type="email"
                value={formData.student_email}
                onChange={handleInputChange}
                placeholder="e.g., johndoe2@illinois.edu"
              />
            </div>

            {error && (
              <div className={styles.errorBanner}>{error}</div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? "Checking In..." : "Check In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <p>Loading event details...</p>
          </div>
        </main>
      </div>
    }>
      <CheckinPageContent />
    </Suspense>
  );
}
