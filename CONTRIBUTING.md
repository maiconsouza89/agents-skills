# Contributing

Thanks for your interest. This catalog is small on purpose: every skill has an owner, a version and a review date, and everything goes through the validator before it gets in.

## Issue first

- **External contributions**: open an issue with the *Skill proposal* template (new skill) or *Skill bug* template (defect). A pull request is only opened after a maintainer agrees on the issue. A PR without a linked, approved issue is closed with a redirect to the template; that is not a rejection of the idea.
- **Repository members** open PRs directly, still linking the issue when one exists.

This policy comes from a lesson documented by other catalogs: automated PRs in volume consume the review before it happens.

## Workflow

1. `pnpm install`
2. Repository members: `pnpm start-issue <number>` creates a branch for the issue and assigns it to you; the `project-board` workflow moves it to In Progress on the board.
4. `pnpm new-skill mass-<slug>` creates `skills/mass-<slug>/SKILL.md` and `README.md` already in the contract.
5. Write the skill in English. `mass-skill-authoring` (in `skills/`) describes the contract; `skills/mass-skill-authoring/references/skill-contract.md` lists every validator rule.
6. `pnpm check` runs the validator, checks `skills-registry.json` and runs the tests. A finding is printed as `<rule> <file>:<line> <message>`; fix all of them.
7. `pnpm registry` regenerates `skills-registry.json` whenever any skill file changes; the file is committed.
8. Open the PR with the template filled in and the issue linked.

## Review and versioning

- `metadata.reviewed` gets today's date (`YYYY-MM-DD`) on every content change to the skill. A skill not reviewed in more than 90 days shows up in the weekly *Stale skills* issue.
- `metadata.version` follows semver: patch for wording, minor for a new step or reference, major when the trigger scope (`Use when` / `Do NOT use for`) changes.
- A retired skill leaves the folder and enters `skills/_deprecated.json` with `since`, `replacedBy` and `reason`; the CLI refuses to install it and points at the replacement, and never removes anything from those who already have it.

## Commits

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<type>(<scope>): <description>`, imperative, lowercase, no trailing period. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`. Examples: `feat(skills): add mass-release-checklist`, `docs(skills): clarify mass-code-review report format`.

## Security

Never include secrets, binaries, downloads piped into a shell, or instructions that ask the agent to hide something from the user. The validator and Snyk Agent Scan block the PR; the full policy is in [SECURITY.md](SECURITY.md).
