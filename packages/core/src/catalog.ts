import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { CATALOG_DIR, CATEGORIES_FILE, DEPRECATED_FILE } from "./constants.js";
import type { Category, Deprecation } from "./types.js";

export function catalogDir(root: string): string {
  return join(root, CATALOG_DIR);
}

export function readCategories(root: string): Category[] {
  const file = join(catalogDir(root), CATEGORIES_FILE);
  if (!existsSync(file)) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? (parsed as Category[]) : [];
}

export function readDeprecated(root: string): Record<string, Deprecation> {
  const file = join(catalogDir(root), DEPRECATED_FILE);
  if (!existsSync(file)) return {};
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, Deprecation>) : {};
}

/** Skill folder names under `<root>/skills`, sorted; entries starting with `_` and plain files are not skills. */
export function listSkillDirs(root: string): string[] {
  const dir = catalogDir(root);
  if (!existsSync(dir)) throw new Error(`catalog directory not found: ${dir}`);
  return readdirSync(dir)
    .filter((e) => !e.startsWith("_") && !e.startsWith(".") && statSync(join(dir, e)).isDirectory())
    .sort();
}

/** Git index modes for tracked files under `skills/`, keyed by repo-relative path. Undefined outside a git repo. */
export function gitModes(root: string): Map<string, string> | undefined {
  try {
    const out = execFileSync("git", ["-C", root, "ls-files", "-s", "--", CATALOG_DIR], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const map = new Map<string, string>();
    for (const line of out.split("\n")) {
      const m = /^(\d{6}) [0-9a-f]+ \d\t(.+)$/.exec(line);
      if (m) map.set(m[2], m[1]);
    }
    return map;
  } catch {
    return undefined;
  }
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
