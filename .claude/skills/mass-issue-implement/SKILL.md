---
name: mass-issue-implement
description: Implements a GitHub issue end to end. Starts the branch, reads the whole thread, checks every plan and comment against the code, researches what is still open, records the decisions and their evolution as comments on the issue and opens the pull request from the repository template. Use when "implement issue 42", "work on issue 42 and open the PR" or "resolve this issue". Do NOT use for classifying an issue (use mass-issue-priority or mass-issue-complexity), for writing only the PR text (use mass-pr-description) or for reviewing someone else's PR (use mass-code-review).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "issues, github, implementation, pull-request, workflow"
  reviewed: "2026-09-16"
---

# Issue implementation

Input: an issue number and, usually, some guidance from the user. Output: a pull request linked
to the issue, ready for review, with the decisions that shaped it written on the issue itself.
The thread is the durable record of the work: the plan, what changed along the way and why, and
what was delivered. A decision that lives only in the chat or in a local file is lost to the next
person who opens the issue, so every decision ends up in a comment.

## Steps

1. **Start the issue before anything else.** Run the repository's start script
   (`pnpm start-issue <N>` in Mass Solutions repos) so the branch exists and the board moves.
   Look at `git status` and `git log` first: the maintainer may have pushed since the last turn.
2. **Read the whole thread**: `gh issue view <N> --comments`, plus every issue and pull request
   it links to. Sort what you read into decided, proposed, open and rejected, following
   [references/thread-reading.md](references/thread-reading.md). The user's guidance outranks
   the thread; when the two conflict, say so in the plan comment instead of picking silently.
3. **Check the plan against the code.** A plan written before the code was read is a hypothesis.
   Verify each claim (the file exists, the test exists, the rule applies) and look for rules the
   plan ignored: tests that pin a policy, `CLAUDE.md`, the design system. Most plans change here.
4. **Research what is still open.** For a library, API or tool, read the official docs (Context7
   first, then the web) even when the answer seems obvious; for a design choice, weigh at least
   one alternative. Keep the sources: they go into the comment so the decision can be checked.
5. **Post the plan comment**, shaped as in
   [references/issue-comments.md](references/issue-comments.md): what exists today, each
   decision with its reason and source, the steps, what is out of scope. If the thread already
   holds a plan, post only what you change and why. Leave at most two open questions, each with
   a recommendation, and proceed with the recommendation unless the user says otherwise: an
   implementation that waits on a reply never ships.
6. **Implement in small Conventional Commits.** Run the repository checks before each commit
   (`pnpm check`; `pnpm registry` and `metadata.reviewed` whenever a skill changed).
7. **Comment when the course changes**, at the moment it changes: a rule found in the code, a
   library that does not do what the docs suggested, a scope cut. One short comment per change
   of direction, not one per commit. This is the evolution a reader needs six months later.
8. **Open the pull request** from the repository template (`.github/PULL_REQUEST_TEMPLATE.md`)
   with `Closes #<N>`, a link to the plan comment rather than a copy of it, and the checklist
   ticked only where true. Use `gh pr create --title "<type>: ..." --body-file <file>`.
9. **Post the closing comment**: the PR number, the acceptance criteria ticked one by one with
   the reason for any that changed, the verification actually run, known limitations, and what
   was deferred to a new issue.

## Voice

Comments follow the language of the thread (pt-BR in Mass Solutions repos); code, commits and
the PR title stay in English. A comment states decisions and reasons, never an activity log.
Report verification as what ran and what it printed, not as a claim that it passed.
