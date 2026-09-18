# Maintainer docs

Reference material for people and agents working on this repository. `AGENTS.md` at the root
holds the short rules and points here; each file below is read on demand.

| Doc | Read it when |
|---|---|
| [cli.md](cli.md) | Changing `packages/cli`: entry point, exit codes, env vars, what `install`/`update`/`remove` guarantee, which catalog ref the CLI pins. |
| [site.md](site.md) | Changing `apps/site`: where the catalog comes from, i18n, the only JavaScript, verification badges and `/security/`. |
| [ci-and-release.md](ci-and-release.md) | Touching `.github/workflows/`, cutting a release, or wondering why the site says "not scanned in this build". |
| [tools.md](tools.md) | Running, changing or adding a script in `tools/` (CI and site build) or `dev/tools/` (local development), including the manual `spike/` checks. |
| [dogfooding.md](dogfooding.md) | Adding, reinstalling or developing a skill inside this repo (`.claude/skills/`, `.agents/skills/`, `mass-skills.lock.json`). |
| [github-project.md](github-project.md) | Starting an issue, implementing one, triaging, or deciding the Area of an issue. |
| [adr/](adr/README.md) | Recording or consulting an architecture decision. Maintained with the `mass-adr-lifecycle` skill. |

Public-facing docs live at the root: `README.md` (users), `CONTRIBUTING.md` (catalog rules,
versioning, commits), `SECURITY.md` (threat model, allowlist, reporting), `DESIGN.md` (site
design system). The frontmatter contract of a skill is in
`skills/mass-skill-authoring/references/skill-contract.md`.
