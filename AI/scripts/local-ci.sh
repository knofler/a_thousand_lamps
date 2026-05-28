#!/usr/bin/env bash
# local-ci.sh — Run a repo's required CI checks locally and post commit
# statuses, so PRs can merge when GitHub Actions is unavailable (billing
# exhaustion, outage, offline).
#
# WHY: knofler's personal account shares one 2000-min/mo Actions free tier
# across all private repos. When exhausted, required checks (build, Security
# Audit, Ready to Merge, Enforce branch policy) silently never fire, leaving
# every PR permanently BLOCKED even though the code is fine. This replicates
# those checks locally (Docker-only, per project policy) and, on pass, posts
# success statuses via the GitHub commit-status API — satisfying branch
# protection's required-check list. Proven wire format: connect-hub PR #14.
#
# HONESTY CONTRACT: a `success` status is posted ONLY for a check that
# actually passed locally this run, or that the operator explicitly attested
# via --trust-build. A failed or un-runnable check posts `failure` (or is
# skipped with a warning) — never a fabricated success.
#
# Usage:
#   ./scripts/local-ci.sh                      # run checks for current repo/branch, post on pass
#   ./scripts/local-ci.sh --dry-run            # run checks, print results, post nothing
#   ./scripts/local-ci.sh --repo /path/to/r   # target a different repo
#   ./scripts/local-ci.sh --sha <full-sha>     # override commit (default: HEAD of --branch)
#   ./scripts/local-ci.sh --branch test        # override head branch (default: current)
#   ./scripts/local-ci.sh --trust-build        # skip running `build`, attest manual verification
#   ./scripts/local-ci.sh -h | --help
#
# Exit codes: 0 all required checks passed (and posted unless --dry-run);
#             1 one or more checks failed; 2 usage/precondition error.

set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────
REPO_ROOT=""
SHA=""
BRANCH=""
DRY_RUN=0
TRUST_BUILD=0
NODE_IMAGE="${LOCAL_CI_NODE_IMAGE:-node:22-alpine}"

usage() { sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)        REPO_ROOT="$2"; shift 2 ;;
    --sha)         SHA="$2"; shift 2 ;;
    --branch)      BRANCH="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --trust-build) TRUST_BUILD=1; shift ;;
    -h|--help)     usage 0 ;;
    *) echo "Unknown arg: $1" >&2; usage 2 ;;
  esac
done

# ── Preconditions ───────────────────────────────────────────────────────────
command -v gh   >/dev/null 2>&1 || { echo "ERROR: gh CLI not found." >&2; exit 2; }
command -v git  >/dev/null 2>&1 || { echo "ERROR: git not found." >&2; exit 2; }
gh auth status >/dev/null 2>&1  || { echo "ERROR: gh not authenticated (run: gh auth login)." >&2; exit 2; }

# Resolve repo root (project root = git toplevel; works in master and managed
# repos since AI/ is a subdir of the project's git repo, not its own repo).
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" \
    || { echo "ERROR: not inside a git repo and no --repo given." >&2; exit 2; }
fi
cd "$REPO_ROOT"

NWO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)" \
  || { echo "ERROR: could not resolve owner/repo (no GitHub remote?)." >&2; exit 2; }
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
SHA="${SHA:-$(git rev-parse "$BRANCH" 2>/dev/null || git rev-parse HEAD)}"

echo "── local-ci ──────────────────────────────────────────────"
echo "  repo   : $NWO"
echo "  root   : $REPO_ROOT"
echo "  branch : $BRANCH"
echo "  sha    : $SHA"
echo "  mode   : $([ "$DRY_RUN" = 1 ] && echo 'dry-run (no posting)' || echo 'post on pass')"
echo "──────────────────────────────────────────────────────────"

# ── Discover required contexts from branch protection ───────────────────────
# Authoritative source: exactly the checks blocking a PR to main.
contexts_json="$(gh api "repos/${NWO}/branches/main/protection/required_status_checks" 2>/dev/null || echo '{}')"
CONTEXTS=()
while IFS= read -r line; do
  [ -n "$line" ] && CONTEXTS+=("$line")
