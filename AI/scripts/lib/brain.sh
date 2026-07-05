#!/usr/bin/env bash
# brain.sh — Brain store core: git-versioned agent memory (BRAIN B1).
#
# The brain is a real, private git repo SEPARATE from code git (see
# plan/jam/brain-layer.md). Sessions = commits, wrap up = merge, branches =
# parallel thinking contexts, `main` = the consolidated truth agents boot from.
#
# Layout inside the brain repo:
#   BRAIN.md                          manifest (created by init)
#   memory/<atom>.md                  cross-repo memory facts
#   repos/<name>/sessions/<atom>.md   one file per session block
#   repos/<name>/handoffs/<atom>.md   one file per handoff entry
#   repos/<name>/brief.md             compiled boot brief  (~150 tok, checked into main)
#   repos/<name>/working.md           compiled working context (~2k, checked into main)
#
# APPEND-ONLY ATOMS: every session block / handoff entry / memory fact is ONE
# file, immutable once written. Filenames embed a content hash
# (<utc-ts>-<host>-<slug>-<sha8>.md) so two agents can never race on the same
# path with different content — git merges are conflict-free BY CONSTRUCTION.
# The lib NEVER edits an existing atom; re-writing an identical fact is a
# no-op (dedup by <slug>-<sha8> within the target dir).
#
# Branch model:
#   main                              consolidated truth
#   session/<YYYYMMDD>-<host>-<prof>  auto, short-lived, merges at wrap up
#   idea/<slug>                       long-lived parallel thought
#
# Resolution order for the brain location (bash + node libs agree):
#   1. $MYAI_BRAIN_DIR                explicit override
#   2. $MYAI_HOME/brain.path          pointer file written by `brain init`
#   3. $MYAI_HOME/brain               default ($MYAI_HOME defaults to ~/.myai)
#
# Sourceable (set-e/-u safe, bash 3.2-safe for stock macOS). CLI wrapper:
# scripts/myai_brain.sh. Node mirror: runtime/src/core/brain.ts. Tests:
# scripts/tests/test_brain.sh (hermetic — git + coreutils only).

# ── location resolution ──────────────────────────────────────────────────────

brain_home() { printf '%s\n' "${MYAI_HOME:-$HOME/.myai}"; }

brain_dir() {
  if [ -n "${MYAI_BRAIN_DIR:-}" ]; then printf '%s\n' "$MYAI_BRAIN_DIR"; return 0; fi
  local ptr; ptr="$(brain_home)/brain.path"
  if [ -f "$ptr" ]; then
    local p; p="$(head -1 "$ptr" 2>/dev/null)"
    if [ -n "$p" ]; then printf '%s\n' "$p"; return 0; fi
  fi
  printf '%s\n' "$(brain_home)/brain"
}

brain_is_repo() { local d="${1:-$(brain_dir)}"; [ -d "$d/.git" ] && [ -f "$d/BRAIN.md" ]; }

brain_git() { git -C "$(brain_dir)" "$@"; }

brain_host() {
  local h="${BRAIN_HOST:-$(hostname -s 2>/dev/null || echo unknown)}"
  printf '%s\n' "$h" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-' | sed 's/^-*//;s/-*$//'
}

_brain_slugify() {
  printf '%s\n' "$1" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-' \
    | sed 's/--*/-/g;s/^-*//;s/-*$//'
}

_brain_sha8() {
  # sha256 of stdin, first 8 hex chars. macOS ships shasum, Linux sha256sum.
  if command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -c1-8
  else shasum -a 256 | cut -c1-8; fi
}

_brain_utc() { date -u +%Y%m%dT%H%M%SZ; }

# ── init ─────────────────────────────────────────────────────────────────────

