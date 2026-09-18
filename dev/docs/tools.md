# Repository scripts

Two folders hold the repository scripts, split by who runs them:

- `tools/` — what a workflow or the site build runs. Breaking one of these breaks CI or the site.
- `dev/tools/` — what only a maintainer runs on their machine. Nothing in `.github/workflows/`
  or `apps/site` may depend on it.

## Where a new script goes

Ask who calls it. If a workflow, the release or the site build calls it, it goes in `tools/`,
even when maintainers also run it by hand. Otherwise it goes in `dev/tools/`. A script that
starts being called by a workflow moves to `tools/` in the same pull request.

Every script follows the same shape: a header comment with the purpose and a `Usage:` line, an
exported `main(argv, ...)` that returns the exit code (so tests call it without spawning a
process), and a test in `test/repo/<script>.test.ts`. Exit codes are `0` success, `1` failure,
`2` wrong usage. Scripts in `dev/tools/` that a maintainer runs often get a `pnpm` alias in the
root `package.json`.

## `dev/tools/` — local development

| Script | Command | What it does |
|---|---|---|
| `new-skill.ts` | `pnpm new-skill mass-<slug> [--root <dir>]` | Scaffolds `skills/<name>/SKILL.md` and `README.md` with today's `metadata.reviewed` and the first category of `skills/_categories.json`, then runs the validator on the result. Refuses a name that does not match the `mass-` kebab-case rule or a folder that already exists. For a skill still in development, see `dogfooding.md` for where it lives before `skills/`. |
| `stale.ts` | `pnpm stale [--days 90] [--root <dir>] [--today YYYY-MM-DD]` | Prints one line per skill whose `metadata.reviewed` is older than `--days`. Prints nothing when every skill is fresh. Always exits `0`; it reports, it does not gate. |
| `start-issue.ts` | `pnpm start-issue <N> [--base main] [--assignee <login>]` | Reuses the branch already linked to the issue (`feat\|fix\|docs/<N>-…`, remote first, then local) or creates `<type>/<N>-<slug>` from `origin/<base>` and pushes it, then assigns the issue; `project-board.yml` moves it to In Progress. The type comes from the labels (`bug`, `skill-bug` → `fix`; `documentation` → `docs`; otherwise `feat`). Needs a clean working tree and an open issue. In a Claude Code web session (`CLAUDE_CODE_REMOTE=true`) it stays on the current branch and only assigns. The flow around it is in `github-project.md`. |
| `lib/gh.ts` | (imported) | git and GitHub helpers for the scripts above: uses `gh` when present and falls back to `fetch` with `GH_TOKEN`/`GITHUB_TOKEN`. REST only, so it works in the Claude Code cloud sandbox. Test fakes are in `test/repo/lib/gh-fakes.ts`. |

### `dev/tools/spike/` — manual checks

Shell checks of how third-party installers see this repository. They are not part of
`pnpm check` or of any workflow: they need the `claude` CLI or network access, and one of them
changes the local Claude Code installation. Run them by hand before a release that touches
`.claude-plugin/` or the layout of `skills/`.

| Script | What it checks | Side effects |
|---|---|---|
| `export-tree.sh` | Helper: copies what a fresh clone would contain (tracked plus untracked-but-not-ignored files) to a temp dir and prints its path. | A temp dir the caller removes. |
| `claude-plugin-validate.sh` | `claude plugin validate .` exits `0` at the repository root. | None. |
| `claude-plugin-install.sh` | Adding a clone as a marketplace and installing the plugin yields exactly the `skills/mass-*` skills. | Adds the `mass-solutions` marketplace and installs the plugin in your Claude Code, then uninstalls both on exit. Do not run it while you rely on that marketplace entry. |
| `npx-skills-list.sh` | `npx skills add ./ --list` on a clone lists exactly the `skills/mass-*` skills. | Downloads `skills@latest` through `npx`. |

Each prints `PASS: …` or `FAIL: …` and exits non-zero on failure.

## `tools/` — CI and site build

Run them from the repository root with `pnpm exec tsx tools/<script>.ts`. How the workflows
chain them is in `ci-and-release.md`; the allowlist policy is in `SECURITY.md`.

| Script | Usage | What it does | Called by |
|---|---|---|---|
| `allowlist.ts` | `[--file security-scan-allowlist.yaml] [--today YYYY-MM-DD]` | Reads the allowlist and prints `--ignore-risks <ids>` for Snyk Agent Scan (nothing when the list is empty). Exits `1` on a malformed or expired entry, which is how an expired exception fails CI. | `security-scan.yml`; `apps/site` imports `readAllowlist` for `/security/`. |
| `changed-skills.ts` | `git diff --name-only <base> HEAD -- skills \| … --base <base-registry.json> [--head skills-registry.json]` | Prints, on one line, the `skills/<name>` folders a pull request changed: those whose registry `contentHash` moved plus any skill with a touched file from stdin. Emits nothing but `skills/<name>` paths, because the output is word-split into the scanner's arguments. | `security-scan.yml` |
| `security-status.ts` | `--result passed\|failed\|skipped --commit <sha> --run-url <url> [--reason quota] [--scanner-version x.y.z] [--out security-status.json]` | Writes `security-status.json`, the record of one scan run. | `security-scan.yml` writes it and `pages.yml` downloads it; `apps/site` imports `parseSecurityStatus` for the badges and `/security/`. |

`apps/site` reaches the two imported scripts through the `@mass-solutions/tools/*` alias in
`apps/site/astro.config.mjs` and `apps/site/tsconfig.json`, and `test/repo/workflows.test.ts`
pins the `tools/…` paths inside the workflows. Moving or renaming one of these three means
updating all of those together.
