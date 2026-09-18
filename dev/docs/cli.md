# `mass-skills` CLI internals

Package: `packages/cli` (`@mass-solutions/skills-cli`). User-facing reference: `README.md`,
section "CLI reference".

## Entry point

`run(argv, { cwd, env, stdout, stderr })` in `packages/cli/src/run.ts` is the only entry.
`packages/cli/src/bin.ts` is a thin wrapper around it. `run` never calls `process.exit`; it
returns the exit code:

| Code | Meaning |
|---|---|
| `0` | success |
| `1` | execution failure (hash mismatch, deprecated skill, `doctor` found problems) |
| `2` | usage error (unknown skill or agent, no agent detected) |

Run it in development from the repository root, so the lockfile and detected agents are the
ones of the cwd you expect:

```sh
pnpm exec tsx packages/cli/src/bin.ts <args>
```

## Environment variables

- `MASS_SKILLS_BASE_URL` replaces the download base (a mirror of the catalog).
- `MASS_SKILLS_NO_AUDIT=1` turns off the `mass-skills.audit.jsonl` log
  (`packages/cli/src/audit.ts`). A log that cannot be written is a warning on stderr and never
  changes the exit code.

## Guarantees per command

- `install` downloads and verifies (`sha256` per file, then `contentHash` per skill) in a
  temporary directory before writing anything into an agent folder. Any mismatch aborts with
  nothing written.
- `update` only overwrites a skill edited locally when `--force` is passed.
- `remove` only deletes from the agents recorded in the lockfile.

## Catalog ref

The CLI reads the catalog at `v${version}`, where `version` is its own package version
(`DEFAULT_REF` in `packages/cli/src/download.ts`). The release tag must therefore be exactly
`v<version in packages/cli/package.json>`; see `ci-and-release.md` and ADR 0008.