# brain_init [path] [--remote <url>]
# Creates the brain git repo (branch: main), seeds the layout, records the
# pointer file so every agent/lib on this machine resolves the same brain.
# Idempotent: an existing brain is adopted (pointer refreshed, remote added if
# missing), never re-initialized.
brain_init() {
  local dir="" remote="" arg
  while [ $# -gt 0 ]; do
    arg="$1"; shift
    case "$arg" in
      --remote) remote="${1:-}"; shift ;;
      -*) echo "brain_init: unknown option: $arg" >&2; return 2 ;;
      *) dir="$arg" ;;
    esac
  done
  [ -n "$dir" ] || dir="$(brain_home)/brain"
  case "$dir" in /*) ;; *) dir="$(pwd)/$dir" ;; esac

  mkdir -p "$(brain_home)"
  if brain_is_repo "$dir"; then
    printf '%s\n' "$dir" > "$(brain_home)/brain.path"
    if [ -n "$remote" ] && ! git -C "$dir" remote get-url origin >/dev/null 2>&1; then
      git -C "$dir" remote add origin "$remote"
    fi
    echo "brain: already initialized at $dir"
    return 0
  fi
  if [ -e "$dir" ] && [ -n "$(ls -A "$dir" 2>/dev/null)" ] && [ ! -d "$dir/.git" ]; then
    echo "brain_init: $dir exists and is not empty (and not a brain repo) — refusing" >&2
    return 1
  fi

  mkdir -p "$dir/memory" "$dir/repos"
  ( cd "$dir" && git init -q -b main 2>/dev/null ) \
    || ( cd "$dir" && git init -q && git symbolic-ref HEAD refs/heads/main )
  # Local identity so headless/runner commits never depend on global git config.
  git -C "$dir" config user.name  "myai-brain"
  git -C "$dir" config user.email "brain@myai.local"
  git -C "$dir" config commit.gpgsign false

  cat > "$dir/BRAIN.md" <<'EOF'
# myAI Brain

Git-versioned agent memory. Sessions = commits, wrap up = merge, `main` = the
consolidated truth every agent boots from.

- `memory/` — cross-repo memory facts (append-only atoms)
- `repos/<name>/sessions/` — session blocks (append-only atoms)
- `repos/<name>/handoffs/` — handoff entries (append-only atoms)
- `repos/<name>/brief.md` — compiled boot brief (~150 tokens)
- `repos/<name>/working.md` — compiled working context (~2k tokens)

Atoms are immutable once written — never edit them; write a new atom.
Compiled artifacts (`brief.md`, `working.md`) are regenerated by the distiller
(`brain merge`) and are the ONLY files here that change in place.

Managed by `myai brain` (scripts/lib/brain.sh · runtime/src/core/brain.ts).
EOF
  touch "$dir/memory/.gitkeep" "$dir/repos/.gitkeep"
  git -C "$dir" add -A
  git -C "$dir" commit -q -m "brain: init store (layout v1)"
  [ -n "$remote" ] && git -C "$dir" remote add origin "$remote"

  printf '%s\n' "$dir" > "$(brain_home)/brain.path"
  echo "brain: initialized at $dir (branch: main)"
}

# ── project namespaces + compiled artifacts ──────────────────────────────────

# brain_ensure_ns <repo-name> — create repos/<name>/ with sessions/, handoffs/
# and placeholder compiled artifacts (brief.md + working.md, regenerated by the
# B3 distiller). Commits only when something new was created. Prints ns path.
brain_ensure_ns() {
  local name; name="$(_brain_slugify "${1:?brain_ensure_ns: repo name required}")"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_ensure_ns: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  local ns="$d/repos/$name"
  if [ ! -d "$ns" ]; then
    mkdir -p "$ns/sessions" "$ns/handoffs"
    touch "$ns/sessions/.gitkeep" "$ns/handoffs/.gitkeep"
    printf '# %s — boot brief\n\n_Not compiled yet. The distiller (`brain merge`) fills this (~150 tokens)._\n' "$name" > "$ns/brief.md"
    printf '# %s — working context\n\n_Not compiled yet. The distiller (`brain merge`) fills this (~2k tokens)._\n' "$name" > "$ns/working.md"
    git -C "$d" add "repos/$name"
    git -C "$d" commit -q -m "brain(ns): add repo namespace $name"
  fi
  printf '%s\n' "$ns"
}

# ── append-only atoms ────────────────────────────────────────────────────────

# brain_atom_write <kind> <repo|-> <slug>   (content on stdin)
#   kind ∈ session | handoff | memory. repo '-' (or empty) targets the
#   cross-repo memory/ dir (only valid for kind=memory). Writes ONE immutable
#   file, commits it on the CURRENT branch, prints the repo-relative path.
#   Dedup: an existing <slug>-<sha8> match in the target dir is a no-op.
brain_atom_write() {
  local kind="${1:?brain_atom_write: kind required}" repo="${2:-}" slug="${3:?brain_atom_write: slug required}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_atom_write: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  slug="$(_brain_slugify "$slug")"

  local subdir
  case "$kind" in
    memory)  subdir="memory" ;;
    session) subdir="sessions" ;;
    handoff) subdir="handoffs" ;;
    *) echo "brain_atom_write: kind must be session|handoff|memory (got '$kind')" >&2; return 2 ;;
  esac

  local reldir
  if [ "$kind" = "memory" ] && { [ -z "$repo" ] || [ "$repo" = "-" ]; }; then
    repo=""
    reldir="memory"
  else
    [ -n "$repo" ] && [ "$repo" != "-" ] || { echo "brain_atom_write: kind '$kind' requires a repo name" >&2; return 2; }
    repo="$(_brain_slugify "$repo")"
    brain_ensure_ns "$repo" >/dev/null || return 1
    reldir="repos/$repo/$subdir"
  fi

  local body; body="$(cat)"
  [ -n "$body" ] || { echo "brain_atom_write: empty content on stdin" >&2; return 2; }
  local sha8; sha8="$(printf '%s' "$body" | _brain_sha8)"

  # Dedup: identical fact already recorded under this slug → no-op.
  local existing
  existing="$(ls "$d/$reldir/" 2>/dev/null | grep -F -- "-$slug-$sha8.md" | head -1 || true)"
  if [ -n "$existing" ]; then
    echo "brain: atom exists — $reldir/$existing (dedup, no-op)"
    printf '%s\n' "$reldir/$existing"
    return 0
  fi

  local ts host rel
  ts="$(_brain_utc)"; host="$(brain_host)"
  rel="$reldir/$ts-$host-$slug-$sha8.md"
  if [ -e "$d/$rel" ]; then
    # Same second + same host + same slug but different content cannot collide
    # (sha8 differs); an existing path here means a hash collision — refuse
    # rather than ever mutate an atom.
    echo "brain_atom_write: refusing to overwrite existing atom $rel" >&2
    return 1
  fi
  # BRAIN B5: optional code↔memory provenance, passed via env (existing callers
  # unaffected): BRAIN_CODE_REPO / BRAIN_CODE_BRANCH / BRAIN_CODE_SHA /
  # BRAIN_CODE_COMMITS (space-separated SHAs). Stamped into the frontmatter AND
  # as Code-* git trailers on the brain commit — what `brain_blame` greps.
  # Node mirror: writeAtom({code}) in runtime/src/core/brain.ts.
  local p_repo="${BRAIN_CODE_REPO:-}" p_branch="${BRAIN_CODE_BRANCH:-}" p_sha="${BRAIN_CODE_SHA:-}" p_commits="${BRAIN_CODE_COMMITS:-}"
  local p_any="$p_repo$p_branch$p_sha$p_commits"
  if [ -n "$p_any" ] && [ -z "$p_repo" ]; then p_repo="$repo"; fi
  {
    printf -- '---\n'
    printf 'kind: %s\n' "$kind"
    printf 'repo: %s\n' "${repo:-—}"
    printf 'slug: %s\n' "$slug"
    printf 'host: %s\n' "$host"
    printf 'written: %s\n' "$ts"
    if [ -n "$p_any" ]; then
      [ -n "$p_repo" ]    && printf 'code-repo: %s\n' "$(_brain_slugify "$p_repo")"
      [ -n "$p_branch" ]  && printf 'code-branch: %s\n' "$p_branch"
      [ -n "$p_sha" ]     && printf 'code-sha: %s\n' "$p_sha"
      [ -n "$p_commits" ] && printf 'code-commits: %s\n' "$p_commits"
    fi
    printf -- '---\n\n'
    printf '%s\n' "$body"
  } > "$d/$rel"
  git -C "$d" add "$rel"
  local msg="brain($kind): ${repo:-memory}/$slug"
  if [ -n "$p_any" ]; then
    msg="$msg
"
    [ -n "$p_repo" ]   && msg="$msg
Code-Repo: $(_brain_slugify "$p_repo")"
    [ -n "$p_branch" ] && msg="$msg
Code-Branch: $p_branch"
    [ -n "$p_sha" ]    && msg="$msg
Code-SHA: $p_sha"
    local c
    for c in $p_commits; do msg="$msg
Code-Commit: $c"; done
  fi
  git -C "$d" commit -q -m "$msg"
  printf '%s\n' "$rel"
}

# ── code↔memory provenance (BRAIN B5) ────────────────────────────────────────

# brain_capture_code <code-repo-dir> — export BRAIN_CODE_REPO/BRANCH/SHA from a
# code checkout, so the next brain_atom_write in this shell stamps provenance.
# Prints what it captured. Not a code repo → clears the vars, returns 1.
brain_capture_code() {
  local cd="${1:?brain_capture_code: code repo dir required}"
  if ! git -C "$cd" rev-parse --git-dir >/dev/null 2>&1; then
    unset BRAIN_CODE_REPO BRAIN_CODE_BRANCH BRAIN_CODE_SHA 2>/dev/null || true
    echo "brain_capture_code: $cd is not a git repo" >&2
    return 1
  fi
  BRAIN_CODE_REPO="$(basename "$(git -C "$cd" rev-parse --show-toplevel)")"
  BRAIN_CODE_BRANCH="$(git -C "$cd" rev-parse --abbrev-ref HEAD)"
  BRAIN_CODE_SHA="$(git -C "$cd" rev-parse HEAD)"
  export BRAIN_CODE_REPO BRAIN_CODE_BRANCH BRAIN_CODE_SHA
  echo "code: $BRAIN_CODE_REPO@$BRAIN_CODE_SHA ($BRAIN_CODE_BRANCH)"
}

# brain_note_code <code-repo-dir> <brain-commit> <atom-path> <code-sha>…
# Back-link code commits to a brain commit with git notes under
# refs/notes/myai-brain — zero code-HISTORY pollution (notes are a separate
# ref; `git log --notes=myai-brain` shows them, nothing else changes).
# Append (never overwrite): one code commit may relate to several brain commits.
brain_note_code() {
  local cd="${1:?brain_note_code: code repo dir required}"
  local bsha="${2:?brain_note_code: brain commit sha required}"
  local atom="${3:?brain_note_code: atom path required}"
  shift 3
  [ $# -gt 0 ] || { echo "brain_note_code: at least one code sha required" >&2; return 2; }
  local c noted=0
  for c in "$@"; do
    git -C "$cd" notes --ref=myai-brain append -m "myai-brain: $bsha $atom" "$c" 2>/dev/null && noted=$((noted+1))
  done
  echo "brain: noted $noted code commit(s) → brain $bsha (refs/notes/myai-brain)"
}

# brain_blame <code-sha | brain-ref> [limit]
# Forward (arg looks like a SHA): which brain commits reference that code
# commit — "what was the agent thinking when it produced X" (+ atom files to
# read). Reverse (arg is a brain ref, e.g. idea/<slug>): every code SHA that
# ref's commits recorded. Reads the Code-* trailers brain_atom_write stamps.
brain_blame() {
  local q="${1:?brain_blame: code sha or brain ref required}" limit="${2:-50}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_blame: no brain repo at $d" >&2; return 1; }
  local sha
  if printf '%s' "$q" | grep -qE '^[0-9a-f]{7,40}$'; then
    # code → brain: candidates via --grep, verified against the trailers.
    local hits=0
    for sha in $(git -C "$d" log --all -n $((limit * 4)) --format='%H' --grep="$q" 2>/dev/null); do
      git -C "$d" show -s --format='%B' "$sha" | grep -qE "^Code-(SHA|Commit): $q" || continue
      hits=$((hits+1)); [ "$hits" -gt "$limit" ] && break
      printf '%s\n' "$(git -C "$d" show -s --format='%h %aI %s' "$sha")"
      git -C "$d" show -s --format='%B' "$sha" | grep -E '^Code-' | sed 's/^/  /'
      git -C "$d" show --format= --name-only "$sha" 2>/dev/null \
        | grep -E '^(memory|repos/[^/]+/(sessions|handoffs))/.*\.md$' | sed 's/^/  atom: /'
    done
    [ "$hits" -gt 0 ] || { echo "brain_blame: no brain commit references code $q"; return 1; }
  else
    # brain → code: list recorded code SHAs for a brain ref.
    git -C "$d" rev-parse --verify --quiet "$q^{commit}" >/dev/null \
      || { echo "brain_blame: unknown ref '$q'" >&2; return 1; }
    local hits=0
    for sha in $(git -C "$d" log -n $((limit * 4)) --format='%H' "$q"); do
      git -C "$d" show -s --format='%B' "$sha" | grep -qE '^Code-' || continue
      hits=$((hits+1)); [ "$hits" -gt "$limit" ] && break
      printf '%s\n' "$(git -C "$d" show -s --format='%h %aI %s' "$sha")"
      git -C "$d" show -s --format='%B' "$sha" | grep -E '^Code-' | sed 's/^/  /'
    done
    [ "$hits" -gt 0 ] || { echo "brain_blame: no code provenance recorded on '$q'"; return 1; }
  fi
  return 0
}

# brain_stamp_code <code-repo-dir> <repo-ns> <slug> [code-sha…]   (content on stdin)
# The runner-facing one-shot (BRAIN B5): capture code provenance, write ONE
# session atom on a runner session branch, merge it to main (auto-distill),
# then git-notes-back-link each produced code commit to the brain commit.
# Prints "atom: <path>" + "brain: <main sha>". Never touches code history.
brain_stamp_code() {
  local cd="${1:?brain_stamp_code: code repo dir required}"
  local ns="${2:?brain_stamp_code: repo namespace required}"
  local slug="${3:?brain_stamp_code: slug required}"
  shift 3
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_stamp_code: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  local body; body="$(cat)"
  [ -n "$body" ] || { echo "brain_stamp_code: empty content on stdin" >&2; return 2; }

  brain_capture_code "$cd" >/dev/null || return 1
  BRAIN_CODE_COMMITS="$*"; export BRAIN_CODE_COMMITS
  brain_session_start runner >/dev/null || return 1
  local rel
  rel="$(printf '%s\n' "$body" | brain_atom_write session "$ns" "$slug" | tail -1)" || return 1
  local bsha; bsha="$(git -C "$d" rev-parse HEAD)"
  brain_session_merge >/dev/null || true
  unset BRAIN_CODE_COMMITS BRAIN_CODE_REPO BRAIN_CODE_BRANCH BRAIN_CODE_SHA 2>/dev/null || true
  echo "atom: $rel"
  echo "brain: $bsha"
  # shellcheck disable=SC2086
  [ $# -gt 0 ] && brain_note_code "$cd" "$bsha" "$rel" "$@"
  return 0
}

# ── session / idea branch lifecycle ──────────────────────────────────────────

# brain_session_start [profile] — create (or resume) today's session branch
# for this host+profile: session/<YYYYMMDD>-<host>-<profile>. Prints branch.
brain_session_start() {
  local profile; profile="$(_brain_slugify "${1:-${BRAIN_PROFILE:-cli}}")"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_session_start: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  local branch="session/$(date -u +%Y%m%d)-$(brain_host)-$profile"
  if git -C "$d" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$d" checkout -q "$branch"
  else
    git -C "$d" checkout -q main
    git -C "$d" checkout -q -b "$branch"
  fi
  printf '%s\n' "$branch"
}

# brain_session_merge [branch] — merge a session (or idea) branch into main
# (--no-ff so the session boundary survives in history) and delete it.
# Append-only atoms make this conflict-free by construction; if a conflict
# somehow occurs (compiled artifacts touched on both sides), abort + report.
brain_session_merge() {
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_session_merge: no brain repo at $d" >&2; return 1; }
  local branch="${1:-$(git -C "$d" rev-parse --abbrev-ref HEAD)}"
  case "$branch" in
    session/*|idea/*) ;;
    main) echo "brain_session_merge: already on main — nothing to merge" >&2; return 2 ;;
    *) echo "brain_session_merge: refusing to merge non-session branch '$branch'" >&2; return 2 ;;
  esac
  git -C "$d" show-ref --verify --quiet "refs/heads/$branch" \
    || { echo "brain_session_merge: no such branch '$branch'" >&2; return 1; }
  git -C "$d" checkout -q main
  if ! git -C "$d" merge -q --no-ff -m "brain(merge): $branch" "$branch" 2>/dev/null; then
    git -C "$d" merge --abort 2>/dev/null || true
    echo "brain_session_merge: CONFLICT merging $branch into main — left unmerged (atoms are append-only; check compiled artifacts)" >&2
    git -C "$d" checkout -q "$branch"
    return 1
  fi
  # idea/ branches are long-lived parallel thought — keep them after a merge.
  case "$branch" in
    session/*) git -C "$d" branch -q -D "$branch" ;;
  esac
  # Compile-at-write (BRAIN B3): the merge IS the write — regenerate the
  # compiled artifacts on main right here (extractive, zero LLM tokens).
  brain_distill || true
  echo "brain: merged $branch into main"
}

# ── compile-at-write distiller (BRAIN B3) ────────────────────────────────────
#
# brain_distill [ns …] — regenerate each namespace's compiled artifacts from
# its atoms and commit them to main: brief.md (~150 tok boot brief), working.md
# (~2k tok: latest handoff + recent sessions), rollup.md (one line per atom).
# EXTRACTIVE + deterministic (plain text work, no LLM) so it costs zero
# interactive tokens and runs anywhere. No args → every namespace. Reading the
# result needs NO server — plain files on main (git pull → read files).
# Node mirror: runtime/src/core/distill.ts (same artifact contract).
brain_distill() {
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_distill: no brain repo at $d" >&2; return 1; }
  [ -z "$(git -C "$d" status --porcelain)" ] \
    || { echo "brain_distill: working tree dirty — refusing" >&2; return 1; }
  local original; original="$(git -C "$d" rev-parse --abbrev-ref HEAD)"
  [ "$original" = "main" ] || git -C "$d" checkout -q main

  local targets nsdir
  targets="$*"
  if [ -z "$targets" ]; then
    for nsdir in "$d"/repos/*/; do
      [ -d "$nsdir" ] && targets="$targets $(basename "$nsdir")"
    done
  fi

  local ns atom first count=0
  for ns in $targets; do
    ns="$(_brain_slugify "$ns")"
    [ -d "$d/repos/$ns" ] || { echo "brain_distill: no namespace repos/$ns" >&2; continue; }
    count=$((count + 1))
    local sess_count hand_count latest
    sess_count="$(ls "$d/repos/$ns/sessions/" 2>/dev/null | grep -c '\.md$' || true)"
    hand_count="$(ls "$d/repos/$ns/handoffs/" 2>/dev/null | grep -c '\.md$' || true)"
    latest="$(ls "$d/repos/$ns/handoffs/" 2>/dev/null | grep '\.md$' | sort | tail -1)"
    if [ -n "$latest" ]; then latest="$d/repos/$ns/handoffs/$latest"
    else
      latest="$(ls "$d/repos/$ns/sessions/" 2>/dev/null | grep '\.md$' | sort | tail -1)"
      [ -n "$latest" ] && latest="$d/repos/$ns/sessions/$latest"
    fi

    # brief.md — ~150-token boot brief: counts line + latest handoff, flattened.
    {
      printf '# %s — boot brief\n\n' "$ns"
      printf '_%s sessions · %s handoffs · distilled from atoms on main._\n\n' "$sess_count" "$hand_count"
      if [ -n "$latest" ] && [ -f "$latest" ]; then
        _brain_strip_fm "$latest" | tr '\n' ' ' | sed 's/  */ /g;s/^ *//;s/ *$//' | cut -c1-560
        printf '\n'
      else
        printf '_No atoms yet — commit session/handoff atoms and merge to fill this._\n'
      fi
    } > "$d/repos/$ns/brief.md"

    # working.md — latest handoff verbatim + last 5 sessions, capped ~8000 chars.
    {
      printf '# %s — working context\n\n' "$ns"
      if [ -n "$latest" ] && [ -f "$latest" ]; then
        printf '## Latest handoff\n\n'
        _brain_strip_fm "$latest"
        printf '\n'
      fi
      local recent
      recent="$(ls "$d/repos/$ns/sessions/" 2>/dev/null | grep '\.md$' | sort -r | head -5)"
      if [ -n "$recent" ]; then
        printf '## Recent sessions (newest first)\n\n'
        for atom in $recent; do
          printf '### %s\n\n' "$atom"
          _brain_strip_fm "$d/repos/$ns/sessions/$atom" | head -20
          printf '\n'
        done
      fi
    } | head -c 8000 > "$d/repos/$ns/working.md"

    # rollup.md — one line per atom (full index of the namespace's history).
    {
      printf '# %s — rollup\n\n' "$ns"
      local kind adir
      for kind in sessions handoffs; do
        adir="$d/repos/$ns/$kind"
        [ -d "$adir" ] || continue
        for atom in $(ls "$adir" 2>/dev/null | grep '\.md$' | sort -r); do
          first="$(_brain_strip_fm "$adir/$atom" | tr '\n' ' ' | sed 's/  */ /g' | cut -c1-120)"
          printf -- '- %s %s — %s\n' "$kind" "$atom" "$first"
        done
      done
    } > "$d/repos/$ns/rollup.md"
  done

  if [ -n "$(git -C "$d" status --porcelain -- repos)" ]; then
    git -C "$d" add repos
    git -C "$d" commit -q -m "brain(distill): compiled brief/working/rollup"
    echo "brain: distilled $count namespace(s) onto main"
  fi
  [ "$original" = "main" ] || git -C "$d" checkout -q "$original"
  return 0
}

