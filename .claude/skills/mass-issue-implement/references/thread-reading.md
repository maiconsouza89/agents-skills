# Reading an issue thread

The thread is where the maintainers already did part of the thinking. Reading it well saves
re-deciding what was decided and, worse, undoing a decision that had a reason. Read all of it
before writing a line of code: title, body, acceptance criteria, labels, every comment, every
linked issue and pull request.

## Commands

```bash
gh issue view <N> --comments                       # body and comments, in order
gh issue view <N> --json title,body,labels,assignees,milestone
gh pr list --state all --search "<N> in:body"      # earlier PRs for the same issue
gh issue view <linked> --comments                  # each "blocked by", sub-issue or "see #"
```

Without `gh`, the GitHub MCP tools give the same data. In a Claude Code web session the
start script keeps the current branch; everything else is the same.

## Who is speaking

Comments carry different weight depending on who wrote them and when:

| Author | What it usually is | How to treat it |
| --- | --- | --- |
| Repository owner or maintainer | A decision, a constraint or a review of a plan | Binding. A later comment overrides an earlier one. |
| Triage bot (`Triage: priority ... area ... complexity ...`) | A classification with caveats | Context for scope and risk, not a plan. Its caveat often names the open question. |
| An earlier agent run (`@claude`, "Claude finished ...") | A proposal | A hypothesis until a maintainer confirmed it, and it may predate the current code. |
| An external contributor | A request or a report | Facts to verify; scope stays what the maintainer approved. |

The user talking to you now outranks all of them. When their guidance contradicts the thread,
follow the user and record the contradiction in the plan comment, so the thread stays honest.

## Sort into four buckets

Write the sorting down before planning; it becomes the "what exists today" part of the plan.

- **Decided**: stated by a maintainer, or proposed and then confirmed. Do not reopen without a
  new fact from the code or the docs. If you must, say which fact.
- **Proposed**: in a plan nobody confirmed. Verify each claim against the current code.
- **Open**: an explicit question, a caveat in the triage, or a choice the plan left to "decide
  later". These are the research targets.
- **Rejected**: something a maintainer said not to do, and why. The reason matters more than the
  rejection: it usually rules out the neighbouring options too.

## What to look for

- **Acceptance criteria** in the body (checkboxes or a list). They come back, ticked, in the
  closing comment, so keep their wording.
- **Rules the plan ignored**: a test that pins a policy ("zero client js"), a line in
  `CLAUDE.md`, a design token, a CI step. A plan that passes CI by going around a rule is still
  wrong.
- **Links**: `blocked by`, sub-issues, "closes", "see #". Blocked work carries its blocker's
  constraints; a closed-unmerged PR tells you what the maintainer did not want.
- **Assumptions about tools and libraries**: any sentence of the form "X does Y" about a
  library, an API or a CLI flag is a research target. Check the official docs; behaviour changes
  between versions and between environments (local, CI, cloud sandbox).
- **Scope creep in the comments**: a good idea mentioned in passing is not part of the issue.
  Name it under "out of scope" and, if it deserves it, offer to open an issue for it.

## When the thread is thin

An issue with no comments and a two-line body still gets the same treatment: the plan comment
states what you found in the code and what you assume, so the maintainer can correct it before
the PR, not after.
