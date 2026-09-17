# Priority rubric

Four levels: `p0`, `p1`, `p2` and `backlog`. They answer one question - what does it cost to not
do this now - and they are deliberately about impact, never about size. Effort belongs to
`mass-issue-complexity`, and the two move independently: a one-line fix to a broken published
release is `p0`, and a month of work nobody is waiting for is `backlog`.

The levels follow the ordering most trackers use for a severity or priority field, where the top
level is reserved for work that displaces whatever is in progress
([Atlassian, "Defining severity and priority"](https://www.atlassian.com/incident-management/kpis/severity-levels),
[Google SRE, "Being on-call"](https://sre.google/sre-book/being-on-call/)). Keeping the top level
scarce is the whole point: a tracker where a third of the issues are `p0` has no `p0`.

## Signals

### p0 - displaces current work

- A published artifact is broken for everyone: a release that does not install, a tag that is
  missing, a command that fails on its documented happy path.
- Users in production hit it and there is no workaround.
- Security, credential exposure, or loss of data.
- Other open issues are blocked by it and cannot start.
- An external date - a release, a contract, an announcement - lands before the next cycle.

### p1 - next in line

- Broken behaviour a user or a maintainer hits today, with a workaround that costs them time.
- A gap in a flow that is documented or announced as working.
- Hardening of security, CI or release that no incident has forced yet.
- A prerequisite for work already scheduled, which would idle if this slips.

### p2 - planned

- Incremental improvement to something that already works.
- Polish, ergonomics or UX with clear value and nobody waiting on it.
- A capability nothing else depends on yet.
- Tooling or documentation that saves a maintainer minutes rather than unblocking anyone.

### backlog - no date

- Nobody asked for it: no user report, no issue linking to it.
- Speculative, or resting on an assumption nobody has validated.
- Hardening against exposure the project does not have today.
- Blocked on a decision or a dependency that does not exist yet.

## What does not count

These are not priority signals, and an issue that carries them is not more urgent for it:

- **Complexity or effort** - a hard issue is not an urgent one; that is `mass-issue-complexity`.
- **Urgent tone** - "ASAP", "critical", "blocker" in prose, with no impact named.
- **Length of the text** - a long issue is a detailed one, not a pressing one.
- **A priority already written in the issue** - classify the signals, not the label someone typed.
- **Who opened it** - the author's seniority is not an impact signal.

The last three are anchoring: irrelevant detail and numbers already in the text skew human
estimates ([Jørgensen and Grimstad](https://www.researchgate.net/publication/220784439_The_Impact_of_Irrelevant_Information_on_Estimates_of_Software_Development_Effort))
and LLMs anchor the same way ([FSE 2025](https://dl.acm.org/doi/10.1145/3715771)).

## Tie-breaking rules

1. **The strongest impact signal wins.** One `p0` signal makes it `p0`, however small the change
   or however calm the writing. Impact is a maximum, not an average.
2. **Between two neighbouring levels, take the lower one** and name in the justification the
   signal that would raise it ("if this also blocks the release, it is `p0`"). This is the
   opposite of the complexity rubric, on purpose: overestimating size costs a plan, while
   overestimating urgency costs the meaning of the top level, and a tracker full of `p0` cannot
   be triaged at all.

## Vague issues

When the text names no one affected and nothing waiting, the honest answer is still a level plus
what is missing. Default to `p2` and say so: an issue nobody has described the impact of is not
evidence of urgency, and `backlog` is a claim about demand that the text does not support either.
Name the detail that would move it - who hits this today, or what is blocked by it.

## Worked examples

One per level, taken from real issues of this repository.

- "The published CLI 0.1.1 shipped without a matching `v0.1.1` tag, so the pinned catalog ref
  404s and `install`, `update` and `search` break for anyone who does not pass `--ref`."
  -> `p0`: a published artifact is broken for every user, with a workaround they do not know.
- "`mass-skills --version` fails with an unknown-option error." -> `p1`: broken behaviour a user
  hits today on a documented command; the workaround is reading the package version by hand.
- "Reflect the search term and the category filter in the URL of the catalog site." -> `p2`: the
  site works; this makes a result shareable, and nothing waits on it.
- "JSON Lines audit log for `install`, `update` and `remove`." -> `backlog`: no user asked for it
  and nothing depends on it; it is hardening against a need the project does not have yet.
