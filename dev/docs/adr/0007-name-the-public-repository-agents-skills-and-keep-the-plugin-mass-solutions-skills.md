---
status: accepted
date: 2026-09-15
title: "Name the public repository agents-skills and keep the plugin mass-solutions-skills"
description: "Why the GitHub repository and site path are agents-skills while the Claude Code plugin keeps its original mass-solutions-skills@mass-solutions id."
supersedes:
superseded-by:
---

# 0007. Name the public repository agents-skills and keep the plugin mass-solutions-skills

## Context and problem

The project was built under the working name `mass-solutions-skills`, and that name is baked into the Claude Code marketplace manifest (`.claude-plugin/marketplace.json`) as `mass-solutions-skills@mass-solutions`. On 2026-09-15 the public repository was created as `maiconsouza89/agents-skills`, which fixes the GitHub URL, the site path `https://maiconsouza89.github.io/agents-skills/`, the CLI's default download base and the `repository` field used for npm provenance. Renaming any of these after publication means redirects, republished packages and broken installs.

## Considered options

- **Repository `agents-skills`, plugin id unchanged** — `REPO` in `packages/core/src/constants.ts`, the site base and the manifests say `agents-skills`; the marketplace plugin keeps `mass-solutions-skills`.
- **Rename the plugin too** — one name everywhere, but users who already added the marketplace would lose the plugin id they installed.
- **Keep the repository named `mass-solutions-skills`** — matches the plugin, but the repository already existed under the new name and the descriptive name reads better in `npx skills add maiconsouza89/agents-skills`.

## Decision

Chosen **`agents-skills` for the repository with the plugin id unchanged**, by the maintainer's decision on 2026-09-15, because the repository name was already public and the plugin id is what installed marketplaces reference.

## Consequences

- Good: `npx skills add maiconsouza89/agents-skills`, the site URL and the raw download base are stable from the first release.
- Good: users who added the marketplace before the rename keep working, since the plugin id did not change.
- Bad: two names coexist (`agents-skills` for the repository and site, `mass-solutions-skills` for the plugin and the root `package.json`), and newcomers ask why.
- Bad: renaming the repository later would break the CLI's default base URL in every published version and the `repository` field checked by npm provenance.
