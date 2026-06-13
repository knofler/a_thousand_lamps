# Claude Agent Log

---

## 2026-06-13 — Session 004 (headless, security-specialist fleet task)

**Task:** [task-b83cff0b] Harden admin auth — timing-safe token check, fail-closed, rate limiting.
**Commit:** dc8c7d2 on `test` (pushed).

- Replaced plain `===` admin token comparison with `crypto.timingSafeEqual` over SHA-256 digests (lib/auth.ts); auth fails closed when ADMIN_SECRET_TOKEN unset/empty.
- New `lib/rate-limit.ts` in-memory fixed-window limiter; POST /api/auth limited to 10 attempts/IP/15 min with 429 + Retry-After.
- Documented token generation + production rotation in README ("Admin token") and .env.example.
- Excluded `AI/` from tsconfig — pre-existing build break (template files import uninstalled packages), confirmed on baseline before change.
- Verified in Docker (node:22-alpine): tsc clean, next lint clean, next build green, 14/14 smoke assertions (timing-safe compare, fail-closed, bearer parsing, rate-limit window).
- OUTSTANDING (manual): production still runs weak token dev_secret_123 — rotate per README, then redeploy.
