#!/usr/bin/env node
// List skills whose `metadata.reviewed` is older than N days (default 90).
// Usage: pnpm stale [--days 90] [--root <repo root>] [--today YYYY-MM-DD]
import { join } from "node:path";
import { catalogDir, listSkillDirs, parseSkill, todayIso } from "@mass-solutions/skills-core";

export interface StaleSkill {
  name: string;
  reviewed: string;
  days: number;
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function staleSkills(root: string, days: number, today: string): StaleSkill[] {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const out: StaleSkill[] = [];
  for (const name of listSkillDirs(root)) {
    const skill = parseSkill(join(catalogDir(root), name));
    const meta = (skill.frontmatter?.metadata ?? {}) as Record<string, unknown>;
    const reviewed = typeof meta.reviewed === "string" ? meta.reviewed : "";
    const reviewedMs = Date.parse(`${reviewed}T00:00:00Z`);
    if (Number.isNaN(reviewedMs)) continue;
    const age = Math.floor((todayMs - reviewedMs) / 86_400_000);
    if (age > days) out.push({ name, reviewed, days: age });
  }
  return out;
}

export function main(argv: string[], out: { write(s: string): unknown } = process.stdout): number {
  const root = flag(argv, "--root") ?? process.cwd();
  const days = Number(flag(argv, "--days") ?? "90");
  const today = flag(argv, "--today") ?? todayIso();
  for (const s of staleSkills(root, days, today)) out.write(`${s.name} - reviewed ${s.reviewed} (${s.days} days)\n`);
  return 0;
}

if (process.argv[1]?.endsWith("stale.ts") || process.argv[1]?.endsWith("stale.js")) {
  process.exit(main(process.argv.slice(2)));
}
