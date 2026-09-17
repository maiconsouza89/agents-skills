# @mass-solutions/skills-cli

## 0.2.0

### Minor Changes

- 1d8a181: `install`, `update` and `remove` append a JSON Lines audit entry per skill to `mass-skills.audit.jsonl` (or `~/.config/mass-skills/audit.jsonl` with `-g`), which `MASS_SKILLS_NO_AUDIT=1` turns off.

### Patch Changes

- 20e3689: Refuse to install, update or remove through a project-scope agent skills directory that a symlink puts outside the project.

## 0.1.3

### Patch Changes

- Publish from the release workflow with npm trusted publishing (OIDC) and provenance instead of by hand.

## 0.1.2

### Patch Changes

- Bump so the published version has a matching `v<version>` tag, keeping the pinned catalog ref from #33 installable.
