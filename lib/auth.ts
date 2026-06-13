import { createHash, timingSafeEqual } from 'crypto';

/**
 * Simple single-token admin auth.
 * Sufficient for a single-maintainer MVP — no session management needed.
 * Upgrade to NextAuth if multi-user admin is required in the future.
 *
 * Token rotation (production): generate a new token with
 * `openssl rand -hex 32`, update ADMIN_SECRET_TOKEN in Vercel
 * (Settings → Environment Variables) and any local .env, then redeploy.
 * See README "Admin token" section.
 */

// Hash both sides to a fixed length so timingSafeEqual never throws on
// length mismatch and comparison time is independent of the input.
function timingSafeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function verifyAdminToken(token: unknown): boolean {
  const secret = process.env.ADMIN_SECRET_TOKEN;
  // Fail closed: no configured secret means no admin access, ever.
  if (!secret || typeof token !== 'string' || token.length === 0) return false;
  return timingSafeCompare(token, secret);
}

export function isAdminAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice('Bearer '.length).trim();
  return verifyAdminToken(token);
}
