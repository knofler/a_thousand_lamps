#!/usr/bin/env python3
"""Trim AI_AGENT_HANDOFF.md down to a bounded hot-tier (TOKEN-OPT 1).

The handoff grows unbounded — one `> ` session line is prepended per close, and
it is re-read on EVERY `agent mode` / `wrap up`. This archives the middle of the
session history while ALWAYS preserving:

  * the header block (title + `> Workspace root:` line)
  * the top N most-recent `> ` session lines (default 3)
  * the meta lines (`> Last agent/machine/Mobile branches/Last work/Last session`)
  * the ENTIRE `**ACTION for next agent:**` section (the forward-looking record)

Archived content is APPENDED to the archive file — never deleted. Safe by
construction: if the ACTION section is missing or there is nothing to archive it
is a no-op, so it can never destroy the file.

Usage:  trim_handoff.py <handoff_path> <archive_path> [keep_sessions=3]
Exit 0 always (no-op or trim). Prints a one-line result.
"""
import os
import sys
import datetime

META_PREFIXES = (
    "> Last agent", "> Last machine", "> Mobile branches",
    "> Last work", "> Last session",
)
ACTION_MARKER = "**ACTION for next agent:**"


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: trim_handoff.py <handoff> <archive> [keep_sessions]")
        return 0
    handoff, archive = sys.argv[1], sys.argv[2]
    keep_n = int(sys.argv[3]) if len(sys.argv) > 3 else int(os.environ.get("HANDOFF_KEEP_SESSIONS", "3"))

    if not os.path.isfile(handoff):
        print("no-op: handoff not found")
        return 0
    with open(handoff, encoding="utf-8") as fh:
        lines = fh.readlines()

    # ACTION section is mandatory — if absent, refuse to touch the file.
    action_idx = next((i for i, ln in enumerate(lines) if ln.startswith(ACTION_MARKER)), None)
    if action_idx is None:
        print("no-op: no ACTION section — refusing to trim")
        return 0

    # Header ends after the `> Workspace root:` line (fallback: first line).
    header_end = next((i + 1 for i, ln in enumerate(lines) if ln.startswith("> Workspace root")), 1)

    mid = lines[header_end:action_idx]
    keep_mid, archive_mid = [], []
    sessions_kept = 0
    for ln in mid:
        if any(ln.startswith(p) for p in META_PREFIXES):
            keep_mid.append(ln)                      # meta — always keep
        elif ln.startswith("> "):
            if sessions_kept < keep_n:
                keep_mid.append(ln)                  # top-N recent sessions
                sessions_kept += 1
            else:
                archive_mid.append(ln)               # older session history → archive
        elif ln.strip() == "":
            keep_mid.append(ln)                       # structural blank
        else:
            archive_mid.append(ln)                    # ARCHIVED-* prose blocks → archive

    if not "".join(archive_mid).strip():
        print("no-op: nothing to archive")
        return 0

    os.makedirs(os.path.dirname(archive) or ".", exist_ok=True)
    stamp = os.environ.get("TRIM_STAMP") or datetime.date.today().isoformat()
    with open(archive, "a", encoding="utf-8") as fh:
        fh.write(f"\n\n## Handoff trim {stamp}\n\n")
        fh.write("".join(a for a in archive_mid if a.strip()))

    # Collapse any run of blank lines the removal left behind.
    rebuilt = lines[:header_end] + keep_mid + lines[action_idx:]
    out, blank = [], False
    for ln in rebuilt:
        if ln.strip() == "":
            if blank:
                continue
            blank = True
        else:
            blank = False
        out.append(ln)
    with open(handoff, "w", encoding="utf-8") as fh:
        fh.writelines(out)

    print(f"trimmed: archived {len([a for a in archive_mid if a.strip()])} lines → {archive} "
          f"(kept {sessions_kept} recent sessions + ACTION)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
