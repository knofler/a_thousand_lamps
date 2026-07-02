# Global AI Agent Instructions

## 1. Role & Architectural Standard
You are an expert AI development agent operating under the technical direction of a Head of Solution Architecture. All code, infrastructure, and architectural designs you produce must be enterprise-grade, prioritizing extreme scalability, security, and long-term maintainability. 

## 2. Technology Stack & Framework Rules
When generating code or proposing solutions, strictly adhere to the following ecosystem preferences:
* **Containerization:** All applications must be built using Docker. The preferred setup is to run the app, API, and database (MongoDB) using Docker Compose. All environment variables must be mapped to the `docker-compose` file.
* **Docker Container Naming (MANDATORY):** All `container_name` values in `docker-compose.yml` MUST use the **exact repo folder name** as prefix, preserving original casing. Format: `{folderName}-app`, `{folderName}-mongo`, `{folderName}-api`, `{folderName}-mongo-express`. Example: folder `acme` → `acme-app`, `acme-mongo`, `acme-api`. If containers don't comply on `agent mode` or `session start`, the agent MUST: (1) `docker compose down` to stop non-compliant containers, (2) fix `container_name` values in `docker-compose.yml`, (3) `docker compose up -d --build` to rebuild. No exceptions.
* **Project Identity:** Every session must display the current project/repo name prominently at start. The `00-project-identity.sh` hook handles this automatically.
* **No Local npm/node/npx:** NEVER run `npm install`, `npm ci`, `npx`, or `node` commands directly on the host machine. Always use `docker compose exec app <command>`. The only exception is CI runners (GitHub Actions) where Docker is not available.
* **Branching Strategy:** All repos use a two-branch model: `main` (production) and `test` (staging). NEVER push directly to `main`. Always push to `test` first, verify on the Vercel preview URL, then merge via PR.
* **Git Email (MANDATORY):** GitHub blocks pushes with private emails. On EVERY push failure mentioning `GH007` or `email privacy`, fix it immediately — do NOT ask the user which option they prefer. Run: `git config user.email "YOUR_ID+yourname@users.noreply.github.com"` (repo-local, not global). Then amend unpushed commits with: `GIT_COMMITTER_EMAIL="YOUR_ID+yourname@users.noreply.github.com" GIT_COMMITTER_NAME="Your Name" git commit --amend --no-edit --author="Your Name <YOUR_ID+yourname@users.noreply.github.com>"`. Both author AND committer email must be the noreply address. Never change `--global` git config.
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
* **The runner is the only executor** — the launchd `com.myai.cli-task-runner` (Opus 4.8,
  `claude-tech`, subscription-billed / 0 API tokens) pulls tasks from the **gateway queue** by priority.
