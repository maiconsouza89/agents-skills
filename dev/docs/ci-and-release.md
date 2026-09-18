# CI and release

All workflows live in `.github/workflows/`. `test/repo/workflows.test.ts` pins their shape.

## Workflows

- **`ci.yml`** (pull requests and `main`): `pnpm check`, `pnpm build`, `plugin validate`. No
  secrets.
- **`security-scan.yml`**: `tools/allowlist.ts` always; Snyk Agent-Scan on the skills a pull
  request changed (`tools/changed-skills.ts`) and on the whole catalog on `main`. Error `X007`
  (Snyk daily quota) does not block. Outside pull requests it writes `security-status.json`
  (`tools/security-status.ts`: `passed`, `failed` or `skipped` with a `reason`) even when the
  scan fails, and uploads it as the `security-status` artifact for the site.
- **`pages.yml`** (`workflow_run` of `security-scan` on `main`, or `workflow_dispatch`):
  downloads the `security-status` artifact of the run that triggered it into the repository
  root and deploys the site to GitHub Pages from the scanned commit. Without the artifact the
  site says "not scanned in this build".
- **`triage.yml`**: runs when an issue is opened; see `github-project.md`.
- **`project-board.yml`**: moves an issue to In Progress when `pnpm start-issue` assigns it.
- **`stale-skills.yml`** (Monday 09:00 UTC): feeds the `Stale skills` issue.
- **`release.yml`** (tag `v*`): `pnpm check`, `pnpm build`, publishes the packages to npm with
  trusted publishing (OIDC, `--provenance`) and creates the GitHub Release. Aborts if the tag
  does not match `packages/cli/package.json` or if any tarball contains `workspace:`.
  Re-running the same tag is safe.

## Release flow

Never publish to npm by hand; only `release.yml` publishes.

1. `pnpm changeset` on each change to `packages/core` or `packages/cli` (catalog skills have
   their own `metadata.version` and do not go through changesets).
2. `pnpm changeset version`, `pnpm check`, `pnpm build`.
3. Pull request with the version bump, merged into `main`.
4. `git tag v<version> && git push origin v<version>`. The tag must equal the CLI version, because
   the CLI downloads the catalog at `v<its own version>` (`cli.md`).
5. After the tag: `npx @mass-solutions/skills-cli update` and commit `mass-skills.lock.json`
   with the installed folders, so the dogfooding follows the catalog (`dogfooding.md`).
