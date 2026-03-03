# Claude Agent Log

---

### 2026-03-03 — Session 001

**Task:** Initialize AI Management Folder and project scaffold per `global_ai_management_prompt.md`.

**Actions taken:**
1. Read `global_ai_management_prompt.md`, `AI_RULES.md`, `AI_AGENT_HANDOFF.md`, `STATE.md`, `Instruction.md` to establish current context.
2. Confirmed AI folder structure is complete: `AI/`, `AI/plan/`, `AI/design/`, `AI/architecture/`, `AI/documentation/`.
3. Ran `git init` — local repository initialized at project root.
4. Created `.gitignore` (Next.js + Node + Docker + OS/IDE artifacts).
5. Created `.dockerignore` (excludes git, node_modules, .env, AI/ from images).
6. Created `.env.example` (all required env vars documented with safe placeholders).
7. Created `docker-compose.yml` (three services: `atl_app`, `atl_api`, `atl_mongo`).
8. Created `.github/workflows/ci.yml` (lint/test → Docker build → Vercel preview → Render production).
9. Created `vercel.json` (Vercel project config pointing at `./app`).
10. Created `README.md` (project overview, stack table, dev instructions, structure map).
11. Rewrote `AI/STATE.md` for this project (removed master template content).
12. Rewrote `AI/AI_AGENT_HANDOFF.md` for this project.

**Outcome:** Project root is fully scaffolded per mandated tech stack. No remote set yet. Next step: scaffold `./app` and `./api`, then push to GitHub.

---

### 2026-03-03 — Session 002

**Task:** Full application build from user-provided build plan.

**Actions taken:**
1. Saved build plan to `AI/plan/20260303_full_build_plan.md`.
2. Scaffolded Next.js manually (create-next-app rejected uppercase dir name). Created: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`.
3. Created `app/globals.css` (Tailwind directives + Google Fonts import + utility classes).
4. Created `app/layout.tsx` — root layout with `next/script` lazy-loading for FB and Instagram SDKs.
5. Created `lib/mongodb.ts`, `lib/auth.ts`, `lib/utils.ts`.
6. Created `lib/models/Post.ts` (full schema + compound index), `lib/models/Program.ts`.
7. Created all 5 API routes: posts (GET/POST), posts/[id] (GET/PUT/DELETE), embeds, upload, auth.
8. Created all UI components: NavBar, Footer, CelebrateButton, DonationModal.
9. Created all feed components: FeedContainer (Intersection Observer), PostCard, PhotoPost, EmbedPost, StoryPost.
10. Created all section components: HeroSection, ProgramCard, ComicStory, TransparencySection.
11. Created all admin components: AdminNav, EmbedForm, ImageUploader.
12. Created all public pages: Home (server component with initial posts), About, Programs, Celebrate, Story, Transparency.
13. Created all admin pages: Dashboard (with login), Upload, Embeds, Posts Manager.
14. Created Dockerfile (3-stage multi-stage build), docker-compose.yml (dev, with healthcheck), docker-compose.prod.yml.
15. Updated vercel.json (region: sin1), .env.example, .env.local, scripts/seed.ts.
16. Updated AI/STATE.md and AI/AI_AGENT_HANDOFF.md.

**Key decision:** User confirmed no local npm — all runs via Docker. `npm install` happens inside container.

**Outcome:** All source files written. Ready for `docker-compose up --build`. See STATE.md for known issues and next steps.

---

### 2026-03-03 — Session 003

**Task:** Fix runtime errors, deploy to Vercel, seed Atlas, save state and prepare handoff.

**Actions taken:**
1. Fixed `Footer.tsx` — Server Component with `onMouseEnter`/`onMouseLeave` (illegal). Replaced with `.link-muted` CSS utility. Same applied to `NavBar.tsx`.
2. Fixed ESLint `react/no-unescaped-entities` — `'` → `&apos;` in `FeedContainer.tsx` and `HeroSection.tsx`.
3. Fixed `lib/mongodb.ts` — moved `MONGODB_URI` guard inside `connectDB()` (module-level throw crashed Next.js build-time page data collection).
4. Fixed `EmbedPost.tsx` — added `fbAsyncInit` fallback for SDK/React race condition. Fixed stale `text-lamp-dark` class.
5. Changed docker-compose.yml local MongoDB host port: `27017` → `27090`.
6. Linked project to Vercel: `vercel link --yes --project a-thousand-lamps`.
7. Set Vercel env vars: `MONGODB_URI` (Atlas), `ADMIN_SECRET_TOKEN`.
8. Deployed to Vercel — build passing, app live.
9. Diagnosed Vercel 500: Atlas IP whitelist blocking serverless IPs. Instructed user to add `0.0.0.0/0`.
10. Seeded Atlas: 14 Facebook posts via Docker exec with Atlas URI override.
11. Added `NEXT_PUBLIC_FACEBOOK_APP_ID` support to SDK URL in `app/layout.tsx`.
12. Fully updated: `AI/STATE.md`, `AI/AI_AGENT_HANDOFF.md`, `AI/plan/20260303_full_build_plan.md`, `AI/claude.md`, `memory/MEMORY.md`.

**Outcome:** App live at https://a-thousand-lamps.vercel.app. Atlas seeded. Blocking: Atlas IP whitelist verification, FB App ID, Cloudinary. See STATE.md section 5 for ordered next steps.