* **The runner is PER-MACHINE — install it on every Mac that should drain the queue.** The queue is
  shared (Atlas) but the runner is a *worker*: `launchd` is a local macOS facility (no central
  scheduler) and it needs that Mac's Claude CLI + logged-in profile + Docker/gateway + checked-out
  repos. So a new runner Mac is a deliberate one-time setup — `agent mode`'s self-heal **never
  auto-installs** it (installing a headless agent that spends your Claude plan must be explicit).
  Per Mac: `./scripts/setup_cli_runner_schedule.sh --every-minutes 10` (managed: `./AI/scripts/…`)
  **and** `sudo pmset -c sleep 0` (launchd can't fire while asleep) + keep it plugged in, lid open.
  **Self-surfacing reminder:** `scripts/machine_selfheal.sh` (runs at every session start via
  `hooks/session/18-machine-selfheal.sh`) prints a **RUNNER REMINDER** on any Mac that has no runner
  installed; silence a Mac that should never be a worker with `touch ~/.ai-cli-runner/.no-runner`.
* **Reconcile phantom `review` tasks — the board must self-heal (`scripts/reconcile_review_tasks.sh`).**
  The runner works a task on `test` → flips it to `review`, but **never ships to main and never flips
  `review→done`**. Once that work lands on `main` (via `ship it`/`/fleet`, or because it was already
  there), the gateway task is stuck in `review` forever and the queue inflates with already-shipped
  **phantoms** — so every `/fleet` morning console wastes time re-triaging stale entries (on
  2026-06-22, **~38 of 44** "backlog" tasks were phantom). The fix: `reconcile_review_tasks.sh`
  reconciles in two stages. **(1) Whole-repo fast path:** compare each repo's `origin/test` against
  `origin/main`; **if `test` has 0 commits ahead, every one of that repo's `review` tasks is provably
  shipped → flip to `done`**. **(2) Per-task ancestor check:** when `test` IS ahead, the repo still has
  *some* unshipped work — but `cli_task_runner.sh` stamps the commit SHA(s) each session pushed onto the
  task notes (`[pushed-shas] {...,"commits":[...]}`), so for each task we check whether **every** stamped
  commit is an ancestor of `origin/main` (`git merge-base --is-ancestor`); if so, that single task's work
  is provably shipped → flip just it to `done`, even though other tasks remain unshipped on `test`. Tasks
  with no stamped SHA (or whose SHAs aren't on main yet — e.g. squash/rebase merges produce new SHAs) are
  left for review. Indeterminate repos (no git / missing `main`|`test`) are skipped untouched. It is
  **fail-safe** — it only flips when it can prove the work is on main (whole-repo test==main, or each
  task's exact commits), and it NEVER ships/merges/touches git. Wired in automatically: the **CLI runner** runs it (throttled ≤1/hr)
  each fire, **`/fleet`** runs it before computing the morning table, and it runs at `agent mode` start
  + `wrap up`. Run standalone any time: `./scripts/reconcile_review_tasks.sh [--dry-run] [--repo X]`.
* **The runner must be robust to a poison task — never let one bad task starve the queue.**
  The launchd runner picks tasks from the queue head by priority. A single task whose repo can't be
  resolved to a **buildable git checkout** (e.g. a misfiled `content_api` task pointing at the
  `POWERHOUSE/CONTENT_API` *workspace* dir, which has no `.git`) must **NOT** abort the fire. The
  runner loops candidates and, on an unresolvable one, **marks it `blocked`** (with a re-point/discard
  note) and moves to the next — so a poison item leaves `pending` and can never head-of-line-block the
  whole queue. This is the structural fix for the recurring `RUNNER-QUEUE-STARVED` class (3 incidents:
  MEMBERSHIP no-remote, the `set -e` remote death, and the `exit 1`-on-unresolvable-path block fixed
  2026-06-23). Resolution must verify the path is *actually a git repo* (`.git` present), not merely
  that a registry lookup returned a non-empty string. If "no schedule events are running for ANY repo,"
  check `~/.ai-cli-runner/runner.out` first — a repeating per-fire ERROR on the same task is this bug.
* **NEVER** create gateway cron schedules or Claude Code cloud routines for per-repo work.
* **Off-hours only** — autonomous runs fire **weekdays 6pm–9am Sydney + all weekend**; never
  weekday 9am–6pm. Plan fire times auto-clamp into this band.
* **Cross-device** — mobile/cloud sessions commit `AI/plan/schedule.json` to `main`; a CLI
  `agent mode -a` on any Mac ingests it into the runner via `AI/scripts/push_schedule.sh`.
* **Core-product priority (`config/schedule_priority.txt`)** — the autonomous schedule
  **builds the core myAI platform FIRST**: `AI`/`ai_management` (master) + `agentFlow` + `connect`,
  the three repos that combine into the one sellable myAI product (`plan/GRAND_PRODUCT_ROADMAP.md`).
  These repos' tasks keep their P0/P1/P2 priority; **every other repo's pending tasks are capped at
  P3** so the runner never builds a secondary/sandbox app (any secondary or sandbox repo) ahead
  of the product. Enforced by `scripts/reprioritize_queue.sh` — run it at `agent mode` start and in
  `wrap up` (idempotent). This is the inverse of the consent list below: *priority* repos rise,
  *ignored* repos are skipped. When generating `schedule plan` tasks, the core repos' plans are the
  product plan and must be the source of P0 work; do not let per-repo polish for secondary apps
  outrank the platform MVP.
* **No-autonomous-schedule consent list (`config/schedule_ignore.txt`)** — some apps must
  **NEVER** get autonomous scheduled work without the user's **clear, explicit consent**
  (user directive 2026-06-13, expanded 2026-06-16: your consented sandbox/secondary repos
  configured in `config/schedule_ignore.txt`).
  Enforcement is layered: (a) the CLI runner **skips** any pending task whose repo is on the
  list during its autonomous fleet picks; (b) `schedule plan` / `schedule_task.sh` /
  `push_schedule.sh` **refuse to queue** work for these repos; (c) during `wrap up` /
  `schedule plan` the agent **does NOT auto-submit a plan or top up the queue** for them — if a
  plan IS submitted for one, **CHECK WITH THE USER FIRST**. A consented run always works:
  `cli_task_runner.sh --repo <name> --force` (or `--task <id>`), or env `SCHEDULE_CONSENT=1`
  for the queuing scripts — *manual = consent*. The list is propagated fleet-wide by
  `update_all.sh`, so every repo's guards honor the same names.

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
* **NEVER hardcode the current operator's repos** (e.g. your product or managed repos,
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

## 10. Multi-Tenant Scoping — tenantId on every scoped query (ADR-010 §3.4, MANDATORY)

The gateway is row-level multi-tenant: one DB, a `tenantId` discriminator on the 8
**customer-operational** collections (`Task`, `Schedule`, `PlanDay`, `RepoCard`, `Vector`,
`GatewaySession`, `BudgetUsage`, `Notification`). A query on any of these that forgets `tenantId`
is a **silent cross-tenant data leak**.

* **Always route scoped reads/writes through `runtime/src/shared/scoped-query.ts`**
  (`scopedFind`/`scopedFindOne`/`scopedUpdateOne`/`scopedDeleteOne`/`tenantScope`/`withTenant`) with a
  server-derived `tenantId` from `getTenantScope(ctx)` — **never** from a caller-supplied arg/body.
* **CI grep-gate (`scripts/local-ci.sh → check_tenant_scoping`)** flags any
  `(Task|Schedule|PlanDay|RepoCard|Vector|GatewaySession|BudgetUsage|Notification)Model.(find|findOne|updateOne|deleteOne|aggregate)`
  lacking nearby scope evidence → **CRITICAL block** (fails the run, blocks the merge). It runs on
  every `local-ci.sh` invocation when `runtime/src` is present.
* A **deliberate** cross-tenant system query (e.g. the scheduler's fleet-wide due-tick under
  `SYSTEM_CONTEXT`) must carry a `// tenant-ok: <reason>` marker explaining why it spans tenants.
* `tenancy.enforce` defaults **on** (`config.ts`); unresolved/non-loopback callers need a valid
  tenant key or the `GATEWAY_LOCAL_TOKEN` bridge token. Roll back with `TENANT_ENFORCE=false`.

## 11. Vercel Deploy Gate — build ONLY on main, fleet-wide (MANDATORY)

Vercel's free/Hobby plan caps deployments at **100/day account-wide (across ALL projects)**.
Un-gated, Vercel deploys a Preview on **every push to every branch**; summed across the fleet that
blows the cap and then blocks **production** too. So **every repo MUST build only on `main`** —
working-branch pushes (`test`/`codeclot`/feature) must produce **zero** deployments.

* **The gate** (`vercel.json`, scaffolded from `templates/vercel.json`):
  `git.deploymentEnabled: {main:true, test:false, codeclot:false}` (no deployment record created on
  the working branches) **+** an `ignoreCommand` that builds only when `VERCEL_GIT_COMMIT_REF == main`
  (the catch-all that stops a push on *any* other branch — so a repo can't go rogue on a feature
  branch). Never clobber a repo's own `ignoreCommand`; merge the branch gate instead.
* **New repos are born gated** — `templates/vercel.json` carries it; `init_blueprint.sh` /
  `rollout_ci_thrift.sh gate_vercel()` **create** it when missing (do NOT only edit existing files).
* **Enforcement:** `hooks/session/19-vercel-gate-guard.sh` runs every session (master repo) and warns
  loudly if any managed repo lacks the build-only-main gate → "rogue deployer". Fix the whole fleet
  with `./scripts/rollout_ci_thrift.sh --apply` (then commit + push each — the gating push is itself
  skipped by Vercel, costing zero quota).
* **Batch releases** (`scripts/deploy_status.sh`): commit freely to `test` (0 builds), `ship it` only
  every 3–4 changes → ~1 production build per release. Real fleet need is single-digit builds/day,
  nowhere near 100.
* **Airtight cap lever (operator, dashboard):** for projects that must never preview, also set
  *Production Branch = main* + disable Preview Deployments in the Vercel project settings. `vercel.json`
  is the config-side guard; the dashboard setting is belt-and-suspenders.
* **Do NOT buy Vercel Pro to escape the cap** — the gate makes it irrelevant. Pro only for genuine
  >60s functions / production-scale needs.

## 12. Dropbox — never sync node_modules / build artifacts (fleet-wide, MANDATORY)

Many machines keep the dev workspace **inside Dropbox**. Dropbox then tries to index and sync every
`node_modules` (tens of thousands of churning files per repo), build output, and cache dir — pegging
CPU + RAM and making the Mac unusable. These dirs are **regenerable** (reinstalled / rebuilt per
machine — the framework is Docker-based) and are **never version-controlled**, so syncing them is pure
waste. **No machine may sync `node_modules` to Dropbox. Build artifacts ride the same rule.**

* **Mechanism:** Dropbox's official per-folder ignore flag — extended attribute
  `com.dropbox.ignored=1`. The folder stays on local disk; Dropbox stops indexing/syncing it.
  Reversible: `xattr -d com.dropbox.ignored <dir>`.
* **Covered dirs:** `node_modules` (mandated) + `.next`, `dist`, `build`, `coverage`, `.turbo`,
  `.parcel-cache`, `.nuxt`, `.svelte-kit` (same class of regenerable junk).
* **Enforcement:**
  * `scripts/dropbox_ignore_artifacts.sh` — idempotent; marks artifact dirs ignored. `--all` sweeps
    the entire Dropbox root (manual fleet sweep); no-arg scopes to the current repo (fast). macOS +
    Dropbox only; silent no-op elsewhere (Linux/cloud/container).
  * `hooks/session/20-dropbox-ignore.sh` — runs every session (`--quiet`), re-ignoring any artifact
    dir that reappeared (e.g. after an `npm install`) in the current repo. Registered in
    `.claude/settings.json`. Propagated fleet-wide via `update_all.sh` → enforced on **every machine**.
* **Disk hygiene:** host `node_modules` shouldn't normally exist anyway — `hooks/pre-tool/05-no-local-npm.sh`
  blocks host npm (Docker-only). Stale ones can be deleted outright (regenerable):
  `find ~/code -type d -name node_modules -prune -exec rm -rf {} +`.
* **Also reduce Dropbox load:** lower its CPU priority so it yields to active apps —
  `for p in $(pgrep -i dropbox); do renice 20 "$p"; done`.

### 12a. `.dockerignore` — node_modules is the FIRST provisioning condition (MANDATORY)

Every repo — **current and future** — must carry a `.dockerignore` whose **first entry is `node_modules`**.
Host `node_modules` must never enter the Docker build context: it bloats/poisons the image (wrong-arch
binaries, stale deps), balloons build time, and (under Dropbox) is the churn source §12 eliminates. Deps
install **inside** the image; the compose dev pattern masks the host dir with an anonymous volume
(`- .:/app` + `- /app/node_modules`) so containers use the image's modules.

* **Canonical template:** `templates/.dockerignore` (node_modules first, then build artifacts, VCS, env).
* **Provisioning (future repos):**
  * `init_blueprint.sh` step 2a **guarantees** a compliant `.dockerignore` (copies the template; writes a
    minimal one if absent) — runs before the AI-framework refresh, so it's a first-class scaffold condition.
  * `init_ai.sh` copies the master `.dockerignore` into every bootstrapped project.
  * `templates/.dockerignore` propagates fleet-wide via `update_all.sh` → new scaffolds are born compliant.
* **Enforcement (current repos):** `health_check.sh` verifies `.dockerignore` exists **and contains
  `node_modules`** for every Docker repo — warns "MISSING node_modules (AI_RULES §12)" otherwise.
* **Disk:** host `node_modules` shouldn't exist at all (Docker-only; `05-no-local-npm.sh` blocks host npm).

## 13. Terminal output — NEVER green; use orange (operator can't read green) (fleet-wide, MANDATORY)

The operator cannot read green text in their terminal (long-standing). **No framework script, hook, or
statusline may emit green ANSI.** Green's full theme (`dark-daltonized`) is set in `.claude/settings.json`
for Claude Code's own UI, but that does NOT recolor the raw ANSI our scripts print — so green escapes in
our output must be eliminated at the source.

* **Banned:** `\033[32m` / `\033[0;32m` / `\033[1;32m` / `\033[92m` (bright green) / `tput setaf 2` /
  256-color greens (`38;5;{2,10,22,28,34,40,46,70,76,82,118,154}`).
* **Use instead:** **orange `\033[1;38;5;208m`** (or `38;5;214` gold-orange where a second distinct
  orange is needed, e.g. the `claude-personal` statusline vs `claude-museum`'s 208). Success/OK states
  that were green → orange; the palette is orange (good) / yellow `38;5;220` (warn) / red `38;5;196`
  (bad) / cyan `38;5;45/51` (info) — all colour-blind-safe, no green.
* **Applies to:** statusline (`org-statusline.sh` + deployed `~/.claude-org-statusline.sh`), every
  session/stop hook banner, and every `scripts/*.sh` `GREEN=`/inline color. Fixed fleet-wide 2026-06-26.
* **When you add colored output:** never reach for green. If you need "good/pass," use orange.

## 14. Config propagation is DEEP-MERGE, never clobber (fleet-wide, MANDATORY)

* **The rule:** `update_all.sh` (and any future propagation path) must NEVER plain-overwrite a
  repo-local JSON config. `.claude/settings.json` and `.mcp.json` are propagated through
  `scripts/lib/json_merge.py`: **framework-owned keys stay canonical (master wins), repo-local
  additions survive** (statusLine, extra session hooks, extra permissions, custom MCP servers),
  and the file is rewritten **only when the merged result differs semantically** — a no-change
  sync leaves the repo tree clean.
* **Why (real incident):** the old unconditional overwrite clobbered agentFlow's repo-local
  settings **18 times** (3 in one session), burning a repair cycle
  (`git checkout origin/main -- .claude/settings.json .mcp.json`) at the start of every
  agentFlow session. The old `.mcp.json` jq merge also silently dropped every non-`mcpServers`
  top-level key and rewrote the file on every sync even when nothing changed.
* **Guard, not fallback:** if a repo's file is invalid JSON, the merge SKIPS it and reports —
  it never falls back to overwriting. A broken file is the repo agent's to fix; destroying it
  hides the problem.
* **When you add a new propagated JSON config:** wire it through `merge_json()` in
  `update_all.sh`. Tests: `scripts/tests/test_json_merge.sh` (17 assertions).
  LL: `LL/2026-07-02-updateall-json-clobber-deepmerge.md`.
