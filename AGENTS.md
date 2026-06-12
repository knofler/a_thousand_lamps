# A_THOUSAND_LAMPS — AGENTS.md

> Cross-tool standard. Read by Codex, Antigravity, Cursor and other AGENTS.md-aware tools.

## YOUR IDENTITY — read first (this file is shared; do NOT impersonate Claude)

This file is read by **multiple tools**. Identify as **whichever tool you are** — Codex, Antigravity, Cursor, etc. — **never as Claude**.

- Use **your own** name and color in every banner/status line/log. Color table: Codex 🟢 · Antigravity 🟠 · Cursor 🟡 · Gemini 🔵 · (other) ⚪. Claude's is 🟣 — not yours.
- Write logs to **your own** file under `AI/logs/` (e.g. `AI/logs/codex.md`, `AI/logs/antigravity.md`) — never `AI/logs/claude_log.md`.
- **Never print the `claude-museum` / "Powerhouse Museum" org label** — it comes from Claude's `CLAUDE_CONFIG_DIR` and is Claude-specific. Omit the ORG line, or use your own tool name.

## Wrap-up banner (MANDATORY on session close)

On `wrap up`, end with a banner headed **"<YOUR NAME> — WRAPPED UP"** using YOUR color dot, with `AGENT:` and `SESSION:` set to your name, and `REPO/BRANCH/REMOTE/WRAPPED` from git. Never copy Claude's banner (name, org, or 🟣 color) verbatim.

## On Session Start

1. Read `AI/state/STATE.md` and `AI/state/AI_AGENT_HANDOFF.md` for current context
2. Read `AI/documentation/AI_RULES.md` for tech mandates
3. Review `AI/documentation/MULTI_AGENT_ROUTING.md` for routing reference

## Specialist Agents (13)

Agent role definitions are in `AI/agents/`. Adopt the relevant specialist role based on the task.

| Agent | Domain |
|-------|--------|
| `solution-architect` | ADRs, system design, tech choices |
| `frontend-specialist` | Next.js, React, Vercel |
| `api-specialist` | Node.js/Python APIs, REST/GraphQL, Render |
| `database-specialist` | MongoDB, Mongoose, Atlas |
| `devops-specialist` | Docker, GitHub Actions, CI/CD |
| `ui-ux-specialist` | Design system, Tailwind, accessibility |
| `security-specialist` | OWASP, auth, secrets, rate limiting |
| `documentation-specialist` | README, API docs, changelogs |
| `product-manager` | Feature specs, user stories, roadmap |
| `qa-specialist` | Testing strategy, unit/integration/E2E |
| `tech-ba` | Requirements, data flows, functional specs |
| `tech-lead` | Code review, standards, cross-lane coherence |
| `project-manager` | Delivery, milestones, blockers, STATE.md |

## Quick Keywords

| Keyword | Action |
|---------|--------|
| `hello` | Show all available keywords as a table |
| `agent mode` | Full multi-agent activation — read state, dispatch all lanes in parallel |
| `session start` | Read state, assess status, identify next priority |
| `status` | Quick summary: done, in-progress, blocked, next priority |
| `plan [feature]` | Break down a feature into specs, stories, and ADR before coding |
| `scaffold [thing]` | Generate boilerplate: scaffold api, scaffold page [name], scaffold schema [name] |
| `review` | Code review (tech-lead) + test coverage check (qa-specialist) |
| `audit` | Security (OWASP) + coverage + standards — all in parallel |
| `ship it` | Commit, push, update state, write handoff, log |
| `wrap up` | Update state + write handoff. No commit. |
| `handoff` | Full handoff: update STATE.md + AI_AGENT_HANDOFF.md for next agent |
| `make prod` | Productionise: Vercel + Atlas + Render deploy |

## State Management

After every significant change, autonomously update `AI/state/STATE.md` with what was done, decisions made, blockers, and next steps. On session end, also update `AI/state/AI_AGENT_HANDOFF.md` with instructions for the next agent.

**NEVER wait for the user to ask you to save state.**

## Critical Rules

- **Docker only**: No local npm/node. Use `docker compose exec` for builds/linting.
- **Pipeline relay design**: Each pipeline stage only needs its predecessor's output. Never concatenate all prior stages.
- **60-second timeout**: Pipeline stages must complete within 1 minute.
- **File ownership**: Follow lane ownership from `AI/documentation/MULTI_AGENT_ROUTING.md`.
- **Multi-agent protocol**: You share state with other AI agents via the file system. `AI/state/` is the single source of truth.

---

## Agent Definitions

See `AI/agents/` for the 13 specialist role definitions.

## Skills

See `AI/skills/README.md` for 60 repeatable playbooks across all specialists.
