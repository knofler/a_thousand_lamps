---
name: session-close
description: "Close a work session by summarizing accomplishments, updating state/STATE.md, writing handoff context to state/AI_AGENT_HANDOFF.md, and logging to logs/claude_log.md. Triggers: end session, session close, wrap up, save state, handoff"
---

# Session Close

Wrap up the current work session and persist all context.

## Playbook

### 1. Summarize Accomplishments

- List everything completed in this session.
- List anything started but not finished.
- Note any decisions made or direction changes.

### 2. Update state/STATE.md

- Open `AI/state/STATE.md`.
- Move completed items to the done section.
- Update in-progress items with current status.
- Add any new items discovered during the session.
- Update the `Last Updated` timestamp.

### 3. Update state/AI_AGENT_HANDOFF.md

- Open `AI/state/AI_AGENT_HANDOFF.md`.
- Update the `Last machine:` field with the current hostname (`hostname -s`).
- Write context the next session needs to pick up seamlessly:
  - What was the focus of this session?
  - What is the immediate next step?
  - Are there any open questions or pending decisions?
  - Any gotchas or non-obvious context?

### 4. Log to logs/claude_log.md

Append an entry to `logs/claude_log.md`:

```
## [YYYY-MM-DD HH:MM] — Session Close

### Completed
- ...

### In Progress
- ...

### Next Session
- ...

### Decisions
- ...
```

### 5. SONA Pattern Training

Run end-of-session pattern training:

- **Score reused patterns**: For each pattern from SONA context that was used this session:
  - If it helped: `source memory/lib/sona.sh && sona_score_pattern <id> success`
  - If it didn't apply: `source memory/lib/sona.sh && sona_score_pattern <id> failure`
- **Extract new patterns**: For any non-obvious technique or lesson learned:
  - Create pattern JSON following `memory/patterns/SCHEMA.md` format
  - Save via: `source memory/lib/sona.sh && sona_extract_pattern '<json>'`
  - Good candidates: debugging breakthroughs, configuration gotchas, workflow improvements
- **Prune if needed** (every ~10 sessions): `source memory/lib/sona.sh && sona_prune`
- **Stats**: `source memory/lib/sona.sh && sona_stats`

The Stop hook (`hooks/stop/02-sona-session-train.sh`) will also remind about this step.

### 6. Re-embed state into RAG

After STATE.md / AI_AGENT_HANDOFF.md are written, call `memory_reindex` via the MCP gateway so the new session block is searchable through `memory_search` immediately. Best-effort — failure is non-fatal (file write is the source of truth; rotation guard re-runs it on next `agent mode` anyway).

```bash
curl -sf -X POST http://localhost:3100/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"memory_reindex","arguments":{"scope":"master"}}}' \
  | jq -r '.result.content[0].text // "memory_reindex skipped (gateway down)"' \
  || echo "memory_reindex skipped (gateway unreachable)"
```

Expected: `totals.stored` counts the freshly-added chunks (typically 1–2 — the new session block + handoff change). Idempotent via content-hash dedup, so reruns are safe.

### 7. Final Checks

- Verify state/STATE.md was saved successfully.
- Verify state/AI_AGENT_HANDOFF.md was saved successfully.
- Verify logs/claude_log.md was appended to (not overwritten).
- Confirm to the user that state has been persisted.

### 8. Output

Present a brief summary to the user:

```
Session closed. State saved.

**Done this session:**
- ...

**Next session should start with:**
- ...
```
