import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth — validates admin token (used by the admin login form)
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const valid = token === process.env.ADMIN_SECRET_TOKEN;

    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
