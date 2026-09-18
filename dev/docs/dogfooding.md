# Dogfooding and skills in development

The repository uses its own skills. The `mass-*` skills of the catalog are installed by
`mass-skills` into `.claude/skills/` (Claude Code) and `.agents/skills/` (Cursor, Codex,
Copilot, OpenCode, Gemini CLI, Cline), tracked in `mass-skills.lock.json`. All three are
committed.

## Installing and updating

Never install into those folders by hand or with `npx skills add`. Use the published package,
from the repository root:

```sh
npx @mass-solutions/skills-cli install <skill>     # add or reinstall one skill
npx @mass-solutions/skills-cli update              # after a release
npx @mass-solutions/skills-cli doctor              # check the installed copies
```

For a skill that is not in the latest tag yet, add `--ref main`.

## Developing a new skill

A new skill is born in `.claude/skills/<name>/`, inside the repository and committed, before it
enters the catalog. That is where it is tested (skill-creator, evals in `evals/`).

Publishing it:

1. Copy the folder to `skills/<name>/`.
2. Pass the validator (`pnpm check`) and run `pnpm registry`.
3. Open the pull request.
4. After the release, reinstall it into `.claude/skills/` and `.agents/skills/` with the CLI so
   the lockfile tracks it.

## Parity

No test requires parity between `skills/`, the lockfile and the installed folders: the former
`test/repo/dogfood.test.ts` was removed on 2026-09-17 to allow this flow.
`npx @mass-solutions/skills-cli doctor` is the check.
