---
status: accepted
date: 2026-09-14
title: "License code under MIT and skill content under CC-BY-4.0"
description: "Why the packages carry MIT while every file under skills/ carries CC-BY-4.0 instead of one license for the whole repository."
supersedes:
superseded-by:
---

# 0006. License code under MIT and skill content under CC-BY-4.0

## Context and problem

The repository ships two different things: software (`@mass-solutions/skills-core`, `@mass-solutions/skills-cli`, the site, the tools) and prose that agents load as instructions (everything under `skills/`). The reason to publish the skills under the Mass Solutions name is attribution, which a permissive software license does not require. A license, once granted on a published version, cannot be withdrawn from those who received it, so the split had to be right at the first release.

## Considered options

- **MIT for code, CC-BY-4.0 for `skills/`** — `LICENSE` at the root is MIT; `skills/LICENSE` is CC-BY-4.0 and every `SKILL.md` carries `license: CC-BY-4.0` in its frontmatter, enforced by the validator.
- **MIT for everything** — one file, simplest for GitHub's license detection, but no attribution requirement on the skill content.
- **CC-BY-4.0 for everything** — attribution everywhere, but Creative Commons discourages its licenses for software and package registries expect an SPDX software license.

## Decision

Chosen **MIT for code and CC-BY-4.0 for skill content**, because attribution is the point of publishing the catalog and MIT keeps the packages installable without friction.

## Consequences

- Good: reusing a skill elsewhere requires crediting Mass Solutions; reusing the CLI or core does not.
- Good: the validator rejects a skill whose `license` is not `CC-BY-4.0`, so no skill ships under a different license by accident.
- Bad: two licenses in one repository confuse tooling; the root `LICENSE` stays plain MIT text so GitHub detects it, and the CC-BY-4.0 notice lives one level down.
- Bad: the published versions cannot be relicensed; a future change applies only to new versions.

## References

Accessed on 2026-09-17.

- [Creative Commons FAQ: Can I apply a CC license to software?](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software) — why CC-BY-4.0 was not used for the code.
