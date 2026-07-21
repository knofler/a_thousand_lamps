---
name: fleet
description: "Fleet Morning Console — sweep every managed repo's overnight work, show a decision table, and drive merge/fix/ship/wrap-up per repo from this terminal, live on the dashboard /fleet page. Shortcut for the `agent mode -resume all` keyword. Triggers: fleet, fleet console, morning fleet, resume all, overnight review, /fleet"
---

# /fleet — Fleet Morning Console

The "coffee + drive the whole fleet from one terminal" command. Identical to the
`agent mode -resume all` keyword — this skill is its slash-command shortcut.

**MASTER REPO ONLY** (reads `config/managed_repos.txt`). If invoked elsewhere, say so and stop.

## Steps

1. **Sweep.** Run `./scripts/fleet_resume.sh scan` (add `--no-fetch` only for a fast, possibly-stale preview). It aggregates each managed repo's overnight state — commits on `test` ahead of `main`, uncommitted, open PRs + CI rollup, CLI-runner jobs in the last 24h, queued `review`/`blocked` tasks — computes a per-repo recommendation (🚀 ship / 👀 review / 🔀 merge / 🔧 fix / 📝 wrap-up / 🕸 stale / · idle), opens a `FleetRun` in the gateway, and prints the decision table. The run streams **live to the dashboard `/fleet` page** (http://localhost:3210/fleet, 4s auto-refresh). Capture the `RUNID=…` tail.
   - `stale` = historical `test`/`main` divergence, **not** overnight work — do NOT treat it as "ship". Only `ship`/`review`/`merge`/`fix`/`wrap-up` are actionable.
2. **Present** the table and ask the operator for per-repo decisions in plain English (e.g. `ship agentFlow · fix connect · merge aircanteen · skip rest`).
3. **Execute each pick DIRECTLY from here** (Option-1 model), one repo at a time:
   - Before: `./scripts/fleet_resume.sh update <RUNID> <repo> --status in-progress --action <a> --decision "..."`
   - `cd` into the repo's git root and run the matching flow — `ship it` (commit→test→PR→admin-merge per Local-CI Policy), fix (diagnose+patch, spawn a focused sub-agent for deep work), merge (admin-merge a green PR), test (Docker gate), or `wrap up`.
   - After: `./scripts/fleet_resume.sh update <RUNID> <repo> --status done --detail "<result>" [--pr <url>]` (or `--status failed --detail "<why>"`).
   - Safety rails apply per repo (no-push-main, secret-scan, protected-files). **`phm-main` is AI-folder-only — never write outside `AI/`, never push.**
4. **idle/stale/skip** → leave pending or `--status skipped`.
5. **Close** — when all picks are handled: `./scripts/fleet_resume.sh finish <RUNID>`. Re-display any time with `./scripts/fleet_resume.sh latest`.
6. Honor zero-prompt + YOLO. Cross-machine merges/ships are **irreversible** → execute exactly the operator's picks, nothing extra.

Full protocol: `documentation/KEYWORDS_REFERENCE.md` → "Fleet Morning Console".
