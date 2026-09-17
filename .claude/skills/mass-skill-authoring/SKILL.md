---
name: mass-skill-authoring
description: Writes or reviews a Mass Solutions skill so it passes the catalog validator on the first run. Use when "create a new skill", "review this SKILL.md" or "why does the validator reject my skill". Do NOT use for writing commit messages or pull requests (use mass-commit-message or mass-pr-description).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: authoring
  tags: "skills, authoring, frontmatter, validator"
  reviewed: "2026-09-14"
---

# Skill authoring

A skill is a folder under `skills/` with one `SKILL.md` and, optionally, `references/`,
`scripts/`, `assets/` and `evals/`. The validator enforces the contract in
[references/skill-contract.md](references/skill-contract.md); read it once, then follow the
steps below.

## Steps

1. Scaffold: `pnpm new-skill mass-<slug>`. The name equals the folder, is kebab-case, starts
   with `mass-` and has at most 64 characters.
2. Write the `description` with the formula and nothing else:
   `[What it does]. Use when "a", "b" or "c". Do NOT use for X (use mass-y).`
   The "Use when" quotes are the phrases a user would actually type. The "Do NOT use for"
   clause names the neighbouring skill so the two never overlap.
3. Keep `SKILL.md` under 80 lines for example skills and under 500 lines for any skill. Move
   long material to `references/` and link it with a relative path.
4. Put executable code in `scripts/` with a `#!` first line and the executable bit set
   (`chmod +x`). Put templates in `assets/`.
5. Fill `metadata`: `author`, `version` (semver), `category` (an id from
   `skills/_categories.json`), `tags` (comma-separated string) and `reviewed` (today, as
   `YYYY-MM-DD`). Every value is a string.
6. Optionally add `evals/triggers.json` with `should` and `shouldNot` prompt lists to record
   what must and must not trigger the skill.
7. Run `pnpm check`. Fix every reported `<rule> <path>:<line>` before opening a PR.

## Review checklist

- The description answers "what", "when" and "not when" in one paragraph.
- No secrets, no binaries, no downloads piped into a shell, no instructions that ask the agent
  to hide information from the user.
- Every relative link in `SKILL.md` resolves to a file inside the skill.
- `metadata.reviewed` was updated in this change.
