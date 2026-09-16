import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CliError, EXIT_FAILURE, type LockEntry, type Lockfile } from "./types.js";

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

/** Returns a validation error message for a lock entry, or null if it is well-formed. */
function invalidEntryReason(name: string, value: unknown): string | null {
  if (typeof value !== "object" || value === null) return `entrada "${name}" não é um objeto`;
  const entry = value as Record<string, unknown>;
  const stringFields: (keyof LockEntry)[] = ["version", "contentHash", "ref", "installedAt"];
  for (const field of stringFields) {
    if (typeof entry[field] !== "string") return `entrada "${name}" tem "${field}" inválido`;
  }
  if (!Array.isArray(entry.agents) || !entry.agents.every((a) => typeof a === "string")) {
    return `entrada "${name}" tem "agents" inválido`;
  }
  return null;
}

export function readLock(path: string): Lockfile {
  if (!existsSync(path)) return emptyLock();
  const raw = readFileSync(path, "utf8");

  const fail = (reason: string): never => {
    copyFileSync(path, `${path}.bak`);
    throw new CliError(`Lockfile corrompido em ${path}: ${reason} (backup salvo em ${path}.bak)`, EXIT_FAILURE);
  };

  let parsed: Partial<Lockfile>;
  try {
    parsed = JSON.parse(raw) as Partial<Lockfile>;
  } catch {
    return fail("JSON inválido");
  }
  if (parsed.version !== 1 || typeof parsed.skills !== "object" || parsed.skills === null) {
    return fail("formato inválido");
  }
  for (const [name, entry] of Object.entries(parsed.skills)) {
    const reason = invalidEntryReason(name, entry);
    if (reason) return fail(reason);
  }
  return { version: 1, skills: parsed.skills as Record<string, LockEntry> };
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