# Strip the leading `---` frontmatter block from an atom file (prints the body).
_brain_strip_fm() {
  awk 'NR==1 && $0=="---" {fm=1; next} fm==1 {if ($0=="---") fm=2; next} {print}' "$1"
}

# brain_idea <slug> — create (or resume) a long-lived idea branch off main.
brain_idea() {
  local slug; slug="$(_brain_slugify "${1:?brain_idea: slug required}")"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_idea: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  local branch="idea/$slug"
  if git -C "$d" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$d" checkout -q "$branch"
  else
    git -C "$d" checkout -q main
    git -C "$d" checkout -q -b "$branch"
  fi
  printf '%s\n' "$branch"
}

# ── B8 git verbs: stash / pop / checkout / diff / revert ─────────────────────
#
# The `myai brain` git-muscle-memory surface (plan/jam/brain-layer.md keywords).
# Node mirror: the B2 ops in runtime/src/core/brain.ts (brainStash/brainPop/
# brainCheckout/brainDiff/brainRevert) — both sides honor the same contract:
# never force-push, never rewrite history, never edit an existing atom.

_brain_require_clean() {
  local d; d="$(brain_dir)"
  [ -z "$(git -C "$d" status --porcelain)" ] \
    || { echo "brain: working tree is dirty — brain ops always commit; refusing to proceed" >&2; return 1; }
}

