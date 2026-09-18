---
status: accepted
date: 2026-09-14
title: "Derive a skill contentHash from the sorted list of per-file sha256"
description: "Why the integrity hash of a skill is sha256 over sorted "<path>\n<sha256>\n" lines of every shipped file except evals/ instead of an archive or SKILL.md-only hash."
supersedes:
superseded-by:
---

# 0003. Derive a skill contentHash from the sorted list of per-file sha256

## Context and problem

The CLI must refuse a download whose content differs from what the catalog published, and `update` and `doctor` must tell a locally edited skill from an outdated one. That needs one integrity value per skill that the registry, the CLI and the lockfile all compute the same way, over the same set of files, on any operating system. Once written into lockfiles on user machines, the algorithm cannot change without invalidating every install.

## Considered options

- **sha256 over the sorted list of `"<path>\n<sha256>\n"` for every shipped file** — order by byte value of `path`, exclude `evals/**`, computed by `hashFiles` and `contentHashOf` in `packages/core/src/hash.ts`; the registry also records each file's sha256 and size.
- **sha256 of an archive of the folder** — depends on archive format, file modes and timestamps, so two identical trees can hash differently across machines.
- **sha256 of `SKILL.md` only** — cheap, but a modified script or reference under the skill would pass verification.

## Decision

Chosen **the sorted per-file list**, because it is reproducible from plain file contents and paths, covers every shipped file, and lets the CLI verify each file as it downloads it instead of only the whole. `evals/` is excluded because it is test material for authoring, not part of what an agent runs.

## Consequences

- Good: a byte change in any shipped file changes the skill's `contentHash`, so `install` refuses it and `update` reports `locally-modified` on user edits.
- Good: the registry, the CLI at install time and the CLI at `doctor` time compute the same value from the same function, so a mismatch is a real difference, not a platform artefact.
- Bad: changing the algorithm, the exclusion list or the line format invalidates every `mass-skills.lock.json` in the wild; it needs a new registry and lockfile version with migration.
- Bad: renaming a file inside a skill changes the hash even when its content is unchanged, so every rename is a new skill version.
