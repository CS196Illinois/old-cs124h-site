import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supbaseClient';

/**
 * GET /api/events
 * Fetches all events from Supabase
 * Query params:
 *   - upcoming: true/false (filter by upcoming events)
 *   - past: true/false (filter by past events)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming');
    const past = searchParams.get('past');

    let query = supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    // Filter by upcoming or past events
    const now = new Date().toISOString();

    if (upcoming === 'true') {
      query = query.gt('start_time', now);
    } else if (past === 'true') {
      query = query.lt('start_time', now);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Creates a new event
 * Body: { title, description, location, presenter, start_time, end_time, point_value, qr_code_secret, join_link }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      presenter,
      start_time,
      end_time,
      point_value = 10,
      qr_code_secret,
      join_link
    } = body;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, end_time' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          description,
          location,
          presenter,
          start_time,
          end_time,
          point_value,
          qr_code_secret,
          join_link
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