# brain_stash <slug> [repo]   (content on stdin)
# Freeze a context payload so ANY later session can resume it. NOT `git stash`
# (local, ref-based, invisible elsewhere): a FILE under stash/ committed
# straight to main, so any session — different branch, host, agent — sees it
# after a plain pull and can pop it. Dedup: identical payload already frozen
# is a no-op. Prints the stash path.
brain_stash() {
  local slug="${1:?brain_stash: slug required}" repo="${2:-}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_stash: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  slug="$(_brain_slugify "$slug")"
  [ -n "$slug" ] || { echo "brain_stash: slug required" >&2; return 2; }
  local body; body="$(cat)"
  [ -n "$body" ] || { echo "brain_stash: empty content on stdin" >&2; return 2; }
  # Content hash in the filename (same contract as atoms): same-second stashes
  # with different payloads can never collide on a path.
  local sha8; sha8="$(printf '%s' "$body" | _brain_sha8)"
  # Dedup: identical payload already frozen under this slug (any timestamp/host)
  # → no-op, same as atoms.
  local existing
  existing="$(git -C "$d" ls-tree --name-only main stash/ 2>/dev/null | grep -F -- "-$slug-$sha8.md" | head -1 || true)"
  if [ -n "$existing" ]; then
    echo "brain: stash exists — $existing (dedup, no-op)" >&2
    printf '%s\n' "$existing"
    return 0
  fi
  local rel="stash/$(_brain_utc)-$(brain_host)-$slug-$sha8.md"
  _brain_require_clean || return 1
  local from; from="$(git -C "$d" rev-parse --abbrev-ref HEAD)"
  [ "$from" = "main" ] || git -C "$d" checkout -q main
  mkdir -p "$d/stash"
  {
    printf -- '---\n'
    printf 'slug: %s\n' "$slug"
    printf 'repo: %s\n' "${repo:+$(_brain_slugify "$repo")}"
    printf 'from: %s\n' "$from"
    printf 'host: %s\n' "$(brain_host)"
    printf 'written: %s\n' "$(_brain_utc)"
    printf -- '---\n\n'
    printf '%s\n' "$body"
  } > "$d/$rel"
  git -C "$d" add "$rel"
  git -C "$d" commit -q -m "brain(stash): $slug"
  [ "$from" = "main" ] || git -C "$d" checkout -q "$from"
  echo "brain: stashed '$slug' on main — pop from any session/device" >&2
  printf '%s\n' "$rel"
}

