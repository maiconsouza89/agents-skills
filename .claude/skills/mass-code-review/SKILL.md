---
name: mass-code-review
description: Reviews a pull request or a local diff for correctness bugs, missing tests and unsafe changes, and reports findings with file and line. Use when "review this PR", "review my changes" or "look for bugs in this diff". Do NOT use for writing the PR description (use mass-pr-description) or for a security-only audit of a skill (use mass-security-checklist).
license: CC-BY-4.0
compatibility: Requires git and the GitHub CLI (gh) on PATH for pull request review
allowed-tools: Bash(git:*) Bash(gh:*) Read Grep
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: quality
  tags: "code-review, pull-request, quality"
  reviewed: "2026-09-14"
  requires: "git, gh"
---

# Code review

Find what would break, not what you would have written differently.

## Steps

1. Get the diff. For a PR: `gh pr diff <number>` and `gh pr view <number> --json title,body`.
   For local work: `git diff <base>...HEAD`.
2. Read the linked issue or the PR summary first so the review judges the change against its
   own goal.
3. Walk the diff file by file and ask, for each hunk: what input makes this wrong, what happens
   on the error path, what test would have caught it.
4. Check the tests: does a new branch have an assertion that fails without the change? A test
   that only exercises the happy path is a finding.
5. Check the edges of the change: callers of a renamed or re-typed symbol, migrations against
   existing data, workflows that run the changed command.

## Report

One finding per line, most severe first:

`<severity> <path>:<line> - <what is wrong> - <input or state that triggers it>`

Severities: `bug` (wrong result or crash), `risk` (unsafe under a plausible input),
`test` (missing or weak coverage), `nit` (style, only if it hides a bug).

End with one line: `No blocking findings.` or `Blocking: <count>.` Do not post to GitHub unless
the user asked; when asked, use `gh pr review` with the findings as the body.
