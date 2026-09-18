@AGENTS.md

## Claude Code only

- Skills come with the checkout in `.claude/skills/`. Issue work goes through `/mass-issue-implement`; the flow is in `dev/docs/github-project.md`.
- Claude Code web (`CLAUDE_CODE_REMOTE=true`): the session already owns its branch and can only push to it. Never create or switch branches; `pnpm start-issue` detects the session and only assigns the issue. Dependencies are installed by the `SessionStart` hook in `.claude/settings.json`.
- Official docs via Context7: `mcp__context7__query-docs`.
