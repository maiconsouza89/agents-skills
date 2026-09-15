<h1 align="center">Mass Solutions Skills</h1>

<p align="center">
  <strong>A small, verified catalog of Agent Skills for AI coding agents</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mass-solutions/skills-cli"><img src="https://img.shields.io/npm/v/@mass-solutions/skills-cli?style=flat-square&color=5e6ad2&label=mass-skills" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@mass-solutions/skills-cli"><img src="https://img.shields.io/npm/dm/@mass-solutions/skills-cli?style=flat-square&color=5e6ad2" alt="monthly downloads" /></a>
  <a href="https://github.com/maiconsouza89/agents-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/maiconsouza89/agents-skills/ci.yml?branch=main&style=flat-square&label=ci" alt="ci status" /></a>
  <a href="https://github.com/maiconsouza89/agents-skills/actions/workflows/security-scan.yml"><img src="https://img.shields.io/github/actions/workflow/status/maiconsouza89/agents-skills/security-scan.yml?branch=main&style=flat-square&label=security%20scan" alt="security scan status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/maiconsouza89/agents-skills?style=flat-square" alt="license" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22.12-brightgreen?style=flat-square&logo=node.js" alt="node version" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript" alt="typescript" />
  <img src="https://img.shields.io/badge/skills-CC--BY--4.0-lightgrey?style=flat-square" alt="skills license" />
  <a href="https://github.com/maiconsouza89/agents-skills/commits/main"><img src="https://img.shields.io/github/last-commit/maiconsouza89/agents-skills?style=flat-square" alt="last commit" /></a>
</p>

<p align="center">
  Every skill here has a declared author, a semver version and a review date. It is validated in CI,
  scanned for secrets, dangerous shell and prompt injection, and installed with a <b>per-file hash check</b>
  and a <b>lockfile</b>. Small on purpose: nothing enters the catalog without an issue, a review and the validator.
</p>

<p align="center">
  <a href="https://maiconsouza89.github.io/agents-skills/"><strong>Browse the catalog</strong></a>
</p>

## Table of contents

