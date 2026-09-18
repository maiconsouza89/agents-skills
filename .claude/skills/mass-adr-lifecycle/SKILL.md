---
name: mass-adr-lifecycle
description: Creates and maintains Architecture Decision Records (MADR minimal) through their whole lifecycle, bootstrapping the archive, writing new records, moving them through proposed/accepted/rejected/superseded/deprecated and auditing numbering and supersede chains, in any folder and language (default docs/adr/, English). Use whenever the user mentions ADRs or decision records, or asks to "write an ADR", "record this decision", "document why we chose X", "supersede ADR 0003", "deprecate that decision", "audit our ADRs" or "set up ADRs", and also when an expensive-to-reverse architecture choice is being made in the conversation with no record of it. Do NOT use for how-to guides, READMEs or changelogs.
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: docs
  tags: "adr, architecture, decisions, madr, documentation"
  reviewed: "2026-09-17"
---

# ADR lifecycle

An ADR answers one question for whoever arrives in six months: **why is it like this, and
what else was tried?** A record that only says what was chosen is half useless: the reader
re-proposes the rejected options because nothing told them those were already weighed.

## Parameters

| Parameter | How the user passes it | Resolution when absent |
|---|---|---|
| `dir` | `dir=docs/decisions`, or in prose ("save them under docs/decisions") | the archive path declared in `CLAUDE.md` or `AGENTS.md` at the repo root (see below) → `docs/adr/` if it exists → `docs/adr/` (bootstrap) |
| `lang` | `lang=pt-BR`, or in prose ("in Portuguese") | language of the existing archive's `template.md` → `en` |

Paths are relative to the repo root (`git rev-parse --show-toplevel`). The repo declares where
its ADRs live in the agent instructions file it already has, `CLAUDE.md` first, then
`AGENTS.md`: the first line mentioning ADRs or decision records that also contains a path is
the declaration, and the path is the archive (`grep -inE 'adr|decision record' CLAUDE.md
AGENTS.md`). No dedicated dotfile: an agent reads `CLAUDE.md`/`AGENTS.md` anyway, and a
`.adr-dir` nobody opens is one more file to drift. An archive split across two folders or two
languages is worse than either parameter ignored, so: an explicit `dir` that differs from the
declared path and an explicit `lang` that differs from an existing archive are both flagged in
one line, and the existing archive wins unless the user insists.
Front-matter keys, `status` values and file names are always English/ASCII; only prose changes
with `lang`.

## Modes

| Situation | Mode |
|---|---|
| The archive folder does not exist or holds no ADR | **Bootstrap**, then whatever was asked |
| Record a decision | **New** |
| Accept, reject, supersede or deprecate a record | **Status change** |
| "Are the ADRs consistent?", or before adding to an archive you have not inspected | **Audit** |
| A decision is being made in passing, with no record | **Offer** |

The mechanical steps live in `scripts/adr.py` (standard library only). Use it instead of
editing front-matter by hand: it derives the next number, refuses an invalid transition and
closes both sides of a supersede in one run, which is exactly where hand edits go wrong.

```bash
ADR=<skill-dir>/scripts/adr.py   # <skill-dir> is the folder holding this SKILL.md
python3 $ADR audit  DIR
python3 $ADR index  DIR
python3 $ADR new    DIR "Title" [--status proposed|accepted] [--supersedes NNNN] [--description "..."]
python3 $ADR status DIR NNNN accepted|rejected|superseded|deprecated [--by NNNN]
```

## Rules

- **Name**: `NNNN-kebab-case-title.md`, four digits, sequential, never reused even after a
  deletion. The title is the decision in active voice (`0007-use-zod-to-validate-env.md`), not
  the topic (`0007-env-validation.md`), so `ls` reads as a list of decisions.
- **Front-matter**: `status`, `date`, `title`, `description`, `supersedes`, `superseded-by`.
  `date` is the day the record reached its current status. `description` is one sentence,
  "why X instead of Y", for whoever scans the archive without opening files. The two
  supersede keys stay present even when empty, so the chain stays greppable.
- **Lifecycle**: `proposed` → `accepted` | `rejected`; `accepted` → `superseded` |
  `deprecated`; the other three are terminal. A rejected or superseded decision that comes back
  is a new ADR, never an edit.
- **`accepted` is immutable**: only the front-matter changes afterwards. Wrong or outdated
  content means a new ADR that supersedes it. The record documents what was decided and what
  was known at the time; editing it retroactively leaves git history as the only witness, and
  nobody reads `git log` to understand a decision. Typos and dead links may be fixed.
