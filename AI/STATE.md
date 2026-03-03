# Project State: A Thousand Lamps

**Timestamp:** 2026-03-03 — Session 002
**Current Agent:** Claude

---

## 1. Recently Implemented

Full application scaffold built from the user-provided build plan. All source files created — ready for `docker-compose up --build`.

### Infrastructure
- `package.json` (name: `a-thousand-lamps`, all deps listed)
- `tsconfig.json`, `next.config.ts` (output: standalone for Docker)
- `tailwind.config.ts` (lamp color palette: gold, green, cream, dark)
- `postcss.config.mjs`, `.eslintrc.json`
- `Dockerfile` (3-stage: deps → builder → runner, node:20-alpine)
- `docker-compose.yml` (dev: app + mongo with healthcheck, volume mounts for hot reload)
- `docker-compose.prod.yml` (uses pre-built image + .env.production, no mongo — Atlas used)
- `vercel.json` (region: sin1)
- `.env.example`, `.env.local` (local dev values)
- `scripts/seed.ts` (seeds 14 Facebook posts, idempotent)
- `AI/plan/20260303_full_build_plan.md` (full build plan saved)

### Data Layer
- `lib/mongodb.ts` — singleton Mongoose connection with global cache
- `lib/models/Post.ts` — full schema with index on `isPublished + order + createdAt`
- `lib/models/Program.ts` — program model
- `lib/auth.ts` — Bearer token admin auth helper
- `lib/utils.ts` — relativeTime, detectEmbedType, tagColor

### API Routes
- `app/api/posts/route.ts` — GET (paginated, filterable) + POST (admin)
- `app/api/posts/[id]/route.ts` — GET, PUT, DELETE (admin)
- `app/api/embeds/route.ts` — POST (auto-detects fb/instagram, admin)
- `app/api/upload/route.ts` — POST multipart → Cloudinary (admin)
- `app/api/auth/route.ts` — POST token validation

### Components
- `components/ui/` — NavBar, Footer, CelebrateButton, DonationModal
- `components/feed/` — FeedContainer (Intersection Observer infinite scroll), PostCard, PhotoPost, EmbedPost (FB + IG SDK), StoryPost
- `components/sections/` — HeroSection, ProgramCard, ComicStory, TransparencySection
- `components/admin/` — AdminNav, EmbedForm, ImageUploader

### Pages
- `app/(public)/layout.tsx` — NavBar + Footer wrapper
- `app/(public)/page.tsx` — Home: Hero → Programs strip → Feed → ComicStory → Transparency
- `app/(public)/about/page.tsx`
- `app/(public)/programs/page.tsx`
- `app/(public)/celebrate/page.tsx` — Donation tiers + payment methods
- `app/(public)/story/page.tsx`
- `app/(public)/transparency/page.tsx`
- `app/(admin)/layout.tsx` — AdminNav sidebar
- `app/(admin)/admin/page.tsx` — Login + Dashboard
- `app/(admin)/admin/upload/page.tsx`
- `app/(admin)/admin/embeds/page.tsx`
- `app/(admin)/admin/posts/page.tsx` — Publish toggle + delete

---

## 2. Architectural Decisions

- **Monolithic Next.js** — API routes live in the same app as the frontend. No separate API service (plan section 5 confirmed this). Simplifies Docker to a single container + MongoDB.
- **No local npm** — user confirmed all dev runs via Docker. `npm install` happens inside the container at build time.
- **Admin auth** — sessionStorage token, sent as `Authorization: Bearer`. No NextAuth for MVP.
- **FB/IG embeds** — SDKs loaded globally in `app/layout.tsx`. `EmbedPost` calls `window.FB?.XFBML?.parse()` and `window.instgrm?.Embeds?.process()` after mount.
- **Infinite scroll** — `react-intersection-observer` sentinel pattern in `FeedContainer`.
- **Standalone Next.js output** — required for Docker multi-stage `server.js` runner.

---

## 3. Blockers / Bugs

- **Docker build not yet run** — all files written; first `docker-compose up --build` may surface TypeScript or missing dependency issues.
- **GitHub remote not set** — no remote, no CI triggered yet.
- **Cloudinary not configured** — `.env.local` has placeholder values; image upload won't work until real keys are set.
- **MongoDB Atlas not set up** — production env var needs real Atlas URI for Vercel deploy.
- **`app/layout.tsx` script tags** — React server components don't support `<script>` directly in `<head>` in all Next.js 14 versions; may need to move to `next/script` with `strategy="lazyOnload"`.

---

## 4. Immediate Next Steps

- [ ] Run `docker-compose up --build` and fix any build-time TypeScript/import errors.
- [ ] Fix FB/IG SDK script loading — replace raw `<script>` with `next/script` in `layout.tsx`.
- [ ] Seed the database: `docker-compose exec app npx tsx scripts/seed.ts`
- [ ] Add Cloudinary credentials to `.env.local` and test image upload.
- [ ] Create GitHub repo, push, set secrets for CI.
- [ ] Create MongoDB Atlas cluster and update MONGODB_URI for production.
- [ ] Connect repo to Vercel and deploy.
