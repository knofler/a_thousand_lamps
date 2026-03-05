# AI Agent Handoff: A Thousand Lamps

> **Workspace root:** `/Users/rumman.ahmed/Dropbox/Dev/PROJECT/CODE/_MY_PROJECT/A_THOUSAND_LAMPS/`
> **Last updated:** 2026-03-03 — Claude Session 003
> **Handed off to:** Next agent

---

## What This Project Is

"A Thousand Lamps" — Bangladesh-based charity website.
- Public side: doom-scrolling social feed (Facebook embeds + photo posts), charity program pages, donate CTA
- Admin side: token-protected panel to upload photos, add embeds, manage/publish posts
- Stack: Next.js 14 App Router · MongoDB Atlas · Tailwind CSS · Docker · Vercel

**Live URL:** https://a-thousand-lamps.vercel.app
**GitHub:** https://github.com/knofler/a_thousand_lamps (branch: `main`)
**Local dev:** `docker-compose up --build` → http://localhost:3300
**Admin (local):** http://localhost:3300/admin → token: `dev_secret_123`

---

## CRITICAL WORKFLOW RULE

**NO local npm/node ever.** All dev runs via Docker:
```bash
docker-compose up --build        # start dev
docker-compose down              # stop
docker-compose exec app npx tsx scripts/seed.ts   # run scripts
```
Never run `npm install`, `npm run dev`, etc. directly on the host.

---

## Immediate Tasks (pick up from here)

### 1. Verify Atlas connection is live ← DO THIS FIRST
```bash
curl https://a-thousand-lamps.vercel.app/api/posts?limit=1
```
- **Expected:** `{"posts":[...],"pagination":{"total":14,...}}`
- **If still error:** Go to cloud.mongodb.com → Network Access → confirm `0.0.0.0/0` entry is ACTIVE (not pending). It can take 1–2 min to activate.

### 2. Set Facebook App ID (fixes blank embed boxes on Vercel)
1. Go to https://developers.facebook.com → My Apps → Create App → Consumer type
2. App name: `A Thousand Lamps`
3. Settings > Basic → copy **App ID**
4. App Domains: add `a-thousand-lamps.vercel.app`
5. Run:
```bash
echo "YOUR_APP_ID" | vercel env add NEXT_PUBLIC_FACEBOOK_APP_ID production
vercel --prod
```

### 3. Set Cloudinary credentials (enables photo upload in admin)
Get keys from cloudinary.com → Dashboard → API Keys
```bash
echo "cloud_name" | vercel env add CLOUDINARY_CLOUD_NAME production
echo "api_key"    | vercel env add CLOUDINARY_API_KEY production
echo "api_secret" | vercel env add CLOUDINARY_API_SECRET production
vercel --prod
```
Also update `.env.local` with real values for local testing.

### 4. Harden admin token
```bash
vercel env rm ADMIN_SECRET_TOKEN production
echo "STRONG_RANDOM_SECRET" | vercel env add ADMIN_SECRET_TOKEN production
vercel --prod
```

### 5. Custom domain
Vercel dashboard → a-thousand-lamps project → Domains → Add → `athousandlamps.org`
Then update DNS at your registrar (Vercel will show the records needed).
After domain active: update `NEXT_PUBLIC_SITE_URL` in Vercel to `https://athousandlamps.org`.

### 6. CI/CD GitHub Actions
`.github/workflows/ci.yml` exists but secrets are not set. Add to GitHub repo settings:
- `VERCEL_TOKEN` — from vercel.com/account/tokens
- `VERCEL_ORG_ID` — from `.vercel/project.json` (`orgId`)
- `VERCEL_PROJECT_ID` — from `.vercel/project.json` (`projectId`)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/(public)/page.tsx` | Home page — server component, fetches initial posts from Atlas |
| `app/(admin)/admin/page.tsx` | Admin login + dashboard |
| `components/feed/EmbedPost.tsx` | FB/IG embed renderer, `fbAsyncInit` race condition fix |
| `components/feed/FeedContainer.tsx` | Infinite scroll, client-side |
| `lib/mongodb.ts` | Mongoose singleton — URI check is inside `connectDB()`, not module level |
| `lib/models/Post.ts` | Post schema: photo, embed, story, program types |
| `lib/auth.ts` | `isAdminAuthorized(request)` — checks Bearer token |
| `scripts/seed.ts` | Seeds 14 Facebook posts into MongoDB (idempotent) |
| `app/globals.css` | CSS custom property theme tokens + `.link-muted` utility |
| `components/ui/ThemeToggle.tsx` | Dark/light toggle, localStorage backed |
| `.vercel/project.json` | Vercel project IDs (orgId + projectId) |

---

## Environment Variables

| Variable | Local (.env.local) | Vercel (production) | Status |
|----------|--------------------|---------------------|--------|
| `MONGODB_URI` | `mongodb://mongo:27017/athousandlamps` | Atlas URI ✅ set | Live |
| `ADMIN_SECRET_TOKEN` | `dev_secret_123` | set in Vercel ⚠️ harden before launch | Needs strong value |
| `CLOUDINARY_CLOUD_NAME` | placeholder | ❌ not set | Blocks photo upload |
| `CLOUDINARY_API_KEY` | placeholder | ❌ not set | Blocks photo upload |
| `CLOUDINARY_API_SECRET` | placeholder | ❌ not set | Blocks photo upload |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | (not needed locally) | ❌ not set | Blocks FB embeds on Vercel |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | not set | Set when domain is live |

---

## MongoDB Atlas

- **Cluster:** `cluster0.shlzrko.mongodb.net`
- **Database:** `athousandlamps`
- **User:** `ahmedrumman_db_user` — password in Vercel env / `.env.local` only (never commit)
- **Collection:** `posts` — 14 Facebook embed documents seeded
- **Network Access:** Must have `0.0.0.0/0` active for Vercel serverless IPs

Seed against Atlas (get URI from `.env.local` or Vercel dashboard):
```bash
MONGODB_URI="<get from .env.local>" \
  docker-compose exec -e MONGODB_URI="$MONGODB_URI" app npx tsx scripts/seed.ts
```

---

## Known Bugs / Tech Debt

1. **`PostEditor` component not built** — plan section 2 lists it under `components/admin/`, not yet created. Currently posts can only be toggled published/unpublished or deleted, not edited inline.
2. **Like counter is client-only** — `likes` field exists in schema but the increment is not persisted to DB. Needs a `PUT /api/posts/:id` call on like click.
3. **No pagination on admin posts page** — loads all posts at once (fine for MVP, should add lazy load when >100 posts).
4. **Instagram embeds untested** — only Facebook posts are seeded. Instagram `blockquote` rendering not visually verified.
5. **`NEXT_PUBLIC_FACEBOOK_APP_ID` missing** — code is in place (`app/layout.tsx` uses it in SDK URL), just needs the value.

---

## Git State

```
Branch: main
Remote: git@github.com:knofler/a_thousand_lamps.git
Last commit: fix mongo port + state/handoff update
Commits: 5 total
```

All source is committed and pushed. `.env.local` and `.vercel/` are gitignored.
