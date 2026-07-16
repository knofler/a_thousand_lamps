#!/usr/bin/env bash
# myai_brain.sh — CLI surface for the Brain store (git-versioned agent memory).
# Thin dispatcher over scripts/lib/brain.sh (the single source of truth);
# `myai brain <cmd>` lands here via bin/myai.cjs. See plan/jam/brain-layer.md.
#
#   myai brain init [path] [--remote <url>]   create/adopt the brain repo (no local dir + remote → clone)
#   myai brain status                          where it lives, branch, atoms, stashes
#   myai brain write <kind> <repo|-> <slug>    append one immutable atom (stdin)
#   myai brain stash <slug> [repo]             freeze context on main (stdin) — resume anywhere
#   myai brain stash list                      stashes waiting on main, newest first
#   myai brain pop [slug]                      print + remove the newest (matching) stash
#   myai brain branch <slug>                   idea/<slug> parallel-thought branch (alias: idea)
#   myai brain checkout <ref>                  switch to main | session/* | idea/*
#   myai brain merge [branch]                  merge session/idea → main + distill (wrap up)
#   myai brain session start [profile]         session/<date>-<host>-<profile>
#   myai brain session merge [branch]          same as `merge`
#   myai brain log [n]                         recent brain commits (default 10)
#   myai brain diff [from] [to]                what <to> adds over <from> (default main..HEAD)
#   myai brain distill [ns …]                  recompile brief/working/rollup on main
#   myai brain blame <code-sha|brain-ref>      code↔memory provenance, both directions
#   myai brain revert <sha>                    undo a commit with an inverse commit
#   myai brain gc [--dry-run] [--stash-age N]  compact: dedup atoms, prune orphans/old stashes, repack
#   myai brain dream [--dry-run] [--sim-threshold N] [--min-keep-ratio N]
#                                               idle consolidation: near-dup supersedes + blue-green
#                                               recompile of brief/working/rollup (BRAIN B5)
#   myai brain stamp <code-dir> <repo> <slug> [sha…]  stamp session atom + git notes (stdin)
#
# `merge` auto-runs the distiller (compile-at-write, BRAIN B3) — `distill` is
# the manual/backfill form. Gateway mirror: brain_* MCP tools. Scripted
# walkthrough: TRY_BRAIN.md.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/brain.sh
. "$HERE/lib/brain.sh"

usage() { sed -n '6,26p' "$0" | sed 's/^# \{0,3\}//'; }

cmd="${1:-}"; shift 2>/dev/null || true
case "$cmd" in
  init)     brain_init "$@" ;;
  status)   brain_status ;;
  write)    brain_atom_write "$@" ;;
  stash)
    if [ "${1:-}" = "list" ]; then brain_stash_list
    else brain_stash "$@"; fi ;;
  pop)      brain_pop "$@" ;;
  branch|idea) brain_idea "$@" ;;
  checkout) brain_checkout "$@" ;;
  merge)    brain_session_merge "$@" ;;
  session)
    sub="${1:-}"; shift 2>/dev/null || true
    case "$sub" in
      start) brain_session_start "$@" ;;
      merge) brain_session_merge "$@" ;;
      *) echo "myai brain session: expected start|merge (got '${sub:-}')" >&2; exit 2 ;;
    esac ;;
  log)      brain_git log --oneline --graph -n "${1:-10}" ;;
  diff)     brain_diff "$@" ;;
  distill)  brain_distill "$@" ;;
  blame)    brain_blame "$@" ;;
  revert)   brain_revert "$@" ;;
  gc)       brain_gc "$@" ;;
  dream)    brain_dream "$@" ;;
  stamp)    brain_stamp_code "$@" ;;
  ''|help|-h|--help) usage ;;
  *) echo "myai brain: unknown command '$cmd'" >&2; usage >&2; exit 2 ;;
esac