- [What are skills?](#what-are-skills)
- [Security and trust](#security-and-trust)
- [Supported agents](#supported-agents)
- [Skills in the catalog](#skills-in-the-catalog)
- [Quick start](#quick-start)
- [CLI reference](#cli-reference)
- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Contributing](#contributing)
- [Reporting a vulnerability](#reporting-a-vulnerability)
- [License and attribution](#license-and-attribution)

## What are skills?

Skills are packaged instructions that extend what an AI coding agent knows how to do. Think of them as plugins for your assistant: a `SKILL.md` teaches the agent a workflow, a contract or a checklist, and the agent loads it only when the task matches the skill's description.

This catalog follows the open [Agent Skills](https://agentskills.io) specification, so the same folder works in Claude Code, Cursor, Codex, Copilot and any other agent that reads `SKILL.md`.

```
skills/
  mass-<name>/
    SKILL.md          ← frontmatter (name, description, version, review date) + short instructions
    references/       ← longer material the agent reads on demand
    evals/            ← trigger tests used by the maintainers
```

Every skill name starts with `mass-`, and every description follows the same formula so the agent knows exactly when to use it and when not to: *what it does, use when "a", "b" or "c", do not use for X (use another skill)*.

## Security and trust

A skill installed into many agents is a supply-chain target. This repository treats it that way:

| Layer | What it checks | Where |
| --- | --- | --- |
| **Validator** (every PR and push, no external service) | Frontmatter contract, no binaries, secret patterns (AWS keys, GitHub tokens, private keys), dangerous shell (`curl \| sh`, decoded payloads, `eval`), prompt-injection phrases, executable bit on scripts, `SKILL.md` size limit | `pnpm validate` |
| **Snyk Agent Scan** | Independent static scan of every skill on `main` and on internal PRs | `security-scan.yml` |
| **Integrity at install time** | `sha256` per file and `contentHash` per skill, recorded in `skills-registry.json`; the CLI refuses a download whose hash differs and writes nothing | `mass-skills install` |
| **Lockfile** | What was installed, from which ref, into which agents; `update` never overwrites a skill you edited unless you pass `--force` | `mass-skills.lock.json` |
| **Expiring allowlist** | Accepted scanner findings need a reason and an `expiresAt`; an expired entry fails CI | `security-scan-allowlist.yaml` |
| **Governance** | Protected `main`, code owners, issue before pull request, weekly report of skills not reviewed in 90 days | `CODEOWNERS`, `stale-skills.yml` |

Only the `mass-skills` CLI verifies hashes. `npx skills add` and the Claude Code marketplace install whatever the repository serves at that moment.

→ Full threat model and reporting process: [SECURITY.md](SECURITY.md)

## Supported agents

`mass-skills` writes directly into the skill directory of these agents. Use `-a auto` to detect them from the folders present in your project.

| Agent | `-a` id | Project scope | Global scope (`-g`) |
| --- | --- | --- | --- |
| [Claude Code](https://claude.ai/code) | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| [Cursor](https://cursor.com) | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| [OpenAI Codex](https://openai.com/codex/) | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| [GitHub Copilot](https://github.com/features/copilot) | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| [OpenCode](https://opencode.ai) | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| [Windsurf](https://windsurf.com) | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| [Cline](https://github.com/cline/cline) | `cline` | `.agents/skills/` | `~/.agents/skills/` |

Any other agent that supports the Agent Skills spec can use the [`npx skills add`](#2-npx-skills-add-any-agent-that-reads-skillmd) path below. Missing yours in the CLI? [Open an issue](https://github.com/maiconsouza89/agents-skills/issues/new/choose).

## Skills in the catalog

The catalog is browsable at **https://maiconsouza89.github.io/agents-skills/**, with search and category filters, in English and Portuguese. Each skill page shows its description, version, review date and the exact install command.

From the terminal, `mass-skills list` prints every skill and `mass-skills search <term>` matches by name, description or tag. `skills-registry.json` is the machine-readable index: files, hashes, versions, tags and deprecations.

## Quick start

Three ways to install, from most to least verified.

### 1. `mass-skills` (verifies hashes, keeps a lockfile)

```bash
# install one skill into the agents detected in the current project
npx @mass-solutions/skills-cli install mass-code-review

# install several skills into specific agents
npx @mass-solutions/skills-cli install mass-commit-message mass-pr-description -a claude-code cursor

# install for the whole user account instead of one project
npx @mass-solutions/skills-cli install mass-code-review -a claude-code -g
```

Optionally install it once and use the shorter name:

```bash
npm install -g @mass-solutions/skills-cli
mass-skills list
```

### 2. `npx skills add` (any agent that reads `SKILL.md`)

```bash
npx skills add maiconsouza89/agents-skills --skill mass-code-review
```

Works with 70+ agents, without hash verification.

### 3. Claude Code plugin marketplace

```
/plugin marketplace add maiconsouza89/agents-skills
/plugin install mass-solutions-skills@mass-solutions
```

Installs the whole catalog as one plugin.

## CLI reference

```bash
# Browse the catalog
mass-skills list                          # every skill: name, version, category, description
mass-skills search review                 # match by name, description or tag

# Install
mass-skills install mass-code-review                       # -a auto: detects .claude/, .agents/, .windsurf/
mass-skills install mass-code-review -a claude-code cursor # explicit agents
mass-skills install mass-code-review -g                    # user-level directories and lockfile
mass-skills install mass-code-review --ref v0.1.0          # read the catalog at another git ref

# Keep it up to date
mass-skills update --check                # print the state of each installed skill, change nothing
mass-skills update                        # reinstall skills with a newer catalog version
mass-skills update --force                # also overwrite skills you edited locally

# Inspect and remove
mass-skills doctor                        # ok | missing | modified | deprecated, per skill
mass-skills remove mass-code-review       # delete from every agent recorded in the lockfile

# Maintainer mirrors of the repo scripts
mass-skills validate [dir]                # same rules and exit codes as pnpm validate
mass-skills registry --check              # fail when skills-registry.json is out of date

mass-skills --help
```

Exit codes: `0` success, `1` execution failure (hash mismatch, deprecated skill, doctor found problems), `2` usage error (unknown skill or agent, no agent detected).

The lockfile is `mass-skills.lock.json` in the project, or `~/.config/mass-skills/lock.json` with `-g`. `MASS_SKILLS_BASE_URL` points the CLI at a mirror of the catalog.

## How it works

1. **Resolve.** The CLI reads `skills-registry.json` at the requested ref (default `main`) and resolves every skill name and agent id before touching anything. A deprecated skill is refused with a pointer to its replacement.
2. **Stage and verify.** Each file is downloaded into a temporary directory and its `sha256` compared with the registry; then the whole skill's `contentHash` is checked. Any mismatch aborts the run with nothing written.
3. **Place.** Verified skills are copied into the skill directory of each target agent, in project or global scope.
4. **Lock.** `mass-skills.lock.json` records the version, ref, hash and agents. `update`, `doctor` and `remove` work from this file, so the CLI only ever touches what it installed.

## Repository layout

```
skills/            the catalog, one folder per skill, plus _categories.json and _deprecated.json
packages/core      @mass-solutions/skills-core: frontmatter parsing, validator, hashing, registry
packages/cli       @mass-solutions/skills-cli: the mass-skills command
apps/site          Astro site, English and Portuguese, built from the catalog
tools/             maintainer scripts (new-skill, stale, allowlist)
.claude-plugin/    Claude Code marketplace manifest
skills-registry.json   generated index, committed
```

Maintainer commands: `pnpm check` (validator, registry check, tests), `pnpm registry` (regenerate the index after any skill change), `pnpm new-skill mass-<slug>` (scaffold a skill that already passes the contract), `pnpm build`.

## Contributing

Issue first, then pull request. Open a *Skill proposal* or *Skill bug* issue; a maintainer agrees on the issue before a PR is opened. Skills are written in English, pass `pnpm check`, and bump `metadata.version` and `metadata.reviewed` on every content change.

→ Full workflow, versioning rules and commit convention: [CONTRIBUTING.md](CONTRIBUTING.md)

## Reporting a vulnerability

Use the repository's [private security advisory](https://github.com/maiconsouza89/agents-skills/security/advisories/new), never a public issue. You get a reply within 7 days; a fix ships as a new skill version and, when needed, a deprecation entry.

→ [SECURITY.md](SECURITY.md)

## License and attribution

- **Code** (`packages/`, `apps/`, `tools/`): [MIT](LICENSE).
- **Skill content** (`skills/`): [Creative Commons Attribution 4.0 (CC-BY-4.0)](skills/LICENSE). Reuse it freely, keep the attribution to Mass Solutions.

If you are the author of any content included here and want it updated or removed, [open an issue](https://github.com/maiconsouza89/agents-skills/issues/new/choose).

---

<p align="center">
  <sub>Maintained by Mass Solutions</sub>
</p>
