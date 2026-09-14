# Mass Solutions Skills

[Português](README.pt-br.md)

## What is this

The public catalog of [Agent Skills](https://agentskills.io) written and maintained by Mass Solutions. Every skill lives under `skills/<name>/` with a `SKILL.md` that follows the Agent Skills specification, has a declared author, a semver version and a review date, and is validated in CI before it is published. The catalog is browsable at https://maiconsouza89.github.io/mass-solutions-skills/ (English and Portuguese).

Writing to this repository is controlled (protected `main`, code owners, issue before pull request); reading and installing is open to anyone.

## Install

Three ways to install, from most to least verified:

1. **`mass-skills` (verifies integrity, keeps a lockfile)**

   ```bash
   npx github:maiconsouza89/mass-solutions-skills#main install mass-code-review -a claude-code
   ```

   Downloads the files at the pinned ref, checks every file's `sha256` and the skill's `contentHash` against `skills-registry.json`, and records what was installed in `mass-skills.lock.json`. `mass-skills update` never overwrites a skill you edited locally unless you pass `--force`.

2. **`npx skills add` (any of 70+ agents)**

   ```bash
   npx skills add maiconsouza89/mass-solutions-skills --skill mass-code-review
   ```

3. **Claude Code plugin marketplace**

   ```
   /plugin marketplace add maiconsouza89/mass-solutions-skills
   /plugin install mass-solutions-skills@mass-solutions
   ```

Only the `mass-skills` CLI verifies hashes. The other two install whatever the repository serves at that moment, without an integrity check.

## Skills

| Skill | Category | What it does |
| --- | --- | --- |
| `mass-skill-authoring` | Skill authoring | Writes or reviews a skill so it passes the validator |
| `mass-commit-message` | Git workflow | Conventional Commits message from the staged diff |
| `mass-pr-description` | Git workflow | Fills the pull request template from the branch |
| `mass-code-review` | Code quality | Reviews a PR or diff for bugs, missing tests and unsafe changes |
| `mass-security-checklist` | Security | Audits a skill or script against four threat classes |

`skills-registry.json` is the machine-readable index: files, hashes, versions and deprecations.

## Contributing

Issue first, then pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report vulnerabilities through a private security advisory, never a public issue. See [SECURITY.md](SECURITY.md).

## License

Code (`packages/`, `apps/`, `tools/`) is MIT ([LICENSE](LICENSE)). Skill content (`skills/`) is CC-BY-4.0 ([skills/LICENSE](skills/LICENSE)).
