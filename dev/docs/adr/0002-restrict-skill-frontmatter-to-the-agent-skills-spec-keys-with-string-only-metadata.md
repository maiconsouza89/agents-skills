---
status: accepted
date: 2026-09-14
title: "Restrict skill frontmatter to the Agent Skills spec keys with string-only metadata"
description: "Why every skill carries only the six spec keys, a string-to-string metadata block and a mass- prefixed name instead of agent-specific keys or free-form metadata."
supersedes:
superseded-by:
---

# 0002. Restrict skill frontmatter to the Agent Skills spec keys with string-only metadata

## Context and problem

The catalog targets eight agents (Claude Code, Cursor, Codex, GitHub Copilot, OpenCode, Windsurf, Gemini CLI, Cline) that all read the Agent Skills `SKILL.md` frontmatter. Some agents accept extra keys of their own, and a key that one agent understands is rejected or ignored by another. The catalog also needs an owner, a version, a category, tags and a review date per skill, and the site, the validator and the stale check read them. The frontmatter shape is the contract every consumer parses, so it had to be fixed before the first skill was written.

## Considered options

- **Spec keys only, catalog data inside `metadata` as strings** — `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`; `metadata` holds `author`, `version`, `category`, `tags` (comma-separated string) and `reviewed`, all string values, as the spec allows.
- **Extra top-level keys** — `version`, `category` and the like as their own keys; readable, but outside the spec and therefore rejected by at least one agent.
- **Typed `metadata`** — lists and dates as YAML lists and dates; nicer for tooling, but the spec defines `metadata` as string-to-string and some parsers flatten or drop non-strings.

## Decision

Chosen **spec keys only with string-only metadata**. `name` equals the folder and matches `^mass-[a-z0-9]+(-[a-z0-9]+)*$` (max 64 characters) so the folder, the install id and the frontmatter never disagree; the validator enforces all of it (`packages/core/src/rules/frontmatter.ts`).

## Consequences

- Good: a skill that passes `pnpm validate` loads unchanged in every supported agent; there is no per-agent build step.
- Good: the site, `pnpm stale` and the registry read `metadata.*` with one parser and no type coercion.
- Bad: `tags` is a comma-separated string and `reviewed` is a string date, so every consumer splits and parses them by hand.
- Bad: renaming a skill changes its install id in every agent, so a rename is a deprecation plus a new skill (see `_deprecated.json`), never an edit.

## References

Accessed on 2026-09-17.

- [Agent Skills specification](https://agentskills.io/specification) — the frontmatter keys and the string-to-string `metadata` contract this decision adopts.
