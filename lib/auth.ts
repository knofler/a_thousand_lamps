/**
 * Simple single-token admin auth.
 * Sufficient for a single-maintainer MVP — no session management needed.
 * Upgrade to NextAuth if multi-user admin is required in the future.
 */
export function isAdminAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env.ADMIN_SECRET_TOKEN;
}