# brain_stash_list — stash paths visible on main, newest first (by stash-commit
# order — filenames only have second precision, so they can't order
# same-second stashes). Empty output (rc 0) when there are none.
brain_stash_list() {
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || return 0
  git -C "$d" rev-parse --verify --quiet "main:stash" >/dev/null 2>&1 || return 0
  local alive added p
  alive="$(git -C "$d" ls-tree --name-only main stash/ 2>/dev/null | grep '\.md$' || true)"
  added="$(git -C "$d" log main --diff-filter=A --name-only --format= -- stash/ 2>/dev/null | grep '\.md$' || true)"
  for p in $added; do
    printf '%s\n' "$alive" | grep -qxF "$p" && printf '%s\n' "$p"
  done
  return 0
}

# brain_pop [slug] — pop the newest stash (or the newest matching slug): print
# the frozen file (frontmatter + payload) to stdout and remove the entry from
# main with a normal commit. Nothing is ever rewritten.
brain_pop() {
  local wanted="${1:-}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_pop: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  [ -n "$wanted" ] && wanted="$(_brain_slugify "$wanted")"
  local p s entry=""
  for p in $(brain_stash_list); do
    if [ -z "$wanted" ]; then entry="$p"; break; fi
    # Slug comes from frontmatter, not the filename — hostnames may contain
    # dashes, which makes filename parsing ambiguous.
    s="$(git -C "$d" show "main:$p" 2>/dev/null | sed -n 's/^slug: //p' | head -1)"
    [ "$s" = "$wanted" ] && { entry="$p"; break; }
  done
  [ -n "$entry" ] || { echo "brain_pop: no stash${wanted:+ matching '$wanted'} to pop" >&2; return 1; }
  local raw; raw="$(git -C "$d" show "main:$entry")"
  _brain_require_clean || return 1
  local from; from="$(git -C "$d" rev-parse --abbrev-ref HEAD)"
  [ "$from" = "main" ] || git -C "$d" checkout -q main
  git -C "$d" rm -q "$entry"
  git -C "$d" commit -q -m "brain(pop): ${entry#stash/}"
  [ "$from" = "main" ] || git -C "$d" checkout -q "$from"
  echo "brain: popped $entry" >&2
  printf '%s\n' "$raw"
}

