# AI Agent Handoff: A Thousand Lamps

> Workspace root: `A_THOUSAND_LAMPS/`
> Last updated: 2026-03-03 — Claude (Session 001)

---

## What You're Building

"A Thousand Lamps" — project concept TBD by the user. The infrastructure scaffold is complete; domain work has not started.

**Important constraints:**
- Stack is locked: Docker + Docker Compose, Next.js, Node.js API on Render.com, MongoDB, GitHub Actions, Vercel.
- All secrets via environment variables. Never hard-code credentials.
- Follow patterns in `AI/AI_RULES.md`.

---

## What's Already Done

### Infrastructure Scaffold (Session 001 — Claude)
- `git init` — local repository initialized.
- `.gitignore`, `.dockerignore`, `.env.example` — all created.
- `docker-compose.yml` — three-service setup: `atl_app`, `atl_api`, `atl_mongo`.
- `.github/workflows/ci.yml` — full CI/CD pipeline (lint → Docker build → Vercel preview → Render production).
- `vercel.json` — Vercel project config.
- `README.md` — project overview and dev instructions.
- `AI/` folder — all subdirectories and management files confirmed present.

### Not Yet Done
- `./app/` (Next.js source) — not scaffolded.
- `./api/` (Node API source) — not scaffolded.
- `app/Dockerfile` and `api/Dockerfile` — not created.
- GitHub remote not set; no commits pushed.
- Render.com service not created; deploy hook not set.
- Vercel project not linked; secrets not added to GitHub.

---

## Current Task Status

- [x] Git initialization
- [x] Project scaffold files (gitignore, dockerignore, env.example, docker-compose, CI, README)
- [ ] GitHub repo creation & first push
- [ ] Next.js app scaffold (`./app`)
- [ ] Node API scaffold (`./api`)
- [ ] Render.com service creation
- [ ] Vercel project link

---

## Files to Work With Next

- `docker-compose.yml` — add volume mounts / dev overrides once `./app` and `./api` exist.
- `.env.example` — update as new services and variables are added.
- `AI/STATE.md` — keep updated after every session.

---

## Git / Commits

- Branch: `main` (local only — no remote yet)
- First commit not yet made.

---

## Validation Before Handing Off

1. Confirm `docker compose config` passes once `./app` and `./api` directories exist.
2. Confirm GitHub Actions `ci.yml` triggers on first push to `main`.
3. Confirm Vercel preview deploy on first PR.
