# Architecture Decision Records

Every architecture decision that is expensive to reverse becomes one file here. An ADR answers
one question for whoever arrives in six months: **why is it like this, and what else was tried?**

Format: [MADR](https://adr.github.io/madr/) minimal. Start from `template.md`.

| File | What it is |
|---|---|
| `NNNN-*.md` | The records. One file per decision. |
| `template.md` | Starting point for a new record. The audit derives required sections and keys from it. |
| `index.md` | Table of all records. **Generated**, never edited by hand. |
| `README.md` | This file. |

## When to write one

Write when the decision is **expensive to reverse** or **someone will question it in six months**:
a framework, database or hosting choice, the shape of a contract between components, an
auth/persistence/error strategy, or a deliberate pick of the non-obvious option.

Do not write for trivially reversible choices, for "how to do X" (that belongs in a README or
contributor guide), or for a choice with no real alternative. An inflated archive stops being
read, which costs more than a missing entry.

## Naming and numbering

`NNNN-kebab-case-title.md`: four digits, sequential, **never reused**, even if an ADR is
deleted. A gap is harmless; a repeated number breaks every cross-reference.

The title is the decision in active voice, not the topic. `ls` must read as a list of decisions:

- `0007-use-zod-to-validate-env.md` ✓
- `0007-env-validation.md` ✗

## Front-matter

```yaml
---
status: accepted
date: 2026-09-17
title: "Use Zod to validate env"
description: "Why env validation moved to Zod instead of hand-written checks."
supersedes: "0003"
superseded-by:
---
```

- `status` — one of the five below, lowercase.
- `date` — ISO; the day the record reached its **current** status. Updated on every transition.
- `title` — the decision only, without the number (the number lives in the file name and the `# NNNN.` heading).
- `description` — one sentence, "why X instead of Y". It is what a person or an agent reads when scanning the archive without opening each file.
- `supersedes` / `superseded-by` — the other ADR's number as a 4-digit string, empty when not applicable. Both keys stay in the file even when empty, so the chain stays greppable.

Keys, status values and file names are always English/ASCII; the prose is in the archive's language.

## Status lifecycle

| Status | Meaning | Moves to |
|---|---|---|
| `proposed` | Written, under discussion. The only freely editable state. | `accepted`, `rejected` |
| `accepted` | In force today. Text frozen. | `superseded`, `deprecated` |
| `rejected` | Discussed and declined. Stays in the repo; the value is the recorded reason. | — |
| `superseded` | Replaced by a newer decision. Requires `superseded-by`. | — |
| `deprecated` | No longer applies and nothing replaced it (the problem went away). | — |

Any other transition is an error. A `rejected` ADR that comes back is a **new** decision that
supersedes it, not an edit.

## Immutability

Once `accepted`, only the front-matter changes. Wrong or outdated content → write a new ADR
that supersedes it. The ADR records what was decided **and what was known at the time**;
editing it retroactively leaves git history as the only witness of the original reasoning.
Fixing a typo or a dead link is fine; changing the reasoning or the outcome is not.

## Supersede is two-sided

- New ADR: `supersedes: "0003"`, and its context opens with what changed since 0003.
- Old ADR: `status: superseded`, `superseded-by: "0011"`, `date` updated.

A one-sided chain is a dead end: someone lands on 0003, trusts it, and never finds 0011.

## References

Optional section at the end of the file, present whenever the decision rests on an external
fact (framework version, open issue, maintenance state of a library, benchmark). Start it with
the access date and say, per bullet, what the source supports in this decision. A decision with
no external fact has nothing to cite: delete the section.

## Size

| Section | Budget |
|---|---|
| Context and problem | up to 5 sentences |
| Considered options | 2 to 4 options, one line each |
| Decision | 1 to 3 sentences |
| Consequences | 2 to 5 bullets, one line each |
| References | only what was actually used |

Blowing the budget almost always means two decisions mixed into one file. Split them.
A consequence must be **falsifiable**: something someone could later find out is false.
"More maintainable code" is a wish, not a consequence.

## Maintenance

```bash
ADR=.claude/skills/mass-adr-lifecycle/scripts/adr.py   # the folder holding this skill's SKILL.md
python3 $ADR audit  docs/adr                     # names, front-matter, numbering, chains, index
python3 $ADR index  docs/adr                     # regenerate index.md after any change
python3 $ADR new    docs/adr "Use X instead of Y" --status accepted [--supersedes 0003]
python3 $ADR status docs/adr 0003 deprecated
```