- **Supersede is two-sided**: new ADR carries `supersedes`, old one gets `status: superseded`,
  `superseded-by` and a fresh `date`. `adr.py new --supersedes` does both.
- **Worth an ADR**: expensive to reverse, or someone will question it in six months. Not
  worth one: trivially reversible, "how to do X", or a choice with no real alternative. When in
  doubt, ask; an inflated archive stops being read.

## Writing

An ADR is read once, fast, by someone under pressure. Budget per section:

| Section | Budget |
|---|---|
| Context and problem | up to 5 sentences |
| Considered options | 2 to 4 options, one line each: what it is and why it lost |
| Decision | 1 to 3 sentences |
| Consequences | 2 to 5 bullets, one line each |
| References (optional) | only what was actually used |

Blowing the budget almost always means two decisions in one file; split them. Two habits do
most of the work:

- **Cut the throat-clearing.** No "it is worth noting", no restating the heading, no paragraph
  explaining what an ADR is. Start at the first fact that matters.
- **Consequences must be falsifiable.** "More maintainable code" is a wish. "Invalid env
  aborts boot, so a config error surfaces at deploy, not at 3 a.m. in production" is a
  consequence someone could later find false.

Every claim about the outside world (framework version, open issue, "unmaintained for two
years", benchmark) needs a link under the references section with an access date, because
the premise may stop being true and the date is how the reader knows. Never cite a source you
did not read. Nothing external in play → delete the section.

## Bootstrap

1. Resolve `dir` and `lang`. Create the folder.
2. Copy `assets/<lang>/` (`template.md`, `README.md`, the `0001-*` example ADR) into it. For a
   language without a folder under `assets/`, translate the three `en` files, keeping the
   structure, the front-matter keys and the `NNNN`/`YYYY-MM-DD` placeholders untouched.
3. Replace `YYYY-MM-DD` with today's date in the `0001-*` file (not in `template.md`), and in
   `README.md` replace `<skill-dir>` with the real path of this skill folder (relative to the
   repo root when it lives inside the repo) and `docs/adr` with the real `dir`.
4. Declare the archive in the repo's agent instructions so the next session finds it: add one
   line to `CLAUDE.md` if it exists, else to `AGENTS.md`, else create `AGENTS.md` with that line.
   The line names the folder and the skill, in the file's own language, for example
   `- dev/docs/adr/ — Architecture Decision Records (MADR), maintained with mass-adr-lifecycle`.
   Put it where the file lists the repo layout when it has such a list. Skip when a line
   already declares that path.
5. `adr.py index DIR`. Nothing else: no status folders, no changelog, no hand-written index.

## New

1. Grep the archive for the topic first. If it is already covered, this is a **supersede**
   (`--supersedes NNNN`), not an independent record.
2. Get the real alternatives. If the user named only the winner, ask what else was on the
   table. Never invent plausible options: a fabricated deliberation misleads exactly the future
   reader the ADR exists for. If there truly was no alternative, say so in one line and
   reconsider whether this is an ADR.
3. `adr.py new DIR "Title" --status ... --description "..."`. Use `accepted` when the decision
   is already in force; writing after the fact is normal, do not stage a fake `proposed` phase.
4. Fill in the body in the archive's language, within the budget. In a supersede, the context
   opens with what changed since the old record.
5. `adr.py index DIR`, then report path, number and status.

## Status change

1. `adr.py status DIR NNNN <status> [--by NNNN]`. The script refuses anything outside the
   lifecycle table; when it does, explain the rule in one line and offer the supersede path.
2. Superseding is a New ADR with `--supersedes`, which already updates the old one.
3. If the request is to "fix" an `accepted` ADR, state the immutability rule once, offer the
   supersede, then do what the user decides.
4. `adr.py index DIR`.

## Audit

1. `adr.py audit DIR`. It checks file names, front-matter keys (derived from the archive's own
   `template.md`), status values, ISO dates, the `# NNNN.` heading, required sections, duplicate
   numbers, both sides of every supersede chain, reference bullets without a URL or access
   date, size budgets and a stale `index.md`. Exit code 1 means errors.
2. Then read what the script cannot reach: an `accepted` record describing something the code
   no longer does, or records over budget.
3. Report grouped as **errors** (break the rules) and **suspects** (need a human decision). Fix
   errors on request. Never rewrite the body of an `accepted` ADR to fix drift; that is a
   supersede.

## Offer

When an expensive-to-reverse decision is being made in the conversation and nothing records
it, offer once, in one line, at a natural pause after the work lands:

> This meets the ADR bar (expensive to reverse). Want me to record it in `<dir>`?

If the answer is no, drop it and do not raise it again for that decision. Interrupting delivery
to campaign for documentation is how documentation gets rejected.