# brain_checkout <ref> — check out main or an existing session/idea branch.
# Only the managed families are checkoutable; requires a clean tree.
brain_checkout() {
  local ref="${1:?brain_checkout: ref required (main | session/* | idea/*)}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_checkout: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  case "$ref" in
    main|session/?*|idea/?*) ;;
    *) echo "brain_checkout: refusing checkout of '$ref' — only main, session/* or idea/*" >&2; return 2 ;;
  esac
  git -C "$d" show-ref --verify --quiet "refs/heads/$ref" \
    || { echo "brain_checkout: no such branch '$ref'" >&2; return 1; }
  _brain_require_clean || return 1
  git -C "$d" checkout -q "$ref"
  printf '%s\n' "$ref"
}

# brain_diff [from] [to] — what <to> has that <from> doesn't (default
# main..HEAD: "what has this session added that main doesn't have yet").
brain_diff() {
  local from="${1:-main}" to="${2:-HEAD}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_diff: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  local ref
  for ref in "$from" "$to"; do
    git -C "$d" rev-parse --verify --quiet "$ref^{commit}" >/dev/null \
      || { echo "brain_diff: unknown ref '$ref'" >&2; return 1; }
  done
  echo "brain diff: $from..$to"
  git -C "$d" diff --name-status "$from..$to"
  git -C "$d" diff --shortstat "$from..$to"
  return 0
}

