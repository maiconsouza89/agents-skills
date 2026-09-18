---
status: accepted
date: 2026-09-14
title: "Generate and commit skills-registry.json as the single source for CLI and site"
description: "Why a generated, committed and CI-checked registry feeds the CLI and the site instead of each consumer parsing the catalog on its own."
supersedes:
superseded-by:
---

# 0004. Generate and commit skills-registry.json as the single source for CLI and site

## Context and problem

The CLI installed on a user's machine, the Astro site and CI all need the same view of the catalog: which skills exist, their metadata, per-file hashes and the `contentHash` of 0003. The CLI fetches that view over raw GitHub URLs for any git ref, including tags older than the running code, so the view has to be a plain file that exists at every ref. Re-parsing `SKILL.md` in each consumer would duplicate the frontmatter rules in three places.

## Considered options

- **Generated `skills-registry.json` (`version: 1`), committed and checked in CI** — `pnpm registry` writes it, `pnpm registry --check` fails CI when it drifts from `skills/`, and the CLI and the site read only it.
- **Generate at build or fetch time** — no committed artefact, but the CLI would need the whole tree plus the parser at install time, and an old ref would have no registry to fetch.
- **Registry as a release asset** — published only at tags; `--ref main` and pull request previews would have nothing to read.

## Decision

Chosen **the committed, CI-checked registry**, because a static file at every ref is the only thing a `fetch` of `raw.githubusercontent.com/<repo>/<ref>/skills-registry.json` can rely on, and the `--check` step keeps it from drifting.

## Consequences

- Good: `mass-skills install --ref <any ref>` works against any commit that carries the file, including tags cut before the current CLI existed.
- Good: the site never re-implements frontmatter parsing; a registry change is visible in the same pull request as the skill change.
- Bad: every change under `skills/` requires `pnpm registry` and a commit of the result, and CI is red until that happens.
- Bad: the JSON shape is read by every published CLI, so a breaking change needs a new `version` value and a CLI that understands both.
