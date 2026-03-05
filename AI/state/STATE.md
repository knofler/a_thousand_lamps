# Project State: A Thousand Lamps

**Timestamp:** 2026-03-03 — Session 003
**Current Agent:** Claude (Sonnet 4.6)

---

## 1. What Has Been Built (Complete)

### Infrastructure
- `Dockerfile` — 3-stage multi-stage build (deps → builder → runner, node:20-alpine, standalone output)
- `docker-compose.yml` — dev: `atl_app` (3300:3000) + `atl_mongo` (27090:27017), volume mounts for hot reload
- `docker-compose.prod.yml` — production image + .env.production (no local mongo)
- `next.config.mjs` — `output: 'standalone'`, Cloudinary + fbcdn image domains
- `vercel.json` — region: sin1, build/dev commands
- `.env.example` — all env vars documented (including `NEXT_PUBLIC_FACEBOOK_APP_ID`)
- `.env.local` — local dev values (never committed)
- `scripts/seed.ts` — seeds 14 Facebook posts, idempotent

### Data Layer
- `lib/mongodb.ts` — singleton Mongoose connection, global cache for HMR, check inside `connectDB()` (not module-level — fixes Vercel build crash)
- `lib/models/Post.ts` — full schema, compound index on `isPublished + order + createdAt`
- `lib/models/Program.ts`
- `lib/auth.ts` — Bearer token admin auth
- `lib/utils.ts` — `relativeTime`, `detectEmbedType`, `tagColor`

### API Routes (all working locally)
- `GET/POST /api/posts` — paginated (page, limit, type, tag filters)
- `GET/PUT/DELETE /api/posts/[id]`
- `POST /api/embeds` — auto-detects facebook/instagram
- `POST /api/upload` — multipart → Cloudinary
- `POST /api/auth` — token validation

### Design System
- Dark theme default, light toggle via CSS custom properties (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`)
- Amber (#F59E0B dark / #D97706 light) as accent — warm, not culturally specific
- `components/ui/ThemeToggle.tsx` — localStorage-backed, no-flash inline script in layout
- `.link-muted` CSS utility in globals.css — hover color change without JS (Server Component safe)

### Components
- `components/ui/` — NavBar (ThemeToggle, hamburger), Footer, CelebrateButton, DonationModal
- `components/feed/` — FeedContainer (Intersection Observer infinite scroll), PostCard, PhotoPost, EmbedPost, StoryPost
- `components/sections/` — HeroSection, ProgramCard, ComicStory, TransparencySection
- `components/admin/` — AdminNav, EmbedForm, ImageUploader

### Pages
- All public pages: `/`, `/about`, `/programs`, `/celebrate`, `/story`, `/transparency`
- All admin pages: `/admin` (login + dashboard), `/admin/upload`, `/admin/embeds`, `/admin/posts`

### Deployment
- **GitHub:** `git@github.com:knofler/a_thousand_lamps.git` — branch `main`, 4 commits pushed
- **Vercel:** Project `a-thousand-lamps` under `knoflers-projects`
  - URL: `https://a-thousand-lamps.vercel.app`
  - Env vars set: `MONGODB_URI`, `ADMIN_SECRET_TOKEN`
- **MongoDB Atlas:** Cluster `cluster0.shlzrko.mongodb.net`, DB `athousandlamps`
  - User: `ahmedrumman_db_user`
  - 14 Facebook posts seeded via Atlas URI

---

## 2. Architectural Decisions

- **Monolithic Next.js** — API routes in same app as frontend, single container + MongoDB
- **No local npm** — CRITICAL: all dev runs via `docker-compose up --build`. Never run npm locally
- **Admin auth** — sessionStorage token, `Authorization: Bearer`. No NextAuth for MVP
- **FB/IG embeds** — SDKs loaded globally in `app/layout.tsx` via `next/script strategy="lazyOnload"`. `EmbedPost` uses `fbAsyncInit` fallback to handle race condition between React hydration and SDK load
- **Infinite scroll** — `react-intersection-observer` sentinel pattern in `FeedContainer`
- **Standalone Next.js output** — required for Docker multi-stage `server.js` runner

---

## 3. Current Blockers

### CRITICAL — Vercel: Facebook embeds not loading
- **Root cause A (confirmed):** Atlas IP whitelist was blocking Vercel. User added `0.0.0.0/0` in Atlas Network Access. **Needs verification** — API was still returning 500 at end of session.
- **Root cause B (pending):** Facebook SDK requires a valid `NEXT_PUBLIC_FACEBOOK_APP_ID` env var. Without it `fb-post` embeds render as blank boxes in some configurations. Code is ready — just needs the App ID set in Vercel.
  - Steps: developers.facebook.com → Create App (Consumer) → Settings > Basic → copy App ID → `vercel env add NEXT_PUBLIC_FACEBOOK_APP_ID production` → `vercel --prod`

### Atlas Connection — Verify after handoff
```bash
curl https://a-thousand-lamps.vercel.app/api/posts?limit=1
# Should return {"posts":[...],"pagination":{...}}
# If still {"error":"Internal server error"} → Atlas whitelist not active yet
```

### Cloudinary — Not configured
- Image uploads will return 500 until Cloudinary keys are added
- `.env.local` has placeholders; Vercel has no Cloudinary env vars set
- Add to Vercel: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Admin token — Weak
- `ADMIN_SECRET_TOKEN=dev_secret_123` in production. Should be changed before public launch

---

## 4. Plan Progress

| # | Task | Status |
|---|------|--------|
| 1 | Project scaffold + Git init | ✅ Done |
| 2 | Full Next.js app build | ✅ Done |
| 3 | Docker dev environment running | ✅ Done |
| 4 | Dark/light theme system | ✅ Done |
| 5 | GitHub repo pushed | ✅ Done |
| 6 | Vercel deployment (build passing) | ✅ Done |
| 7 | MongoDB Atlas connected | ✅ Done (IP whitelist issue pending verification) |
| 8 | Atlas seeded with 14 posts | ✅ Done |
| 9 | Facebook embeds loading on Vercel | ⚠️ Blocked (see above) |
| 10 | Cloudinary image upload working | ❌ Not started |
| 11 | Facebook App ID configured | ❌ Not started |
| 12 | Custom domain (athousandlamps.org) | ❌ Not started |
| 13 | CI/CD GitHub Actions pipeline | ❌ Not configured (secrets missing) |
| 14 | ADMIN_SECRET_TOKEN hardened | ❌ Still dev_secret_123 |
| 15 | PostEditor component | ❌ Not built (planned in section 2) |

---

## 5. Immediate Next Steps (in order)

1. **Verify Atlas whitelist** — `curl https://a-thousand-lamps.vercel.app/api/posts?limit=1`
2. **Facebook App ID** — get from developers.facebook.com, set in Vercel, redeploy
3. **Cloudinary** — get credentials, set in both `.env.local` and Vercel, test photo upload
4. **Harden admin token** — `vercel env rm ADMIN_SECRET_TOKEN production` → set strong value
5. **Custom domain** — set in Vercel dashboard → add DNS records
6. **CI/CD** — set GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
