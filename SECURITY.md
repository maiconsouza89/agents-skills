# Security policy

## Reporting a vulnerability

Use the repository's **private security advisory**:

https://github.com/maiconsouza89/agents-skills/security/advisories/new

Never open a public issue for a vulnerability: a skill installed into many agents is a supply-chain target, and a public description lands before the fix does. You get a reply within 7 days; the fix ships as a new version of the skill and, when needed, an entry in `skills/_deprecated.json`.

## What is checked

**Validator (`pnpm validate`, on every PR and push)**, with no external service:

- frontmatter with only the keys of the Agent Skills specification, `name` equal to the folder, `description` in the formula, complete `metadata`;
- no binary files;
- secret patterns: AWS keys, GitHub tokens, private keys, `api_key = "..."`;
- dangerous shell: download piped into `sh`/`bash`, decoded and executed payloads, subshell `eval`, environment variables sent over the network;
- prompt-injection phrases ("ignore previous instructions" and the like);
- scripts with `#!` and the executable bit;
- `SKILL.md` size limit.

**Snyk Agent Scan (`security-scan.yml`)** runs `uvx snyk-agent-scan@latest skills --ci --dangerously-run-mcp-servers` on pushes to `main` and on PRs opened from the repository itself. PRs from forks have no access to `SNYK_TOKEN`, so the scan runs after the merge; the validator always runs.

**Integrity at install time**: `skills-registry.json` carries a `sha256` per file and a `contentHash` per skill. The `mass-skills` CLI refuses a download whose hash differs and writes nothing into the agent directory. `npx skills add` and the Claude Code marketplace do not verify hashes.

**Visible on the site**: every skill page shows what the build verified (validator, the scan of that commit with its date and result, recorded hashes, accepted findings, the catalog ref the CLI pins), and `/security/` explains each signal. The site deploys after the scan of the same commit finishes, so the scan badge is never one commit behind; a skipped scan (daily quota) is shown as skipped, not hidden.

## Allowlist for false positives

`security-scan-allowlist.yaml` at the root lists accepted Snyk findings, each with `risk`, `skill`, `reason` and a **required** `expiresAt`. An expired entry fails CI until it is renewed or removed, so no exception becomes permanent by being forgotten.

```yaml
- risk: example-risk-name
  skill: mass-example
  reason: the pattern is documentation, not an instruction
  expiresAt: "2026-12-31"
```

## Scope

Covers the content of `skills/`, the `mass-skills` CLI, the site and the workflows of this repository. Vulnerabilities in the agents that consume the skills should be reported to their respective projects.
