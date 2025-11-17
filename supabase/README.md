# Events Management System - Database Setup

This directory contains Supabase database migrations for the CS124H Events Management System.

## Database Schema

### Tables

1. **events** - Stores all event information
   - `id` (UUID) - Primary key
   - `title` (VARCHAR) - Event title
   - `description` (TEXT) - Event description
   - `location` (VARCHAR) - Event location
   - `presenter` (VARCHAR) - Event presenter name
   - `start_time` (TIMESTAMP) - Event start time
   - `end_time` (TIMESTAMP) - Event end time
   - `point_value` (INTEGER) - Points awarded for attendance (default: 10)
   - `qr_code_secret` (VARCHAR) - Unique QR code for check-in
   - `is_active` (BOOLEAN) - Whether event is active
   - `created_at` (TIMESTAMP) - When event was created
   - `updated_at` (TIMESTAMP) - Last update time

2. **event_checkins** - Tracks student check-ins
   - `id` (UUID) - Primary key
   - `event_id` (UUID) - Foreign key to events table
   - `net_id` (VARCHAR) - Student NetID
   - `checked_in_at` (TIMESTAMP) - Check-in timestamp
   - Unique constraint on (event_id, net_id) to prevent duplicates

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the migration file: `migrations/001_create_events_tables.sql`
5. Copy the entire contents and paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to project root
cd /Users/lukeguo/github/cs124h-site

# Initialize Supabase (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref qarjhlawruoizgswgntg

# Push migration to database
supabase db push
```

## Verify Migration

After running the migration, verify the setup:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see two new tables: `events` and `event_checkins`
3. The `events` table should have 5 sample events pre-populated

## API Endpoints

Once the migration is complete, you can use these API endpoints:

### Get All Events
```
GET /api/events
GET /api/events?upcoming=true
GET /api/events?past=true
```

### Create Event (Admin)
```
POST /api/events
Body: {
  "title": "Event Title",
  "description": "Event description",
  "location": "Location",
  "presenter": "Presenter Name",
  "start_time": "2025-12-01T18:00:00",
  "end_time": "2025-12-01T20:00:00",
  "point_value": 10,
  "qr_code_secret": "UNIQUE_CODE"
}
```

### Check In to Event
```
POST /api/events/checkin
Body: {
  "event_id": "uuid-here",
  "net_id": "student_netid",
  "qr_code_secret": "UNIQUE_CODE"
}
```

### Get Event Check-ins
```
GET /api/events/checkin?event_id=uuid-here
```

## Row Level Security (RLS)

The migration enables RLS with these policies:

- **Public Read**: Anyone can view events and check-ins
- **Check-in**: Authenticated and anonymous users can check in
- **Admin**: Only service_role can create/update/delete events

## Integration with Leaderboard

Check-ins automatically sync with the existing `attendance_sheet` table, so points are reflected in the leaderboard.

## Troubleshooting

### "relation already exists" error
If you see this error, the tables might already exist. You can:
1. Drop the existing tables first (be careful!)
2. Or modify the migration to use `CREATE TABLE IF NOT EXISTS`

### Permission errors
Make sure your Supabase client is using the correct anon key from `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://qarjhlawruoizgswgntg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Steps

After running the migration:

1. ✅ Events page will automatically fetch from database
2. 🔲 Implement QR code generation (upcoming)
3. 🔲 Create admin dashboard to manage events
4. 🔲 Build QR scanner for check-ins
5. 🔲 Create live presenter view

---

For questions or issues, contact the CS124H development team.