# brain_revert <sha> — undo a commit with an inverse commit (history is never
# rewritten — atoms stay append-only; the revert itself is a new commit).
# Merge commits revert against their first parent. Conflict → abort, rc 1.
brain_revert() {
  local sha="${1:?brain_revert: commit sha required}"
  local d; d="$(brain_dir)"
  brain_is_repo "$d" || { echo "brain_revert: no brain repo at $d — run 'myai brain init'" >&2; return 1; }
  git -C "$d" rev-parse --verify --quiet "$sha^{commit}" >/dev/null \
    || { echo "brain_revert: unknown commit '$sha'" >&2; return 1; }
  _brain_require_clean || return 1
  local full parents ok=0
  full="$(git -C "$d" rev-parse "$sha^{commit}")"
  parents="$(git -C "$d" rev-list --parents -n1 "$full" | wc -w | tr -d ' ')"
  if [ "$parents" -gt 2 ]; then
    git -C "$d" revert --no-edit -m 1 "$full" >/dev/null 2>&1 && ok=1
  else
    git -C "$d" revert --no-edit "$full" >/dev/null 2>&1 && ok=1
  fi
  if [ "$ok" != "1" ]; then
    git -C "$d" revert --abort 2>/dev/null || true
    echo "brain_revert: CONFLICT reverting $sha — aborted, brain unchanged" >&2
    return 1
  fi
  echo "brain: reverted $full → $(git -C "$d" rev-parse HEAD) (inverse commit)"
}

