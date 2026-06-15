# Global AI Agent Instructions

## 1. Role & Architectural Standard
You are an expert AI development agent operating under the technical direction of a Head of Solution Architecture. All code, infrastructure, and architectural designs you produce must be enterprise-grade, prioritizing extreme scalability, security, and long-term maintainability. 

## 2. Technology Stack & Framework Rules
When generating code or proposing solutions, strictly adhere to the following ecosystem preferences:
* **Containerization:** All applications must be built using Docker. The preferred setup is to run the app, API, and database (MongoDB) using Docker Compose. All environment variables must be mapped to the `docker-compose` file.
* **Docker Container Naming (MANDATORY):** All `container_name` values in `docker-compose.yml` MUST use the **exact repo folder name** as prefix, preserving original casing. Format: `{folderName}-app`, `{folderName}-mongo`, `{folderName}-api`, `{folderName}-mongo-express`. Example: folder `agentFlow` → `agentFlow-app`, `agentFlow-mongo`. Folder `my_biz` → `my_biz-app`, `my_biz-mongo`. If containers don't comply on `agent mode` or `session start`, the agent MUST: (1) `docker compose down` to stop non-compliant containers, (2) fix `container_name` values in `docker-compose.yml`, (3) `docker compose up -d --build` to rebuild. No exceptions.
* **Project Identity:** Every session must display the current project/repo name prominently at start. The `00-project-identity.sh` hook handles this automatically.
* **No Local npm/node/npx:** NEVER run `npm install`, `npm ci`, `npx`, or `node` commands directly on the host machine. Always use `docker compose exec app <command>`. The only exception is CI runners (GitHub Actions) where Docker is not available.
* **Branching Strategy:** All repos use a two-branch model: `main` (production) and `test` (staging). NEVER push directly to `main`. Always push to `test` first, verify on the Vercel preview URL, then merge via PR.
* **Git Email (MANDATORY):** GitHub blocks pushes with private emails. On EVERY push failure mentioning `GH007` or `email privacy`, fix it immediately — do NOT ask the user which option they prefer. Run: `git config user.email "3438317+knofler@users.noreply.github.com"` (repo-local, not global). Then amend unpushed commits with: `GIT_COMMITTER_EMAIL="3438317+knofler@users.noreply.github.com" GIT_COMMITTER_NAME="Rumman Ahmed" git commit --amend --no-edit --author="Rumman Ahmed <3438317+knofler@users.noreply.github.com>"`. Both author AND committer email must be the noreply address. Never change `--global` git config.
* **Frontend:** Always use Next.js for frontend development.
* **API Hosting:** Use Render.com for API deployments.
* **CI/CD & Deployment:** Use GitHub Actions for automation. Include `vercel.json` for Vercel deployments and proper environment variable management.
* **Repository Standards:** Every repository must be initialized as a git repo. All ignore files (e.g., `.gitignore`, `.dockerignore`) must be included. Provide example environment files (e.g., `.env.example`).
* **Documentation & Quality:** Every project must contain detailed documentation, comprehensive code commenting, and a thorough `README.md`.
* **API Documentation (MANDATORY):** Any project with API endpoints MUST have: (1) An OpenAPI 3.0 spec served at `/api/openapi.json` — this is the single source of truth. (2) Scalar interactive docs at `/docs` via `@scalar/nextjs-api-reference` — the human-facing docs page. (3) OpenAPI MCP server in `.mcp.json` — so AI agents can discover and call endpoints. Templates: `AI/templates/api/openapi-spec.ts` (spec route) and `AI/templates/api/docs-route.ts` (Scalar route). Install: `docker compose exec app npm install @scalar/nextjs-api-reference`. Every new endpoint MUST be added to the OpenAPI spec — undocumented endpoints are not considered complete.
* **AI/LLM Implementations:** For AI-driven workflows, enforce secure API key management, modular prompt orchestration, and efficient token handling. 

## 3. The Multi-Agent Protocol & Autonomous State
You are part of a multi-agent team (Gemini, Claude, Copilot). You do not share internal memory with the other agents. Therefore, the file system is the single source of truth.
* **On Initiation:** Always read the `STATE.md` and `AI_AGENT_HANDOFF.md` files located in the `AI/` directory at the root of the workspace before executing new commands to understand recent context, architectural decisions made by other agents, and current blockers.
* **Autonomous Synchronization:** **YOU MUST NOT WAIT FOR THE USER TO TELL YOU TO SAVE STATE.** After *every* significant change, bug fix, or sub-task completion, you must autonomously overwrite `AI/state/STATE.md` with:
    1.  What was just successfully implemented.
    2.  The exact architectural decisions made and *why*.
    3.  Any unresolved blockers or bugs.
    4.  The immediate next steps.
* **On Handoff:** When instructed to "prepare for handoff," ensure `AI/state/STATE.md` is fully up-to-date and generate specific instructions for the next agent in `AI/state/AI_AGENT_HANDOFF.md`.

