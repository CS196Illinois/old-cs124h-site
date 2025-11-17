import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supbaseClient';

/**
 * POST /api/events/checkin
 * Handles student check-in to an event
 * Body: { event_id, net_id, qr_code_secret, student_name, student_email }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id, net_id, qr_code_secret, student_name, student_email } = body;

    // Validate required fields
    if (!event_id || !net_id || !qr_code_secret) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, net_id, qr_code_secret' },
        { status: 400 }
      );
    }

    // 1. Verify the event exists and QR code is correct
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('qr_code_secret', qr_code_secret)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Invalid event or QR code' },
        { status: 404 }
      );
    }

    // 2. Check if event is active and hasn't ended
    const now = new Date();
    const eventEnd = new Date(event.end_time);

    if (!event.is_active) {
      return NextResponse.json(
        { error: 'This event is not active' },
        { status: 400 }
      );
    }

    if (eventEnd < now) {
      return NextResponse.json(
        { error: 'This event has already ended' },
        { status: 400 }
      );
    }

    // 3. Check if student has already checked in
    const { data: existingCheckin } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('event_id', event_id)
      .eq('net_id', net_id)
      .single();

    if (existingCheckin) {
      return NextResponse.json(
        {
          error: 'Already checked in',
          message: 'You have already checked into this event',
          checkin: existingCheckin
        },
        { status: 409 } // Conflict
      );
    }

    // 4. Create check-in record
    const { data: checkin, error: checkinError } = await supabase
      .from('event_checkins')
      .insert([
        {
          event_id,
          net_id,
        }
      ])
      .select()
      .single();

    if (checkinError) {
      console.error('Error creating check-in:', checkinError);
      return NextResponse.json(
        { error: 'Failed to check in', details: checkinError.message },
        { status: 500 }
      );
    }

    // 5. Update checked_in_students JSONB array
    const currentCheckedInStudents = event.checked_in_students || [];
    const newStudent = {
      student_name: student_name || 'Unknown',
      student_netid: net_id,
      student_email: student_email || '',
      checked_in_at: new Date().toISOString()
    };

    const updatedCheckedInStudents = [...currentCheckedInStudents, newStudent];

    const { error: updateEventError } = await supabase
      .from('events')
      .update({ checked_in_students: updatedCheckedInStudents })
      .eq('id', event_id);

    if (updateEventError) {
      console.warn('Warning: Failed to update checked_in_students:', updateEventError.message);
      // Don't fail the check-in if this update fails
    }

    // 6. Optional: Add points to attendance_sheet table
    // (Integrate with existing leaderboard system)
    const { error: attendanceError } = await supabase
      .from('attendance_sheet')
      .insert([
        {
          net_id,
          point_value: event.point_value
        }
      ]);

    if (attendanceError) {
      console.warn('Warning: Failed to update attendance_sheet:', attendanceError.message);
      // Don't fail the check-in if attendance sheet update fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully checked in! You earned ${event.point_value} points.`,
        checkin,
        points_earned: event.point_value,
        event: {
          title: event.title,
          location: event.location,
          presenter: event.presenter
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/checkin?event_id={id}
 * Get all check-ins for a specific event
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      );
    }

    // Fetch check-ins with group information
    const { data: checkins, error } = await supabase
      .from('event_checkins')
      .select(`
        *,
        groups:net_id (
          net_id,
          group_number,
          group_name
        )
      `)
      .eq('event_id', event_id)
      .order('checked_in_at', { ascending: false });

    if (error) {
      console.error('Error fetching check-ins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch check-ins', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        event_id,
        total_checkins: checkins.length,
        checkins
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
