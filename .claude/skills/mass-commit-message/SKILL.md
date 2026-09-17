---
name: mass-commit-message
description: Writes a Conventional Commits message from the staged diff, with a scope taken from the changed directories. Use when "write a commit message", "commit this" or "what scope should this commit have". Do NOT use for pull request descriptions (use mass-pr-description).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "git, commits, conventional-commits"
  reviewed: "2026-09-14"
---

# Commit message

Produce one message in [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
form: `<type>(<scope>): <description>`, an optional body, optional footers.

## Steps

1. Read the staged diff: `git diff --cached --stat` and `git diff --cached`.
2. Run `scripts/suggest-scope.sh` to list the top-level directories touched by the staged
   changes. Use the single directory as the scope; with several, pick the one that carries the
   behaviour change, or omit the scope.
3. Pick the type from what the change does, not from where it lives:
   `feat` new behaviour · `fix` corrected behaviour · `refactor` same behaviour, new shape ·
   `docs` · `test` · `build` dependencies and tooling · `ci` workflows · `chore` everything else.
4. Write the description in the imperative mood, lowercase, no trailing period, at most 72
   characters including the prefix.
5. Add a body only when the diff does not explain itself: what was wrong, why this fix.
6. A breaking change gets `!` after the scope and a `BREAKING CHANGE:` footer.

## Output

Print the message inside a fenced block and nothing else. Do not run `git commit` unless the
user asked for it in the same request.
