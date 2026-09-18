---
status: accepted
date: 2026-09-14
title: "Track installs in a lockfile keyed by skill and protect local edits"
description: "Why mass-skills.lock.json records version, contentHash and ref per skill and update refuses to overwrite a locally modified copy without --force."
supersedes:
superseded-by:
---

# 0005. Track installs in a lockfile keyed by skill and protect local edits

## Context and problem

`mass-skills` copies skill files into agent directories inside the user's project (or home, with `--global`). Later `update`, `doctor` and `remove` must know what was installed, from which ref, at which version and hash, and in which agents, without re-reading the catalog. Users also edit installed skills locally, and an update that silently overwrote those edits would destroy work the CLI cannot recover.

## Considered options

- **`mass-skills.lock.json` (`version: 1`) keyed by skill name** — each entry records `version`, `contentHash`, `ref`, `installedAt` and the agents; `update` compares the on-disk hash with the locked one and refuses a locally modified copy unless `--force` is given.
- **No lockfile, inspect the agent directories** — the hash could be recomputed from disk, but the installed version, ref and the list of agents to update or remove would be unknown.
- **Overwrite on update, keep no local-edit guard** — simpler, but a user's edit disappears on the next `update` with no warning.

## Decision

Chosen **the lockfile with the local-edit guard**, because the lockfile is the only durable record of what the CLI placed where, and comparing `contentHash` (0003) is enough to tell an edit from an outdated copy.

## Consequences

- Good: `update` reports `locally-modified` and leaves the files alone; only `--force` overwrites them.
- Good: `remove` deletes only from the agents recorded in the lockfile, so a directory the CLI never wrote to is never touched.
- Bad: a lockfile edited or corrupted by hand blocks the command with an error rather than guessing, so the user has to fix or delete it.
- Bad: the entry shape is read by every published CLI; changing it needs a new `version` value and a migration path.
