---
name: mass-pr-description
description: Fills the Mass Solutions pull request template from the branch's commits and diff. Use when "write the PR description", "open a pull request" or "describe this branch". Do NOT use for a single commit message (use mass-commit-message) or for reviewing someone else's PR (use mass-code-review).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "git, pull-request, github"
  reviewed: "2026-09-14"
---

# Pull request description

Fill [assets/pr-template.md](assets/pr-template.md) section by section. Every section stays;
an empty one says `None.` so the reader knows it was considered.

## Steps

1. Collect the evidence: `git log --oneline <base>..HEAD` and `git diff --stat <base>..HEAD`,
   where `<base>` is the target branch (usually `main`).
2. **Summary**: two or three sentences on what changes for a user or a maintainer. Lead with
   the outcome, not the mechanism.
3. **Linked issue**: the issue number this PR resolves. External contributions need one; a PR
   without a linked issue is closed with a pointer to the proposal template.
4. **Changes**: one bullet per coherent change, in the order a reviewer should read them.
5. **How to test**: the exact commands and what to look for. `pnpm check` is always the first.
6. **Checklist**: tick only what is true. `metadata.reviewed` must be updated for any skill
   whose content changed.

## Output

Print the filled template in a fenced block. Open the PR with `gh pr create --body-file` only
when the user asked for it.
