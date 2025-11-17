-- Migration: Create Events and Event Check-ins Tables
-- Description: Sets up the database schema for the event management system
-- Created: 2025-11-17

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EVENTS TABLE
-- ============================================
-- Stores all event information
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  presenter VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  point_value INTEGER DEFAULT 10,
  qr_code_secret VARCHAR(255) UNIQUE, -- Unique code for QR check-in
  join_link TEXT, -- Discord event signup link or other join URL
  checked_in_students JSONB DEFAULT '[]'::jsonb, -- Array of checked-in students with {student_name, student_netid, student_email}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENT CHECK-INS TABLE
-- ============================================
-- Tracks which students have checked into which events
CREATE TABLE IF NOT EXISTS event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  net_id VARCHAR(50) NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, net_id) -- Prevent duplicate check-ins
);

-- ============================================
-- INDEXES
-- ============================================
-- Improve query performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_net_id ON event_checkins(net_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on both tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

-- Policy: Anyone can read events (public access for student viewing)
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Policy: Allow all event mutations (admin auth handled in API layer)
-- Admin authentication is handled via API endpoints with PRIVATE_EVENTS_MANAGE_KEY
CREATE POLICY "Allow event mutations"
  ON events FOR INSERT
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow event updates"
  ON events FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow event deletions"
  ON events FOR DELETE
  USING (true);

-- ============================================
-- EVENT CHECK-INS TABLE POLICIES
-- ============================================

-- Policy: Anyone can read check-ins (for leaderboard/attendance display)
CREATE POLICY "Check-ins are viewable by everyone"
  ON event_checkins FOR SELECT
  USING (true);

-- Policy: Allow anonymous users to insert check-ins (student check-in via QR code)
-- Duplicate prevention is handled by UNIQUE constraint and API validation
CREATE POLICY "Allow check-in insertion"
  ON event_checkins FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on events table
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();