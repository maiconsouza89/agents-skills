# Skill contract

The validator (`pnpm validate`) applies the Agent Skills specification literally, plus the
catalog rules below. Each rule has an id that appears in the finding line.

| Rule id | What it checks |
| --- | --- |
| `frontmatter/unknown-key` | only `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` |
| `frontmatter/name` | equals the folder, matches `^mass-[a-z0-9]+(-[a-z0-9]+)*$`, at most 64 characters |
| `frontmatter/description` | 1-1024 characters, follows the "Use when / Do NOT use for" formula |
| `frontmatter/metadata` | `license: CC-BY-4.0`; `metadata` has `author`, `version` (semver), `category` (known id), `tags`, `reviewed` (`YYYY-MM-DD`, not in the future); every value is a string |
| `frontmatter/compatibility` | 1-500 characters when present |
| `content/binary` | no file with a NUL byte in its first 8192 bytes |
| `security/secret` | no AWS keys, GitHub tokens, private keys or `api_key = "..."` literals |
| `security/shell` | no download piped into a shell, no decoded payload piped into a shell, no `eval` of a subshell, no environment sent over the network |
| `security/prompt-injection` | none of the classic override phrases |
| `scripts/shebang`, `scripts/executable` | files under `scripts/` start with `#!` and are executable |
| `size/tokens-warn`, `size/tokens` | `SKILL.md` above 3000 estimated tokens warns; above 6000 tokens or 500 lines fails |
| `links/missing` | every relative markdown link resolves inside the skill |
| `evals/shape` | `evals/triggers.json` has the arrays `should` and `shouldNot` |

Tokens are estimated as `ceil(characters / 4)`.

## Frontmatter template

```yaml
---
name: mass-example
description: Does one thing. Use when "phrase one", "phrase two" or "phrase three". Do NOT use for something else (use mass-other).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "tag-one, tag-two"
  reviewed: "2026-09-14"
---
```
