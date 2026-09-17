---
status: accepted
date: 2026-09-15
title: "Pin the CLI download ref to the tag matching its own version"
description: "Why mass-skills fetches the catalog from v<cli version> by default instead of main, and why every npm release needs a git tag of that exact name."
supersedes:
superseded-by:
---

# 0008. Pin the CLI download ref to the tag matching its own version

## Context and problem

`mass-skills` fetches `skills-registry.json` (0004) and skill files from raw GitHub URLs at a git ref. Until 2026-09-15 the default ref was `main`, so two installs of the same CLI version could fetch different catalogs, and the lockfile recorded `ref: "main"`, which identifies nothing. A default the CLI can compute from itself was needed, and the choice binds every future release to the git history of the repository.

## Considered options

- **`v<cli version>` read from the CLI's own `package.json`** — `DEFAULT_REF` in `packages/cli/src/download.ts`; `--ref` still overrides it for any other ref.
- **`main`** — always the newest catalog, but not reproducible and not what the CLI was tested against.
- **A ref written into the CLI at release time** — equivalent to the tag, but a second value to keep in sync with the version.

## Decision

Chosen **the version tag**, because it is derived from the value the release already carries and makes an install reproducible: the same CLI version always reads the same catalog.

## Consequences

- Good: `mass-skills.lock.json` records a ref that identifies an exact catalog, and `doctor` on another machine sees the same content.
- Bad: every npm release of the CLI must have a git tag named exactly `v<version>`; `release.yml` aborts when the tag and `packages/cli/package.json` disagree, and a missing tag makes a fresh install 404.
- Bad: a skill merged to `main` after the last tag is invisible to the default install until the next release; `--ref main` is the documented workaround.
- Bad: deleting or moving a released tag breaks every install of that CLI version, so tags are permanent.
