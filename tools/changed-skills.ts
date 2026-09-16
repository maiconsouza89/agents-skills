#!/usr/bin/env node
// Pick the skill directories Snyk Agent Scan has to look at on a pull request: the ones whose
// registry contentHash moved, plus any skill with a touched file (read from stdin, one path per
// line) so a stale skills-registry.json can never hide a change. Prints the paths on one line,
// space separated, ready to be word-split into the scanner's arguments; prints nothing when the
// pull request touches no skill at all.
// Usage: git diff --name-only <base> HEAD -- skills | pnpm exec tsx tools/changed-skills.ts --base <base-registry.json> [--head skills-registry.json]
import { readFileSync } from "node:fs";
import type { Registry, RegistrySkill } from "@mass-solutions/skills-core";

// The paths become bare shell words in the workflow; only ever emit a plain catalog directory.
const SAFE_PATH = /^skills\/[a-z0-9]+(-[a-z0-9]+)*$/;

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function readRegistry(file: string): Registry {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed?.skills)) throw new Error(`${file}: expected a registry with a "skills" list`);
  for (const s of parsed.skills as RegistrySkill[]) {
    if (typeof s?.path !== "string" || typeof s?.contentHash !== "string") {
      throw new Error(`${file}: every skill needs a "path" and a "contentHash"`);
    }
  }
  return parsed as Registry;
}

/** Paths of the head skills that changed against the base, by contentHash or by a touched file. */
export function changedSkills(base: Registry, head: Registry, touched: ReadonlyArray<string> = []): string[] {
  const before = new Map(base.skills.map((s) => [s.path, s.contentHash]));
  const changed = head.skills.filter(
    (s) => before.get(s.path) !== s.contentHash || touched.some((f) => f === s.path || f.startsWith(`${s.path}/`)),
  );
  for (const s of changed) {
    if (!SAFE_PATH.test(s.path)) throw new Error(`refusing to scan an unexpected skill path: ${s.path}`);
  }
  return [...new Set(changed.map((s) => s.path))].sort();
}

export function main(
  argv: string[],
  stdin: string,
  out: { write(s: string): unknown } = process.stdout,
  err: { write(s: string): unknown } = process.stderr,
): number {
  const baseFile = flag(argv, "--base");
  if (!baseFile) {
    err.write("Usage: tools/changed-skills.ts --base <base-registry.json> [--head skills-registry.json]\n");
    return 2;
  }
  const headFile = flag(argv, "--head") ?? "skills-registry.json";
  const touched = stdin.split("\n").map((l) => l.trim()).filter(Boolean);
  let paths: string[];
  try {
    paths = changedSkills(readRegistry(baseFile), readRegistry(headFile), touched);
  } catch (e) {
    err.write(`${(e as Error).message}\n`);
    return 1;
  }
  if (paths.length > 0) out.write(`${paths.join(" ")}\n`);
  return 0;
}

if (process.argv[1]?.endsWith("changed-skills.ts") || process.argv[1]?.endsWith("changed-skills.js")) {
  const stdin = process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  process.exit(main(process.argv.slice(2), stdin));
}
