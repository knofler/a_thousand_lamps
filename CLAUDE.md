# Claude Code — Project Routing Rules

> This file is read by Claude Code at project startup. It defines how to route tasks to specialist subagents and when to dispatch in parallel.

---

## On Session Start

1. Read `AI/state/STATE.md` and `AI/state/AI_AGENT_HANDOFF.md` to synchronize project context
2. Read `AI/documentation/AI_RULES.md` for technical mandates
3. Review `AI/documentation/MULTI_AGENT_ROUTING.md` for routing reference
4. Dispatch `project-manager` to assess current status and identify the next work priority

---

## Specialist Subagents Available

Claude Code auto-discovers agents from `AI/.claude/agents/` and skills from `AI/.claude/skills/`:

| Agent | Trigger Keywords |
|-------|-----------------|
| `solution-architect` | architecture, design, ADR, scalability, "should we use X or Y" |
| `frontend-specialist` | component, page, frontend, UI, Next.js, React, Vercel |
| `api-specialist` | endpoint, route, API, controller, middleware, REST, GraphQL |
| `database-specialist` | schema, model, query, database, MongoDB, index, migration |
| `devops-specialist` | docker, deploy, pipeline, environment, CI/CD, GitHub Actions |
| `ui-ux-specialist` | design system, layout, style, UX, accessibility, Tailwind |
| `security-specialist` | security, auth, JWT, permissions, OWASP, rate limit |
| `documentation-specialist` | docs, README, document, guide, changelog |
| `product-manager` | feature, requirement, user story, roadmap, MVP, backlog |
| `qa-specialist` | test, QA, coverage, E2E, unit test, bug, regression |
| `tech-ba` | requirements, data flow, gap analysis, functional spec, business rule |
| `tech-lead` | code review, standards, coherence, technical decision, review |
| `project-manager` | project plan, milestone, blocker, risk, status, sprint, track |

---

## Parallel Dispatch Rules

### Always Parallel (no dependencies)
```
Lane C (Infrastructure) — start immediately on any project:
  devops-specialist: Docker + docker-compose + env vars + CI/CD
  security-specialist: auth approach + secrets review

Lane D (Async) — always parallel:
  documentation-specialist: README skeleton
  project-manager: STATE.md update + task tracking
  solution-architect: ADRs for major decisions
  product-manager: feature specs
  tech-ba: requirements documentation
```

### Parallel When No Shared State
```
Lane A (Frontend): frontend-specialist + ui-ux-specialist
Lane B (Backend):  api-specialist + database-specialist

Lanes A and B can run in parallel when API contracts are pre-defined.
```

### Sequential When Output is a Dependency
```
database-specialist schema → THEN api-specialist services
api-specialist contracts → THEN frontend-specialist fetch logic
devops-specialist env setup → THEN any implementation that references env vars
solution-architect ADR → THEN implementation of that architectural decision
```

---

## Project-Type Dispatch

### New Next.js App
```
Immediate parallel:
  frontend-specialist, ui-ux-specialist, devops-specialist, documentation-specialist, project-manager

Then (after contracts defined):
  api-specialist, database-specialist

Always parallel:
  security-specialist, qa-specialist, solution-architect
```

### API-Heavy Project (Node.js or Python)
```
Immediate parallel:
  api-specialist, database-specialist, devops-specialist, security-specialist, documentation-specialist

Async parallel:
  solution-architect, tech-ba, project-manager

Then if UI needed:
  frontend-specialist, ui-ux-specialist
```

### Any Project — Always Start With
```
devops-specialist → Docker + env vars
security-specialist → auth + .env review
documentation-specialist → README
project-manager → STATE.md
```

---

## Skills (59 Playbooks)

Each agent has 3-5 skills — repeatable playbooks auto-discovered from `AI/.claude/skills/`. Skills trigger when your prompt matches their keywords.

See `AI/skills/README.md` for the full catalog.

---

## Quality Gates (tech-lead enforces)

Before any feature is marked complete:
- [ ] API contracts match frontend implementation
- [ ] Database schema matches service queries
- [ ] Auth middleware matches security-specialist spec
- [ ] Tests exist (qa-specialist sign-off)
- [ ] Documentation updated
- [ ] CI/CD pipeline passes

---

## State Management Protocol

```
Session start:  Read AI/state/STATE.md + AI/state/AI_AGENT_HANDOFF.md
After each task: Update AI/state/STATE.md autonomously — do not wait for user prompt
Session end:    Update AI/state/STATE.md + AI/state/AI_AGENT_HANDOFF.md
Agent log:      Write to AI/logs/claude_log.md with timestamp
```

**NEVER wait for the user to ask you to save state.** Update state/STATE.md after every significant action.

---

## File Domain Ownership (No Parallel Writes to Same Files)

| Domain | Owned By | Files |
|--------|---------|-------|
| Frontend | frontend-specialist | `src/app/`, `src/components/`, `styles/` |
| API | api-specialist | `src/routes/`, `src/controllers/`, `src/services/` |
| Database | database-specialist | `src/models/`, `src/db/` |
| Infra | devops-specialist | `docker-compose.yml`, `.github/`, `Dockerfile` |
| Auth/Security | security-specialist | `src/middleware/auth.js`, `src/middleware/security.js` |
| AI/Docs | Lane D agents | `AI/`, `README.md`, `docs/` |
