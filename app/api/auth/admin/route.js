import { NextResponse } from 'next/server';

/**
 * POST /api/auth/admin
 * Validates admin code
 * Body: { admin_code }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { admin_code } = body;

    // Get admin code from environment variable
    const ADMIN_CODE = process.env.PRIVATE_EVENTS_MANAGE_KEY;

    if (!admin_code) {
      return NextResponse.json(
        { error: 'Admin code is required' },
        { status: 400 }
      );
    }

    if (admin_code === ADMIN_CODE) {
      // Generate a simple session token (in production, use JWT or proper session management)
      const sessionToken = Buffer.from(`${admin_code}_${Date.now()}`).toString('base64');

      return NextResponse.json(
        {
          success: true,
          message: 'Admin authentication successful',
          token: sessionToken
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid admin code' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
