---
name: session-start
description: "Start a work session by reading project state, assessing status, identifying blockers, and determining next priority. Triggers: start session, session start, begin work, what should I work on, status check"
---

# Session Start

Bootstrap a work session with full project context.

## Playbook

### 1. Read Project State

- Read `AI/state/STATE.md` for current project status.
- Read `AI/state/AI_AGENT_HANDOFF.md` for context from the previous session.
- Note the last update timestamp in each file.

### 2. Read Rules and Constraints

- Read `AI/documentation/AI_RULES.md` for tech mandates and constraints.
- Note any rules that affect today's planned work.

### 3. Assess Current Status

- List what was completed in the last session.
- List what is currently in progress.
- Identify any items marked as blocked.

### 4. Identify Blockers

- For each blocker, note the type: technical, dependency, or resource.
- Check if any blockers have been resolved since last session.
- Flag any new blockers discovered during state review.

### 5. Determine Next Priority

- Review the current milestone and its remaining deliverables.
- Pick the highest-priority unblocked item.
- If multiple items are equal priority, prefer the one on the critical path.

### 6. Output Session Briefing

Present a concise briefing to the user:

```
## Session Briefing — [date]

### Last Session Summary
- ...

### Current Status
- In progress: ...
- Blocked: ...

### Today's Priority
1. [Top priority item]
2. [Secondary item]

### Blockers
- [blocker] — [proposed resolution]

### Relevant Rules
- [any documentation/AI_RULES.md constraints that apply]
```

Log session start to `logs/claude_log.md` with timestamp.
