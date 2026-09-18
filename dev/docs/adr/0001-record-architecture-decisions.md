---
status: accepted
date: 2026-09-17
title: "Record architecture decisions as ADRs"
description: "Why decisions that are expensive to reverse become files in this folder instead of living in chat history and pull requests."
supersedes:
superseded-by:
---

# 0001. Record architecture decisions as ADRs

## Context and problem

Every technology or design choice excludes alternatives. Chat sessions do not persist and
nobody reads `git log` to recover a motive, so six months later no one knows why X was
chosen and the alternative that was already rejected comes back to the table. We need a
place where the decision and what was rejected sit together, versioned with the code.

## Considered options

- **ADRs in this folder** — one numbered Markdown file per decision, MADR minimal format, versioned with the code.
- **A single decisions page** — one file that grows; no numbering, no status, no way to supersede an entry.
- **Nothing formal** — decisions stay in issues, pull requests and chat; recovering the motive depends on who was there.

## Decision

Chosen **ADRs in this folder**, because stable numbering gives cross-references, the status
field gives a lifecycle (including two-sided supersede) and one file per decision keeps each
record inside a reading budget.

## Consequences

- Good: to learn why something is the way it is, `grep` this folder; the motive and the rejected options are in the same file.
- Good: `adr.py audit` validates numbering, front-matter and supersede chains, so inconsistency shows up in a command, not in a review.
- Bad: every decision that is expensive to reverse now costs one more file; recording trivial decisions inflates the archive until nobody reads it.
- Bad: an `accepted` ADR has frozen text; fixing its content means writing a new ADR that supersedes it.

## References

Accessed on 2026-09-17.

- [MADR — Markdown Any Decision Records](https://adr.github.io/madr/) — the format and minimal section set adopted here.