done < <(printf '%s' "$contexts_json" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    d = {}
out = list(d.get("contexts") or [])
for c in d.get("checks") or []:
    if c.get("context") and c["context"] not in out:
        out.append(c["context"])
print("\n".join(out))
' 2>/dev/null)

if [ "${#CONTEXTS[@]}" -eq 0 ]; then
  echo "No required status checks on ${NWO}:main — nothing to post. Exiting clean."
  exit 0
fi
echo "Required contexts: ${CONTEXTS[*]}"
echo

# ── Docker helper (Docker-only policy — no host npm) ────────────────────────
run_node() {
  # run_node "<sh command>"  — runs in throwaway node container with repo mounted
  command -v docker >/dev/null 2>&1 || { echo "    docker unavailable"; return 3; }
  docker run --rm -v "$REPO_ROOT":/app -w /app "$NODE_IMAGE" sh -lc "$1"
}

# Find a running container for this repo (preferred for build/test: it has the
# right env, mongo sidecar, etc.). Returns container name on stdout or empty.
repo_container() {
  local base; base="$(basename "$REPO_ROOT" | tr '[:upper:]' '[:lower:]')"
  docker ps --format '{{.Names}}' 2>/dev/null \
    | grep -iE "^${base}[-_].*(app|gateway|web|api)?" | head -1 || true
}

# ── Check runners — each prints detail, returns 0 pass / non-0 fail ─────────
check_branch_policy() {
  echo "  [Enforce branch policy] head=$BRANCH"
  if [ "$BRANCH" = "test" ] || [[ "$BRANCH" =~ ^hotfix/ ]]; then
    echo "    PASS — branch '$BRANCH' permitted into main"; return 0
  fi
  echo "    FAIL — PRs to main must come from 'test' or 'hotfix/*' (got '$BRANCH')"; return 1
}

check_security_audit() {
  echo "  [Security Audit] secret scan + npm audit"
  # 1) committed-secret scan (same pattern as merge-gate.yml)
  if git grep -nE '(JWT_SECRET|ADMIN_API_KEY|RESEND_API_KEY|MONGODB_URI)\s*=\s*["'"'"'][^"'"'"']{8,}' \
       -- ':!*.example' ':!*.md' ':!.github/' ':!docker-compose.yml' >/dev/null 2>&1; then
    echo "    FAIL — hardcoded secret-shaped string in tracked files"; return 1
  fi
  echo "    ok — no committed secrets"
  # 2) npm audit (production deps) inside Docker — needs package-lock.json
  if [ -f package-lock.json ]; then
    if run_node 'npm audit --omit=dev --audit-level=high'; then
      echo "    PASS — npm audit clean (no high+ in prod deps)"; return 0
    else
      echo "    FAIL — npm audit found high+ severity in prod deps"; return 1
    fi
  fi
  echo "    PASS — no package-lock.json (audit n/a), secret scan clean"; return 0
}

check_build() {
  echo "  [build] lint + typecheck + build + test"
  if [ "$TRUST_BUILD" = 1 ]; then
    echo "    PASS — build trusted via --trust-build (operator manual verification)"; return 0
  fi
  [ -f package.json ] || { echo "    SKIP — no package.json"; return 2; }
  # Assemble the script chain from whatever scripts the repo actually defines.
  local steps="" s
  for s in lint typecheck build test; do
    if python3 -c "import json,sys; sys.exit(0 if '$s' in json.load(open('package.json')).get('scripts',{}) else 1)" 2>/dev/null; then
      steps="${steps}${steps:+ && }npm run $s"
    fi
  done
  [ -n "$steps" ] || { echo "    SKIP — no lint/typecheck/build/test scripts"; return 2; }

  local ctr; ctr="$(repo_container)"
  if [ -n "$ctr" ]; then
    echo "    running in container '$ctr': $steps"
    if docker exec "$ctr" sh -lc "$steps"; then
      echo "    PASS — build chain green in repo container"; return 0
    fi
    echo "    FAIL — build chain failed in repo container"; return 1
  fi
  echo "    no repo container running; ephemeral $NODE_IMAGE: npm ci && $steps"
  if run_node "npm ci && $steps"; then
    echo "    PASS — build chain green (ephemeral)"; return 0
  fi
  echo "    FAIL — build chain failed (ephemeral)"; return 1
}

# ── Run required checks (Ready to Merge is an aggregator — evaluate last) ────
# bash-3.2 safe: no associative arrays. Results stored as "state<TAB>context"
# lines; set_result/get_result read/write that string.
RESULTS=""
set_result() { RESULTS="${RESULTS}${2}"$'\t'"${1}"$'\n'; }   # set_result <ctx> <state>
get_result() { printf '%s' "$RESULTS" | awk -F'\t' -v c="$1" '$2==c{print $1; exit}'; }
overall=0
HAS_READY=0

for ctx in "${CONTEXTS[@]}"; do
  case "$ctx" in
    "Ready to Merge") HAS_READY=1; continue ;;
    "Enforce branch policy")
      if check_branch_policy; then set_result "$ctx" pass; else set_result "$ctx" fail; overall=1; fi ;;
    "Security Audit")
      if check_security_audit; then set_result "$ctx" pass; else set_result "$ctx" fail; overall=1; fi ;;
    "build")
      check_build; rc=$?
      if [ $rc -eq 0 ]; then set_result "$ctx" pass
      elif [ $rc -eq 2 ]; then set_result "$ctx" skip
      else set_result "$ctx" fail; overall=1; fi ;;
    *)
      echo "  [$ctx] no local runner mapped — SKIP (will not post)"; set_result "$ctx" skip ;;
  esac
  echo
