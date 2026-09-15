import { hashFiles } from "@mass-solutions/skills-core";
import { agentById, type ScopeOptions } from "../agents.js";
import { loadLock, loadRegistry, type Session } from "../context.js";
import { installedDir, lockEntryFor, placeSkill, stageSkill } from "../installer.js";
import { writeLock } from "../lockfile.js";
import { compareSemver } from "../paths.js";
import { EXIT_OK, type LockEntry } from "../types.js";

export interface UpdateOptions {
  check: boolean;
  force: boolean;
}

export type UpdateState =
  | { kind: "missing" }
  | { kind: "not-in-registry" }
  | { kind: "deprecated"; since: string; replacedBy: string[] }
  | { kind: "locally-modified"; available?: string }
  | { kind: "update-available"; version: string }
  | { kind: "up-to-date" };

function agentsOf(entry: LockEntry) {
  return entry.agents.map((id) => agentById(id)).filter((a): a is NonNullable<typeof a> => a !== undefined);
}

/** Classify one lock entry against the installed files and the registry. Pure: reads only. */
export function classify(name: string, entry: LockEntry, scope: ScopeOptions, registry: { skills: { name: string; version: string }[]; deprecated: Record<string, { since: string; replacedBy: string[] }> }): UpdateState {
  const agents = agentsOf(entry);
  const dir = agents.map((a) => installedDir(name, a, scope)).find((d) => d !== undefined);
  if (!dir) return { kind: "missing" };
  const dep = registry.deprecated?.[name];
  if (dep) return { kind: "deprecated", since: dep.since, replacedBy: dep.replacedBy };
  const remote = registry.skills.find((s) => s.name === name);
  if (!remote) return { kind: "not-in-registry" };
  const localHash = hashFiles(dir).contentHash;
  const newer = compareSemver(remote.version, entry.version) > 0;
  if (localHash !== entry.contentHash) return { kind: "locally-modified", available: newer ? remote.version : undefined };
  if (newer) return { kind: "update-available", version: remote.version };
  return { kind: "up-to-date" };
}

export function describe(state: UpdateState): string {
  switch (state.kind) {
    case "missing":
      return "missing (run mass-skills install)";
    case "not-in-registry":
      return "not in registry";
    case "deprecated":
      return `deprecated since ${state.since}, use: ${state.replacedBy.join(", ")}`;
    case "locally-modified":
      return "locally modified";
    case "update-available":
      return `update available ${state.version}`;
    case "up-to-date":
      return "up to date";
  }
}

export async function update(s: Session, opts: UpdateOptions): Promise<number> {
  const lock = loadLock(s);
  const registry = await loadRegistry(s);
  const scope: ScopeOptions = { cwd: s.scope.cwd, home: s.scope.home, global: s.opts.global };
  const names = Object.keys(lock.skills).sort();
  if (names.length === 0) {
    s.ctx.stdout.write("No skills installed\n");
    return EXIT_OK;
  }
  let changed = false;
  for (const name of names) {
    const entry = lock.skills[name];
    const state = classify(name, entry, scope, registry);
    if (opts.check) {
      s.ctx.stdout.write(`${name}: ${describe(state)}\n`);
      continue;
    }
    const reinstall = state.kind === "update-available" || (state.kind === "locally-modified" && opts.force);
    if (state.kind === "locally-modified" && !opts.force) {
      s.ctx.stdout.write(`${name}: locally modified, skipped (use --force)\n`);
      continue;
    }
    if (!reinstall) {
      s.ctx.stdout.write(`${name}: ${describe(state)}\n`);
      continue;
    }
    const remote = registry.skills.find((r) => r.name === name)!;
    const staged = await stageSkill(s.ctx.env, s.opts.ref, remote, s.fetchImpl);
    const agents = agentsOf(entry);
    placeSkill(staged, agents, scope);
    lock.skills[name] = lockEntryFor(remote, s.opts.ref, agents, entry, s.now);
    changed = true;
    s.ctx.stdout.write(`${name}: ${state.kind === "locally-modified" ? "overwritten" : "updated"} to ${remote.version}\n`);
  }
  if (changed) writeLock(s.lockFile, lock);
  return EXIT_OK;
}
