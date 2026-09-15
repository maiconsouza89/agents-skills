---
name: mass-issue-complexity
description: Classifies the complexity of an issue or ticket as low, medium or high from its text and justifies the level with the signals found. Use when "how complex is this issue", "classify the complexity of this ticket" or "is this issue low, medium or high". Do NOT use for reviewing a diff or pull request (use mass-code-review) or for writing a pull request description (use mass-pr-description).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: workflow
  tags: "issues, triage, estimation, complexity"
  reviewed: "2026-09-15"
---

# Issue complexity

Read an issue and return one level, `low`, `medium` or `high`, with a short justification.
Nothing else: no labels applied, no plan, no implementation, no rewrite of the issue.

Complexity is the relative size of the work, the mix of **volume** (how much has to change),
**uncertainty** (what is still unknown) and **risk** (what breaks if it goes wrong). It is not
priority, severity or urgency, and it is not a time estimate. The full rubric, with sources,
is in [references/rubric.md](references/rubric.md); read it before the first classification.

## Steps

1. Read the whole issue: title, body, acceptance criteria, reproduction steps and any
   comments given. If a repository is at hand, a quick look at the files it names is fair
   game to judge the blast radius; do not go further than that.
2. Collect signals on each axis:
   - **Volume**: how many components, layers or packages change.
   - **Uncertainty**: is the solution stated or obvious, or does it need investigation; is a
     bug reproducible.
   - **Risk**: public API or breaking change, data or schema migration, auth or security,
     concurrency, external systems or other teams, hard-to-reverse decisions.
3. Match the signals to the level definitions in the rubric.
4. Break ties with the rubric rules. In short: the strongest risk signal wins, uncertainty
   alone lifts one level, volume alone stops at `medium`, and between two levels pick the
   higher one because underestimating costs more.
5. Ignore what does not measure complexity: priority, severity, urgent tone, length of the
   text and any estimate already written in the issue. A one-line change to auth or shared
   config is not `low`.

## Output

```
Complexity: <low|medium|high>

Justification:
- <signal quoted or paraphrased from the issue> -> <what it means for complexity>
- <2 to 4 bullets in total>

Split note: <only for a high issue that is too big: where it naturally splits>
```

The scale has three levels on purpose: text alone cannot tell five levels apart reliably.
For a `high` issue that is too big to be one piece of work, add the split note following
the criteria in the rubric; leave the line out otherwise.

When the issue is too vague to judge (no scope, no reproduction, no acceptance criteria),
still give the most likely level and say in the justification that the text does not support
a confident classification and which missing detail would change it.
