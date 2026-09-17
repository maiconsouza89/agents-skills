# Complexity rubric

Three levels, built on relative estimation practice: a story point combines volume of work,
uncertainty and complexity, and larger estimates are also less certain
([Cohn, "What are story points"](https://www.mountaingoatsoftware.com/blog/what-are-story-points),
[Cohn, "Why the Fibonacci sequence works"](https://www.mountaingoatsoftware.com/blog/why-the-fibonacci-sequence-works-well-for-estimating)).
The levels also follow the Cynefin domains used in backlog refinement: clear, complicated and
complex ([Agile Pain Relief](https://agilepainrelief.com/blog/product-backlog-refinement-hell-solutions/)).

| Level | Cynefin | Story points | T-shirt |
| --- | --- | --- | --- |
| `low` | Clear: done this many times | 1-2 | XS, S |
| `medium` | Complicated: the goal is clear, some technical unknowns | 3-5 | M |
| `high` | Complex: unclear what to build or whether it is feasible | 8+ | L, XL |

## Signals

### low

- Localized change in one component or layer: copy, style, config, a simple validation or flag.
- The fix or approach is stated or obvious, and "done" is clear.
- A bug with reproduction steps and a likely cause pointed out.
- No public API, schema, auth, concurrency or external dependency involved.
- Trivially reversible and checked by one unit test or a manual check.

### medium

- Touches two or three components or layers (UI and API, CLI and core, workflow and script).
- Known solution, but it needs some investigation of the code or has bounded unknowns.
- Additive API change, or a simple backward-compatible migration.
- Integration with one known system, or a feature with several edge cases.
- An intermittent bug with leads, or a change that needs an integration test.

### high

- Cross-cutting: many layers or services, or an architectural change such as a new component
  or server.
- Breaking change, irreversible data migration, auth or security model, concurrency or data
  consistency.
- Depends on other teams or external systems, or makes a decision that is hard to reverse
  (schema, framework, public API: "one-way doors",
  [One-way and two-way doors](https://medium.com/one-to-n/one-way-two-way-door-decisions-a0e29029e200)).
- Nobody knows yet what to build or whether it is feasible. A bug with no reproduction is
  uncertainty, not a `high` signal on its own: apply tie-breaking rule 2.
- Several user flows or groups of acceptance criteria; the issue fails the "Small" or
  "Estimable" test of INVEST and would normally be split or preceded by a spike
  ([splitting guidance](https://docs.gitscrum.com/en/best-practices/writing-effective-user-stories)).

## Split note

The scale stops at `high`; there is no "very high". When a `high` issue is too big to be one
piece of work, say so in a split note after the justification. It is too big when any of
these holds:

- It bundles deliverables that could ship on their own (two workflows, a server and a client).
- It has several user flows or several groups of acceptance criteria.
- It would take more than one sprint, or 8+ story points, for a team that knows the code.

The note names the natural cut points in one or two sentences. It is an observation, not a
plan: no sub-issue titles, no estimates per part, no order of work. `low` and `medium` issues
never get a split note.

## Tie-breaking rules

1. **Strongest risk signal wins.** Any irreversibility, security, migration or breaking-change
   signal lifts the issue to at least `medium`, however small the diff looks.
2. **Uncertainty alone lifts one level.** When uncertainty is the only elevated axis, go one
   level up from what volume and risk suggest.
3. **Volume alone stops at `medium`.** A lot of repetitive, well-understood work is `medium`
   unless it also carries risk or uncertainty.
4. **Between two levels, pick the higher one** and say why. Underestimating costs more than
   overestimating.
5. **Ignore non-signals.** Priority, severity, urgent tone, length of the issue and numbers
   already written in it do not measure complexity. Issue length and irrelevant details are
   known to skew estimates
   ([Jørgensen and Grimstad](https://www.researchgate.net/publication/220784439_The_Impact_of_Irrelevant_Information_on_Estimates_of_Software_Development_Effort)),
   and LLMs show the same anchoring on numbers in the prompt
   ([FSE 2025](https://dl.acm.org/doi/10.1145/3715771)).

## Vague issues

Text-only estimation is noisy: the best LLM setups reach a rank correlation around 0.4 with
team estimates, using only title and description
([arXiv 2603.06276](https://arxiv.org/html/2603.06276)); earlier models such as Deep-SE and
GPT2SP barely beat a median baseline once replicated
([Deep-SE replication](http://www0.cs.ucl.ac.uk/staff/fsarro/resource/papers/deepsereplication.pdf),
[GPT2SP replication](https://arxiv.org/pdf/2209.00437)). That is why the level always comes
with a justification tied to the text.

When the issue lacks scope, reproduction or acceptance criteria, give the most likely level,
say the text does not support a confident call and name the missing detail that would move it.

## Worked examples

- "`mass-skills --version` fails with unknown option. Add `.version()` in `run.ts`, reading
  the package version." -> `low`: one file, fix stated, no API or data risk.
- "Scan only skills whose `contentHash` changed against the PR base; keep a full run on manual
  dispatch." -> `medium`: CI workflow plus registry comparison, known approach, the scan must
  stay blocking so a mistake silently skips security checks.
- "Read-only MCP server with `search_skills`, `read_skill`, `fetch_skill_files`, files
  validated against the registry and hashes checked." -> `high`: new component and protocol,
  several tools, security-sensitive file serving, design still open.
