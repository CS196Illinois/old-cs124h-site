"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Navbar from "../../../components/navbar.js";
import styles from "./Manage.module.css";

export default function ManageEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQREvent, setSelectedQREvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const qrCanvasRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    presenter: "",
    start_time: "",
    end_time: "",
    point_value: 10,
    qr_code_secret: "",
    join_link: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/events');
      return;
    }
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      presenter: "",
      start_time: "",
      end_time: "",
      point_value: 10,
      qr_code_secret: "",
      join_link: "",
    });
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      presenter: event.presenter || "",
      start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "",
      end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "",
      point_value: event.point_value || 10,
      qr_code_secret: event.qr_code_secret || "",
      join_link: event.join_link || "",
    });
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const endpoint = editingEvent
        ? `/api/events/${editingEvent.id}`
        : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        setTimeout(() => {
          closeEventModal();
          fetchEvents();
        }, 1500);
      } else {
        setError(data.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Event deleted successfully!');
        fetchEvents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/events');
  };

  const openQRModal = async (event) => {
    setSelectedQREvent(event);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQREvent(null);
  };

  // Generate QR code when modal opens
  useEffect(() => {
    if (showQRModal && selectedQREvent && qrCanvasRef.current) {
      // Create check-in URL with event data as query params
      const baseUrl = window.location.origin;
      const checkInUrl = `${baseUrl}/events/checkin?event_id=${selectedQREvent.id}&secret=${selectedQREvent.qr_code_secret}`;

      QRCode.toCanvas(qrCanvasRef.current, checkInUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#112a67',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [showQRModal, selectedQREvent]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
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

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <h1>Manage Events</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.createButton}
              onClick={openCreateModal}
            >
              + Create Event
            </button>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {error && !showEventModal && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        {success && !showEventModal && (
          <div className={styles.successBanner}>{success}</div>
        )}

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>No events found. Create your first event!</p>
          </div>
        ) : (
          <div className={styles.eventsTable}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Presenter</th>
                  <th>Start Time</th>
                  <th>Points</th>
                  <th>QR Code</th>
                  <th>Check-ins</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className={styles.titleCell}>{event.title}</td>
                    <td>{event.location}</td>
                    <td>{event.presenter || 'N/A'}</td>
                    <td>{formatDateTime(event.start_time)}</td>
                    <td>{event.point_value}</td>
                    <td><code>{event.qr_code_secret}</code></td>
                    <td>{event.checked_in_students?.length || 0}</td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.qrButton}
                        onClick={() => openQRModal(event)}
                      >
                        QR Code
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(event)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Event Form Modal */}
        {showEventModal && (
          <div className={styles.modal} onClick={closeEventModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={closeEventModal}
              >
                &times;
              </button>

              <div className={styles.modalHeader}>
                <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              </div>

              <form onSubmit={handleSubmit} className={styles.eventForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Title *</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="presenter">Presenter</label>
                    <input
                      id="presenter"
                      name="presenter"
                      type="text"
                      value={formData.presenter}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="start_time">Start Time *</label>
                    <input
                      id="start_time"
                      name="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="end_time">End Time *</label>
                    <input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="point_value">Point Value</label>
                    <input
                      id="point_value"
                      name="point_value"
                      type="number"
                      min="0"
                      value={formData.point_value}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="qr_code_secret">QR Code Secret (4-digit code)</label>
                    <input
                      id="qr_code_secret"
                      name="qr_code_secret"
                      type="text"
                      value={formData.qr_code_secret}
                      onChange={handleInputChange}
                      placeholder="e.g., 1234"
                      pattern="[0-9]{4}"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="join_link">Discord Join Link</label>
                    <input
                      id="join_link"
                      name="join_link"
                      type="url"
                      value={formData.join_link}
                      onChange={handleInputChange}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMessage}>{error}</div>
                )}

                {success && (
                  <div className={styles.successMessage}>{success}</div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeEventModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && selectedQREvent && (
          <div className={styles.modal} onClick={closeQRModal}>
            <div
              className={styles.qrModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={closeQRModal}
              >
                &times;
              </button>

              <div className={styles.qrModalHeader}>
                <h2>Event QR Code</h2>
                <p className={styles.eventTitle}>{selectedQREvent.title}</p>
              </div>

              <div className={styles.qrContentLayout}>
                <div className={styles.qrCodeContainer}>
                  <canvas ref={qrCanvasRef} />
                </div>

                <div className={styles.eventDetails}>
                  <h3>Event Details</h3>
                  <div className={styles.detailItem}>
                    <strong>Location:</strong>
                    <span>{selectedQREvent.location || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Presenter:</strong>
                    <span>{selectedQREvent.presenter || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Start Time:</strong>
                    <span>{formatDateTime(selectedQREvent.start_time)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>End Time:</strong>
                    <span>{formatDateTime(selectedQREvent.end_time)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Points:</strong>
                    <span>{selectedQREvent.point_value}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>QR Secret:</strong>
                    <code>{selectedQREvent.qr_code_secret}</code>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Check-ins:</strong>
                    <span>{selectedQREvent.checked_in_students?.length || 0} students</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
