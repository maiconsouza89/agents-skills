# GitHub Project workflow

Roadmap: [Project #5](https://github.com/users/maiconsouza89/projects/5), with the fields
`Priority` (P0/P1/P2/Backlog), `Area` (CLI/Core/Site/CI/Catalog) and `Complexity`
(Low/Medium/High). Large work becomes sub-issues linked with *blocked by*.

Writes to the Project are done by workflows with `PROJECT_TOKEN` (web sessions cannot reach the
Projects API).

## Starting an issue

Run `pnpm start-issue <N>` before anything else. It creates or reuses the branch and assigns the
issue; `project-board.yml` moves it to In Progress. If you forgot, run it as soon as you notice.

## Implementing an issue

Use the `mass-issue-implement` skill (`/mass-issue-implement` in Claude Code). It comes with the
checkout in `.claude/skills/mass-issue-implement`; follow its `SKILL.md`. Do not implement an
issue without it. If the folder is missing, reinstall it with
`npx @mass-solutions/skills-cli install mass-issue-implement` (see `dogfooding.md`), never with
`npx skills add`.

The skill is mandatory in Claude Code web: the environment is ephemeral, the chat is lost when
the session ends, and only what is on the issue and the pull request survives. The skill records
the plan, the decisions and the delivery as comments on the issue.

### Claude Code web sessions

With `CLAUDE_CODE_REMOTE=true` the session is born on its own branch and can only push to it.
Do not create or switch branches; `pnpm start-issue` detects the session, keeps the current
branch and only assigns the issue. Dependencies are installed by the `SessionStart` hook in
`.claude/settings.json`; the skills are already in the checkout.

## Triage

`triage.yml` runs when an issue is opened. `claude-code-action` classifies with `Read` only
(the issue, the rubrics of `mass-issue-priority` and `mass-issue-complexity`, and the Area rule
below) and returns JSON through `--json-schema`; a step validates the values, writes the three
fields and comments `Triage: ...`. To triage again: "Re-run workflow" in the Actions tab or
`gh workflow run triage.yml -f issue=<N>`. Manual adjustments go through the dropdowns on the
board.

## Area rule

The Area follows the prefix of the issue title:

| Prefix | Area |
|---|---|
| `cli:` | CLI |
| `core:`, `mcp:` | Core |
| `site:` | Site |
| `ci:`, `release:` | CI |
| `catalog:`, `skill:` | Catalog |

With `tools:`, `docs:` or no prefix, decide by the paths mentioned in the body, counting
`tools/` and `.github/` as CI.

## Pull requests

Pull requests carry `Closes #N` (the template already does). Merge by squash.

## Without `gh`

The scripts in `tools/` fall back to `fetch` with `GH_TOKEN`/`GITHUB_TOKEN`; with neither, use
the GitHub MCP.