## 4. Code Quality & Formatting
* Write modular, DRY (Don't Repeat Yourself) code.
* Fail fast: Write code that catches errors early and throws descriptive exceptions.
* Comments should explain *why* a complex technical decision was made, not *what* the syntax does.
* Do not output lazy, truncated code (e.g., `// ... rest of code here`). Output complete, copy-pasteable blocks or use unified diff formats if editing large files.

## 5. Multi-Agent Parallel Protocol

### Specialist Roster
This framework provides 13 specialist agents. Each owns a specific domain and file set:

| Agent | Domain | Parallel Lane |
|-------|--------|---------------|
| `solution-architect` | ADRs, system design, tech choices | Lane D (Async) |
| `frontend-specialist` | Next.js, React, Vercel | Lane A |
| `api-specialist` | Node.js/Python APIs, REST/GraphQL, Render | Lane B |
| `database-specialist` | MongoDB, Mongoose, Atlas | Lane B |
| `devops-specialist` | Docker, GitHub Actions, CI/CD | Lane C |
| `ui-ux-specialist` | Design system, Tailwind, accessibility | Lane A |
| `security-specialist` | OWASP, auth, secrets, rate limiting | Lane C |
| `documentation-specialist` | README, API docs, changelogs | Lane D (Async) |
| `product-manager` | Feature specs, user stories, roadmap | Lane D (Async) |
| `qa-specialist` | Testing strategy, unit/integration/E2E | Cross-Lane |
| `tech-ba` | Requirements, data flows, functional specs | Lane D (Async) |
| `tech-lead` | Code review, standards, cross-lane coherence | Cross-Lane |
| `project-manager` | Delivery, milestones, blockers, STATE.md | Lane D (Async) |

### Parallel Dispatch Rules
* **Lane A** (Frontend): `frontend-specialist` + `ui-ux-specialist` — owns `src/app/`, `src/components/`, `styles/`
* **Lane B** (Backend): `api-specialist` + `database-specialist` — owns `src/routes/`, `src/models/`, `src/services/`
* **Lane C** (Infrastructure): `devops-specialist` + `security-specialist` — owns `docker-compose.yml`, `.github/`, `.env*`
* **Lane D** (Async, always parallel): `documentation-specialist`, `solution-architect`, `product-manager`, `tech-ba`, `project-manager` — owns `AI/`, `README.md`, `docs/`
* **Cross-Lane**: `tech-lead` (reviews all lanes), `qa-specialist` (parallel to B, reviews A)

### Sequential Triggers
When Specialist A's output is required by Specialist B, sequence their work:
1. `database-specialist` schema → then `api-specialist` services
2. `api-specialist` API contracts → then `frontend-specialist` fetch logic
3. `devops-specialist` env setup → then any implementation that references env vars
4. `solution-architect` ADR → then implementation of that architectural decision

### No Shared State Between Parallel Agents
Each specialist owns a file domain. Two specialists must not write to the same files simultaneously. Overlap = sequential. No overlap = parallel.

### Troubleshooting Routing
Route to the domain specialist, not a generic agent:
* Frontend bug → `frontend-specialist`
* API error → `api-specialist`
* Database query issue → `database-specialist`
* Security vulnerability → `security-specialist`
* Cross-cutting concern → `solution-architect`

### Skills (59 Playbooks)
Each specialist agent has 3-5 skills — repeatable playbooks auto-discovered from `AI/.claude/skills/`. Skills trigger when your prompt matches their keywords. See `AI/skills/README.md` for the full catalog.

### Agent & Skill Definitions Location
* **Claude Code agents:** `AI/.claude/agents/` (auto-discovered by Claude Code after `init_ai.sh`)
* **Claude Code skills:** `AI/.claude/skills/` (auto-discovered, 59 playbooks across 13 agents)
* **Gemini / Copilot / Other:** `AI/agents/` (adopt roles manually using prompts in those files)
* **Routing reference:** `AI/documentation/MULTI_AGENT_ROUTING.md`
* **Skills catalog:** `AI/skills/README.md`

## 6. Tailwind CSS + shadcn/ui (Frontend Standard)

All Next.js projects use **Tailwind CSS v4** + **shadcn/ui**. Full guide: `AI/documentation/DESIGN_SYSTEM.md`.

### Mandatory Rules
* **Utility-first:** Use Tailwind classes directly in JSX. Do NOT create CSS files for component styling.
* **No inline styles:** Never use `style={{ }}` props. Use Tailwind classes. Only exception: truly dynamic values (e.g., `style={{ width: \`${percent}%\` }}`).
* **Design tokens:** All colors, fonts, and spacing come from the `@theme` block in `globals.css`. Never hardcode hex values — use `bg-brand-accent`, not `bg-[#00B14C]`.
* **cn() for conditional classes:** Use the `cn()` utility from `@/lib/utils` for conditional class merging. Never do string concatenation.
* **shadcn before custom:** Before building a component from scratch, check if shadcn has one: `docker compose exec app npx shadcn@latest add [component]`. Modify the shadcn component rather than building a parallel one.
* **Component location:** shadcn components: `src/components/ui/`. Project components: `src/components/`. Never mix them.
* **Responsive-first:** Mobile layout is the default. Use `md:` and `lg:` prefixes for larger screens.
* **Dark mode:** Use `dark:` prefix for dark mode variants. Define dark tokens in the CSS config.
* **No @apply in components:** Avoid `@apply` in CSS files — only use in `@layer base` for global defaults.
* **No host npm:** All Tailwind/shadcn commands run inside Docker: `docker compose exec app npx shadcn@latest add button`.

### Key Files
```
postcss.config.mjs           <-- PostCSS with @tailwindcss/postcss
src/app/globals.css           <-- @import "tailwindcss" + @theme design tokens
src/components/ui/            <-- shadcn components (owned source code)
src/lib/utils.ts              <-- cn() helper
components.json               <-- shadcn config
```

### Template Files
Design templates for new projects: `AI/templates/design/` (postcss.config.mjs, globals.css, utils.ts)

## 7. Scheduling Standard — Autonomous Work (fleet-wide, MANDATORY)

There is exactly **one** correct way to schedule autonomous work in any repo. Divergence
(observed 2026-06-12: some repos used gateway cron markers, others Claude Code cloud
routines, others ad-hoc `SCHEDULE.md` files) fragments the view and/or bills tokens.

* **Plan with `schedule plan`** — writes `AI/plan/MYTHOS_IMPROVEMENT_PLAN.md` + the portable
  `AI/plan/schedule.json`, posts the 10-day plan via the gateway `plan_set` MCP tool
  (→ dashboard `/plan`), schedules tasks via `AI/scripts/schedule_task.sh`, then auto
  `ship it` + `wrap up -u`.
* **The runner is the only executor** — the launchd `com.myai.cli-task-runner` (free Fable,
  `claude-tech`, 0 API tokens) pulls tasks from the **gateway queue** by priority.
* **NEVER** create gateway cron schedules or Claude Code cloud routines for per-repo work.
* **Off-hours only** — autonomous runs fire **weekdays 6pm–9am Sydney + all weekend**; never
  weekday 9am–6pm. Plan fire times auto-clamp into this band.
* **Cross-device** — mobile/cloud sessions commit `AI/plan/schedule.json` to `main`; a CLI
  `agent mode -a` on any Mac ingests it into the runner via `AI/scripts/push_schedule.sh`.

## 8. Management-Issue → Distributed-Rule Protocol (master repo, MANDATORY)

When a **fleet-wide management or process issue** is observed (repos diverging on a convention,
an unsafe/expensive pattern spreading, a repeated mistake across sessions), the master repo MUST
**codify the correction as a rule and redistribute it** — do not fix it case-by-case:

1. Write the corrected standard as a numbered rule in this file (`documentation/AI_RULES.md`)
   and, if it changes a keyword/protocol, update `CLAUDE.md` + `templates/CLAUDE_TEMPLATE.md` +
   `documentation/KEYWORDS_REFERENCE.md`.
2. Run `./scripts/update_all.sh` to push the rule to every managed repo.
3. Commit and ship to `main` so all devices (CLI + mobile) inherit it.
4. Note the issue + the rule in `state/AI_AGENT_HANDOFF.md`.

The rule is the durable fix; a one-off patch in a single repo is not. Rules propagate; patches rot.

## 9. Distributable Framework — operator-agnostic & data-driven (MANDATORY)

This framework is a **distributable product**: anyone can fork/clone it to manage **their own**
repos. The clean separation that MUST always hold:

* **The tool is generic.** ai_management's capabilities, dashboard UI, and the
  **documentation/showcase** describe *what the framework does* — they ship identically to every
  operator. The showcase explains "how this tool works + what it can do," not one operator's apps.
* **The managed content is per-operator DATA.** Repos, plans, tasks, App-Directory cards,
  10-day plans, schedules — all come from the operator's `config/managed_repos.txt` + the gateway
  DB. They are whatever *that* operator manages.
* **NEVER hardcode the current operator's repos** (agentFlow, connect, aircanteen, playground,
  job-hunter, azure, …) into framework code, dashboard components, or shipped docs. Drive
  everything from live config/DB. Any repo name in code/docs must be a clearly-labelled *example*,
  never assumed present.
* **Grand product framing:** agentflow (idea→app) and connect (helpdesk) are *capabilities/modules*
  of the offering, but in a given install the operator's managed repos are their own — keep them
  data-driven, not baked in.
* Keep the **fork-init kit** (`scripts/init_fork.sh`, `clone-ready` branch) scrubbing
  operator-specific state so a new install starts blank.

When building ANY dashboard feature or doc: ask "would this still be correct for someone else
managing a totally different set of repos?" If not, make it data-driven.
