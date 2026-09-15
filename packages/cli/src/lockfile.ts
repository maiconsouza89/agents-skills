import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Lockfile } from "./types.js";

export const PROJECT_LOCK = "mass-skills.lock.json";
export const GLOBAL_LOCK_DIR = "mass-skills";
export const GLOBAL_LOCK_FILE = "lock.json";

export interface LockScope {
  cwd: string;
  home: string;
  env: NodeJS.ProcessEnv;
  global: boolean;
}

/** `mass-skills.lock.json` in the project, or `$XDG_CONFIG_HOME/mass-skills/lock.json` (default `~/.config/...`). */
export function lockPath(scope: LockScope): string {
  if (!scope.global) return join(scope.cwd, PROJECT_LOCK);
  const configHome = scope.env.XDG_CONFIG_HOME?.trim() || join(scope.home, ".config");
  return join(configHome, GLOBAL_LOCK_DIR, GLOBAL_LOCK_FILE);
}

export function emptyLock(): Lockfile {
  return { version: 1, skills: {} };
}

export function readLock(path: string): Lockfile {
  if (!existsSync(path)) return emptyLock();
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<Lockfile>;
  return { version: 1, skills: parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {} };
}

/** Atomic write: serialize to `<path>.tmp`, then rename over the target. */
export function writeLock(path: string, lock: Lockfile): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  const sorted: Lockfile = { version: 1, skills: {} };
  for (const name of Object.keys(lock.skills).sort()) sorted.skills[name] = lock.skills[name];
  writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmp, path);
}
