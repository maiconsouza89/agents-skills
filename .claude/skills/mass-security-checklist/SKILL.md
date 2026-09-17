---
name: mass-security-checklist
description: Audits a skill, script or configuration for the four threat classes the Mass Solutions validator and Snyk Agent Scan look for, and reports pass or fail per item. Use when "is this skill safe", "security check this script" or "audit this SKILL.md". Do NOT use for a general code review (use mass-code-review).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: security
  tags: "security, audit, prompt-injection, secrets"
  reviewed: "2026-09-14"
---

# Security checklist

Walk every item. Each one is `pass`, `fail` with the file and line, or `n/a` with a reason.

## 1. Prompt injection

- No instruction asks the agent to override, forget or disregard its earlier instructions.
- No instruction asks the agent to hide actions or output from the user.
- Content fetched at runtime (web pages, issues, files from other repos) is treated as data,
  never as instructions.

## 2. Malicious or opaque code

- No downloaded content is executed without being written to disk and reviewed first.
- No encoded payload is decoded and executed in one step.
- No `eval` over dynamically built strings.
- Scripts start with a `#!` line, are executable, and their dependencies are named.

## 3. Data exposure

- No credentials, tokens or private keys in any file.
- Environment variables are never sent to a network destination.
- Files outside the working directory are read only when the task requires it and the user
  can see which ones.

## 4. Operational safety

- Destructive operations (delete, force-push, reset, drop) require an explicit user request.
- Network calls name their destination in the instructions.
- The skill declares what it needs in `compatibility` or `metadata.requires`.

## Report

```
mass-security-checklist: <skill or file>
1. prompt injection   pass | fail <path:line>
2. malicious code     pass | fail <path:line>
3. data exposure      pass | fail <path:line>
4. operational safety pass | fail <path:line>
```

Then run `pnpm validate` and paste its output; the checklist complements the validator, it
does not replace it.
