#!/usr/bin/env node
// Turn security-scan-allowlist.yaml into `--ignore-risks` flags for Snyk Agent Scan, failing on any expired entry.
// Usage: pnpm exec tsx tools/allowlist.ts [--file security-scan-allowlist.yaml] [--today YYYY-MM-DD]
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { todayIso } from "@mass-solutions/skills-core";

export interface AllowlistEntry {
  risk: string;
  skill: string;
  reason: string;
  expiresAt: string;
}

const REQUIRED: Array<keyof AllowlistEntry> = ["risk", "skill", "reason", "expiresAt"];

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function readAllowlist(file: string): AllowlistEntry[] {
  const parsed = parse(readFileSync(file, "utf8"));
  if (parsed == null) return [];
  if (!Array.isArray(parsed)) throw new Error(`${file}: expected a list of entries`);
  return parsed.map((e, i) => {
    for (const k of REQUIRED) {
      if (typeof e?.[k] !== "string" || e[k].length === 0) throw new Error(`${file}: entry ${i + 1} is missing "${k}"`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.expiresAt)) throw new Error(`${file}: entry ${i + 1} has a malformed expiresAt "${e.expiresAt}"`);
    return e as AllowlistEntry;
  });
}

export function main(
  argv: string[],
  out: { write(s: string): unknown } = process.stdout,
  err: { write(s: string): unknown } = process.stderr,
): number {
  const file = flag(argv, "--file") ?? "security-scan-allowlist.yaml";
  const today = flag(argv, "--today") ?? todayIso();
  let entries: AllowlistEntry[];
  try {
    entries = readAllowlist(file);
  } catch (e) {
    err.write(`${(e as Error).message}\n`);
    return 1;
  }
  const expired = entries.filter((e) => e.expiresAt < today);
  for (const e of expired) err.write(`Allowlist entry expired: ${e.risk} ${e.skill} ${e.expiresAt}\n`);
  if (expired.length > 0) return 1;
  const risks = [...new Set(entries.map((e) => e.risk))];
  if (risks.length > 0) out.write(`--ignore-risks ${risks.join(",")}\n`);
  return 0;
}

if (process.argv[1]?.endsWith("allowlist.ts") || process.argv[1]?.endsWith("allowlist.js")) {
  process.exit(main(process.argv.slice(2)));
}
