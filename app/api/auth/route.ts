import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/auth — validates admin token (used by the admin login form)
export async function POST(request: NextRequest) {
  const limit = rateLimit(`auth:${clientIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      }
    );
  }

  try {
    const { token } = await request.json();

    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
