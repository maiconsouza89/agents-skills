#!/usr/bin/env node
// Triage an issue in one step: write its priority:, area: and complexity: labels.
// project-fields.yml mirrors each label onto the matching field of the project board, so this
// script never talks to Projects v2 - it only touches repos/{owner}/{repo}/... paths, which is
// what makes it behave the same in a local shell and in a Claude Code web session, whose GitHub
// proxy rejects every other path shape.
// Classify first: mass-issue-priority and mass-issue-complexity for those two, and the title
// prefix rule in CLAUDE.md for Area.
// Usage: pnpm triage-issue <number> [--priority <p0|p1|p2|backlog>] [--area <cli|core|site|ci|catalog>] [--complexity <low|medium|high>]
import { defaultExec, ghApi, ownerAndName, type Exec, type FetchLike } from "./lib/gh.js";

export type { Exec, FetchLike };

const FAMILIES = {
  priority: ["p0", "p1", "p2", "backlog"],
  area: ["cli", "core", "site", "ci", "catalog"],
  complexity: ["low", "medium", "high"],
} as const;
type Family = keyof typeof FAMILIES;

const USAGE =
  "Usage: pnpm triage-issue <number> [--priority <p0|p1|p2|backlog>] [--area <cli|core|site|ci|catalog>] [--complexity <low|medium|high>]\n";

interface Out {
  write(s: string): unknown;
}

interface Issue {
  labels: Array<{ name: string }>;
  pull_request?: unknown;
}

export async function main(
  argv: string[],
  out: Out = process.stdout,
  exec: Exec = defaultExec,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<number> {
  const wanted = new Map<Family, string>();
  let numberArg: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const family = arg.slice(2) as Family;
      const value = argv[++i]?.toLowerCase();
      if (!(family in FAMILIES) || !value || !(FAMILIES[family] as readonly string[]).includes(value)) {
        out.write(USAGE);
        return 2;
      }
      wanted.set(family, value);
    } else if (numberArg === undefined) {
      numberArg = arg;
    } else {
      out.write(USAGE);
      return 2;
    }
  }
  const number = Number(numberArg);
  if (!Number.isInteger(number) || number <= 0 || wanted.size === 0) {
    out.write(USAGE);
    return 2;
  }

  try {
    const { owner, name: repo } = ownerAndName(exec("git", ["remote", "get-url", "origin"]));
    const path = `repos/${owner}/${repo}/issues/${number}`;
    const issue = (await ghApi(exec, fetchImpl, env, "GET", path, ["api", path])) as Issue;
    if (issue.pull_request) {
      out.write(`#${number} is a pull request, not an issue.\n`);
      return 1;
    }

    // Families in a fixed order, so the message and the request read the same way every run.
    const added = (Object.keys(FAMILIES) as Family[]).filter((f) => wanted.has(f)).map((f) => `${f}:${wanted.get(f)}`);
    const current = issue.labels.map((l) => l.name);
    const replaced = current.filter((l) => [...wanted.keys()].some((f) => l.toLowerCase().startsWith(`${f}:`)) && !added.includes(l));
    const labels = [...current.filter((l) => !replaced.includes(l) && !added.includes(l)), ...added];

    const labelsPath = `${path}/labels`;
    await ghApi(
      exec,
      fetchImpl,
      env,
      "PUT",
      labelsPath,
      ["api", "-X", "PUT", labelsPath, ...labels.flatMap((l) => ["-f", `labels[]=${l}`])],
      { labels },
    );

    const suffix = replaced.length ? ` (replaced ${replaced.join(", ")})` : "";
    out.write(`#${number}: set ${added.join(", ")} — project-fields.yml mirrors them on the board${suffix}\n`);
    return 0;
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    out.write(`triage-issue failed: ${err.stderr?.trim() || err.message}\n`);
    return 1;
  }
}

if (process.argv[1]?.endsWith("triage-issue.ts") || process.argv[1]?.endsWith("triage-issue.js")) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