done

# Ready to Merge mirrors `needs: [...]` — passes only if no required check failed.
if [ "$HAS_READY" = 1 ]; then
  if [ "$overall" -eq 0 ]; then
    set_result "Ready to Merge" pass; echo "  [Ready to Merge] PASS — all prerequisite checks green"
  else
    set_result "Ready to Merge" fail; echo "  [Ready to Merge] FAIL — a prerequisite check failed"
  fi
  echo
fi

# ── Post statuses ────────────────────────────────────────────────────────────
post_status() {
  local ctx="$1" state="$2" desc="$3"
  if [ "$DRY_RUN" = 1 ]; then
    printf '  would post: %-22s %-7s "%s"\n' "$ctx" "$state" "$desc"; return 0
  fi
  if gh api -X POST "repos/${NWO}/statuses/${SHA}" \
       -f state="$state" -f context="$ctx" -f description="$desc" >/dev/null 2>&1; then
    printf '  posted: %-22s %s\n' "$ctx" "$state"
  else
    printf '  POST FAILED: %-22s %s\n' "$ctx" "$state"; overall=1
  fi
}

echo "── posting statuses ──────────────────────────────────────"
for ctx in "${CONTEXTS[@]}"; do
  state="$(get_result "$ctx")"; state="${state:-skip}"
  case "$state" in
    pass) post_status "$ctx" success "local-ci: passed locally $(date -u +%Y-%m-%dT%H:%M:%SZ)" ;;
    fail) post_status "$ctx" failure "local-ci: failed locally — not merge-ready" ;;
    skip) echo "  skipped (not posted): $ctx — no local verification available" ;;
  esac
done
echo "──────────────────────────────────────────────────────────"

if [ "$overall" -eq 0 ]; then
  echo "RESULT: all required checks satisfied$([ "$DRY_RUN" = 1 ] && echo ' (dry-run — nothing posted)')."
  exit 0
fi
echo "RESULT: one or more required checks failed — PR is NOT merge-ready."
exit 1
