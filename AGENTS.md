# AGENTS.md

`agents-skills` (maiconsouza89/agents-skills): the public catalog of Mass Solutions Agent Skills,
with its validator, registry, `mass-skills` CLI and bilingual site. This file is the single source
of rules for coding agents; `CLAUDE.md` imports it. Long material lives in `dev/docs/`.

## Layout

pnpm monorepo:

- `skills/` — the catalog, one folder per skill
- `packages/core` — `@mass-solutions/skills-core`: parse, validation, hash, registry
- `packages/cli` — `mass-skills`
- `apps/site` — Astro, EN and PT
- `tools/` — repository scripts
- `dev/docs/` — maintainer docs (index in `dev/docs/README.md`)
- `dev/docs/adr/` — Architecture Decision Records (MADR), maintained with the `mass-adr-lifecycle` skill
- `.claude-plugin/` — Claude Code marketplace
- `skills-registry.json` — generated and committed

## Language

- Replies to the user and comments on issues and pull requests: Portuguese (pt-BR).
- Everything committed (code, docs, skills, CLI messages, comments, commit messages): English.
- Identifiers are never translated.

## Commands

```sh
pnpm check                      # validator + registry --check + tests; required before committing
pnpm registry                   # regenerates skills-registry.json; required after changing any skill file
pnpm build                      # core → cli → site (apps/site/dist/, base /agents-skills/)
pnpm new-skill                  # skill scaffold
pnpm stale --days 90            # skills without review
pnpm start-issue <N>            # creates/reuses the branch and assigns the issue (board → In Progress)
pnpm changeset                  # records a version bump of the packages
pnpm exec tsx packages/cli/src/bin.ts <args>   # CLI in development, always from the root
```

## Rules

- Run `pnpm check` before every commit; run `pnpm registry` after changing any file under `skills/`.
- Starting an issue: `pnpm start-issue <N>` first, then implement it with the `mass-issue-implement` skill. Never without the skill.
- Before adding or integrating a dependency, feature or technology, read the official docs (Context7, then web search).
- The site follows `DESIGN.md`; tokens in `apps/site/src/styles/global.css` keep the same names.
- Never publish to npm by hand; only `release.yml` publishes.
- Never install into `.claude/skills/` or `.agents/skills/` by hand or with `npx skills add`; use `npx @mass-solutions/skills-cli`.
- A new skill is born in `.claude/skills/<name>/`, committed, and is copied to `skills/` only when ready.
- Commits follow Conventional Commits; pull requests carry `Closes #N` and are squash-merged.

## Where to look

| Topic | Read |
|---|---|
| Catalog rules, versioning, deprecation, commits | `CONTRIBUTING.md` |
| Skill frontmatter contract, validator rules | `skills/mass-skill-authoring/references/skill-contract.md` |
| Security checks, allowlist, reporting | `SECURITY.md` |
| CLI internals, exit codes, env vars, pinned ref | `dev/docs/cli.md` |
| Site internals, i18n, badges | `dev/docs/site.md` |
| Workflows and release flow | `dev/docs/ci-and-release.md` |
| Installed skills and skills in development | `dev/docs/dogfooding.md` |
| Issues, Project board, triage, Area rule, web sessions | `dev/docs/github-project.md` |
| Architecture decisions | `dev/docs/adr/README.md` |