# ── status ───────────────────────────────────────────────────────────────────

brain_status() {
  local d; d="$(brain_dir)"
  if ! brain_is_repo "$d"; then
    echo "brain: NOT INITIALIZED (would live at $d) — run 'myai brain init'"
    return 1
  fi
  local branch atoms_m atoms_s atoms_h nss last
  branch="$(git -C "$d" rev-parse --abbrev-ref HEAD)"
  atoms_m="$(find "$d/memory" -name '*.md' -not -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')"
  atoms_s="$(find "$d/repos" -path '*/sessions/*.md' 2>/dev/null | wc -l | tr -d ' ')"
  atoms_h="$(find "$d/repos" -path '*/handoffs/*.md' 2>/dev/null | wc -l | tr -d ' ')"
  nss="$(find "$d/repos" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')"
  last="$(git -C "$d" log -1 --format='%h %s (%cr)' 2>/dev/null)"
  echo "brain: $d"
  echo "  branch:     $branch"
  echo "  namespaces: $nss"
  echo "  atoms:      $atoms_s sessions · $atoms_h handoffs · $atoms_m memory"
  echo "  last:       ${last:-—}"
  local br
  br="$(git -C "$d" for-each-ref --format='%(refname:short)' 'refs/heads/session/*' 'refs/heads/idea/*' 2>/dev/null | tr '\n' ' ')"
  [ -n "$br" ] && echo "  branches:   $br"
  local st
  st="$(brain_stash_list | grep -c . || true)"
  [ "$st" != "0" ] && echo "  stashes:    $st waiting (resume with 'myai brain pop')"
  return 0
}
