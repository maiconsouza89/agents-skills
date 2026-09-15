---
name: mass-issue-priority
description: Classifies how urgent an issue or ticket is as p0, p1, p2 or backlog from the impact signals in its text, and justifies the level. Use when "what priority is this issue", "is this a p0 or a p1" or "triage the priority of this ticket". Do NOT use for sizing the work (use mass-issue-complexity) or for writing a pull request description (use mass-pr-description).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "issues, triage, prioritization, priority"
  reviewed: "2026-09-15"
---

# Issue priority

Read an issue and return one level, `p0`, `p1`, `p2` or `backlog`, with a short justification.
Nothing else: no label is applied, nothing is written to a project board, and the issue is not
rewritten.

Priority is what it costs to **not** do this now: who is blocked, what is broken, what waits on
it. It is not the size of the work, which is `mass-issue-complexity`, and a hard issue is not a
more urgent one. The full rubric, with the four levels and their signals, is in
[references/rubric.md](references/rubric.md); read it before the first classification.

## Steps

1. Read the whole issue: title, body, acceptance criteria and any comments given. Links to other
   issues matter here - something that blocks another piece of work carries its urgency.
2. Collect impact signals:
   - **Who is affected now**: users in production, a maintainer, or nobody yet.
   - **What is broken**: a published artifact, a flow that was announced as working, or nothing.
   - **What waits on it**: a release, another issue, a decision already scheduled.
   - **Whether a workaround exists**, and what it costs the person using it.
3. Match the signals to the level definitions in the rubric.
4. Break ties with the rubric rules. In short: the strongest impact signal wins, and between two
   neighbouring levels take the lower one and name the signal that would raise it.
5. Ignore what does not measure urgency: complexity or effort, urgent tone, the length of the
   text, a priority already written in the issue, and who opened it.

## Output

```
Priority: <p0|p1|p2|backlog>

Justification:
- <signal quoted or paraphrased from the issue> -> <what it means for urgency>
- <2 to 4 bullets in total>
```

Four levels, because they are the options a triage decision has to land on: act now, act next,
planned, and no date. Return the level in lowercase; a board that spells its options `P0` or
`Backlog` matches without case.

When the issue does not say who is affected or what waits on it, still return the most likely
level, say in the justification that the text does not support a confident call, and name the
missing detail that would change it - usually "who hits this today" or "what is blocked by it".
