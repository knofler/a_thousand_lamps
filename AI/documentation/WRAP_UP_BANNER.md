# Wrap Up Banner (MANDATORY on every session close)

The `wrap up` keyword MUST end with this ASCII banner as the **final output**. Fill in values dynamically from git and session context. This makes it instantly visible when scrolling back to a closed session.

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗     ║
║   ██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗   ║
║   ██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██║  ██║   ║
║   ██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██║  ██║   ║
║   ╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██████╔╝   ║
║    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═════╝    ║
║                                                                  ║
║          ██╗   ██╗██████╗     ██╗                                ║
║          ██║   ██║██╔══██╗    ██║                                ║
║          ██║   ██║██████╔╝    ██║                                ║
║          ██║   ██║██╔═══╝     ╚═╝                                ║
║          ╚██████╔╝██║         ██╗                                ║
║           ╚═════╝ ╚═╝         ╚═╝                                ║
║                                                                  ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║   🟢 REPO:     {folder name} ({standalone/master/sub-repo})      ║
║   🟢 BRANCH:   {current git branch}                              ║
║   🟢 REMOTE:   {git remote url}                                  ║
║   🟢 SESSION:  {CLI/Mobile} ({hostname})                         ║
║   🟢 WRAPPED:  {YYYY-MM-DD HH:MM UTC}                            ║
║                                                                  ║
║   🟢 PRs:      {any PRs merged this session, or "none"}          ║
║   🟢 STATUS:   {summary — e.g. "All green — nothing pending"}    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```
