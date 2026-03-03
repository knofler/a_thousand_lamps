# AI Agent Workflow Instructions

## Getting Started
1. **Read Handoff First:** Immediately read the `STATE.md` and `AI_AGENT_HANDOFF.md` files located in the `AI/` directory at the root of the workspace to understand the current project status and objectives.
2. **Review Rules:** Familiarize yourself with `AI/AI_RULES.md` for architectural and code quality standards.
3. **Check Plans:** Look into `AI/plan/` for context-specific implementation roadmaps.
4. **Codebase Exploration:** Use `grep_search` and `glob` to map the relevant parts of the codebase before making changes.

## Bootstrapping & Managing Projects
When asked to bootstrap a project using `./init_ai.sh`:
1. Execute the script targeting the provided directory. This will automatically add the target directory to `managed_repos.txt`.
2. Ask the user if the target directory is a **New Project** or an **Existing Project**.
3. Based on their answer, output the exact copy-pasteable prompt for **Step 2: Option A** or **Step 2: Option B** from the master `README.md`.

## ⚠️ MANDATORY: Autonomous Framework Sync
If you make ANY changes to the core global files in this master repository (e.g., `AI_RULES.md`, `Instruction.md`, `INTEGRATION_GUIDE.md`, or `global_ai_management_prompt.md`), you MUST autonomously run `./update_all.sh` immediately afterwards.
This ensures all projects listed in `managed_repos.txt` stay synchronized with the latest global rules.

## ⚠️ MANDATORY: Autonomous State Tracking
You are required to **autonomously** maintain the project state. Do NOT wait for the user to tell you to "save state" or "update logs".
- **After EVERY task or sub-task:** Automatically update your specific log file (`AI/gemini.md`, `AI/claude.md`, or `AI/copilot.md`) with a timestamp and what was just done.
- **Continuous State Sync:** Automatically update `AI/STATE.md` with the current progress and next steps before you finish your response to the user. **Do not wait for the end of the session.**

## Atomic Documentation
When creating or updating plans, designs, or architecture docs, prefer creating new, timestamped files in the respective subdirectories (`AI/plan/`, `AI/design/`, etc.) instead of maintaining one massive file. This preserves history and reduces context overhead.

## Handoff Procedure
When the user explicitly asks to "prepare for handoff" or switch agents:
1. Do a final verification of `AI/STATE.md` to ensure it captures the exact stopping point.
2. Overwrite `AI/AI_AGENT_HANDOFF.md` with specific, actionable instructions for the next agent to pick up seamlessly.
3. If requested, ensure all changes are committed to Git.

## Management Files
- **claude.md**: Log for Claude's actions.
- **copilot.md**: Log for Copilot's actions.
- **gemini.md**: Log for Gemini's actions (you).
- **global_ai_management_prompt.md**: The master instruction set for initializing this folder structure.
