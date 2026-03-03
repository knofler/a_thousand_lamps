# Global AI Management Initialization Prompt

**Objective:** Standardize multi-agent workflows and project state tracking across all repositories.

**Instructions for the Agent:**
1. **Locate or Create AI Folder:** Check if a `./AI` folder exists at the root of the project workspace. If not, create it.
2. **Setup Subdirectories:** Ensure the following subdirectories exist:
   - `AI/design/`
   - `AI/architecture/`
   - `AI/documentation/`
   - `AI/plan/`
3. **Initialize Core Files:** Copy or create the following management files from the master template:
   - `AI/AI_RULES.md`: Global rules and tech stack preferences. **Must include the following standards:**
     - **Containerization:** All apps built using Docker and Docker Compose (App, API, MongoDB).
     - **Frontend:** Always Next.js.
     - **API Hosting:** Render.com.
     - **CI/CD:** GitHub Actions with `vercel.json` and env management.
     - **Repository:** Must be a git repo with all ignore files (`.gitignore`, `.dockerignore`) and example files (`.env.example`).
     - **Documentation:** Detailed docs, code comments, and `README.md`.
   - `AI/STATE.md`: Current project progress and next steps.
   - `AI/AI_AGENT_HANDOFF.md`: Detailed pick-up instructions for the next agent.
   - `AI/Instruction.md`: Workflow and usage guide.
   - `AI/gemini.md`, `AI/claude.md`, `AI/copilot.md`: Agent-specific logs.
4. **Follow Workflow:**
   - Always read the `STATE.md` and `AI_AGENT_HANDOFF.md` files located in the `AI/` directory at the root of the workspace before starting.
   - Update your agent-specific log (`AI/[agent].md`) and `AI/STATE.md` after every significant task.
   - Create new, timestamped files in subdirectories for new plans or designs to keep context focused.
5. **Goal:** Ensure a seamless transition between different AI agents and maintain a high-quality, documented codebase.

*Copy this folder structure to every new repository you join to maintain continuity.*
