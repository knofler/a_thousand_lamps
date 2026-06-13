/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * State lives in module scope, so limits apply per server instance — on
 * Vercel that means per serverless instance, which still blunts brute-force
 * attempts from a single source. Move to a shared store (Upstash Redis)
 * if instance-level limiting ever proves insufficient.
 */

type AttemptWindow = { count: number; resetAt: number };

const windows = new Map<string, AttemptWindow>();

function prune(now: number) {
  windows.forEach((win, key) => {
    if (win.resetAt <= now) windows.delete(key);
  });
}

export function rateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (windows.size > 1000) prune(now);

  const win = windows.get(key);
  if (!win || win.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  win.count += 1;
  if (win.count > maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
  // Vercel/proxies set x-forwarded-for; first hop is the client.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
