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

### 5. Final Checks

- Verify state/STATE.md was saved successfully.
- Verify state/AI_AGENT_HANDOFF.md was saved successfully.
- Verify logs/claude_log.md was appended to (not overwritten).
- Confirm to the user that state has been persisted.

### 6. Output

Present a brief summary to the user:

```
Session closed. State saved.

**Done this session:**
- ...

**Next session should start with:**
- ...
```
