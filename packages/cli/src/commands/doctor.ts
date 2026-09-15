import { hashFiles } from "@mass-solutions/skills-core";
import { agentById, type ScopeOptions } from "../agents.js";
import { loadLock, loadRegistry, type Session } from "../context.js";
import { installedDir } from "../installer.js";
import { EXIT_FAILURE, EXIT_OK, type LockEntry } from "../types.js";

export type DoctorState = "ok" | "missing" | "modified" | "deprecated";

/** Priority: missing > modified > deprecated > ok, checked across every agent the entry names. */
export function diagnose(name: string, entry: LockEntry, scope: ScopeOptions, deprecated: Record<string, unknown>): DoctorState {
  const agents = entry.agents.map((id) => agentById(id)).filter((a): a is NonNullable<typeof a> => a !== undefined);
  let modified = false;
  for (const agent of agents) {
    const dir = installedDir(name, agent, scope);
    if (!dir) return "missing";
    if (hashFiles(dir).contentHash !== entry.contentHash) modified = true;
  }
  if (modified) return "modified";
  if (deprecated?.[name]) return "deprecated";
  return "ok";
}

export async function doctor(s: Session): Promise<number> {
  const lock = loadLock(s);
  const registry = await loadRegistry(s);
  const scope: ScopeOptions = { cwd: s.scope.cwd, home: s.scope.home, global: s.opts.global };
  let problems = 0;
  for (const name of Object.keys(lock.skills).sort()) {
    const state = diagnose(name, lock.skills[name], scope, registry.deprecated ?? {});
    if (state !== "ok") problems++;
    s.ctx.stdout.write(`${name}: ${state}\n`);
  }
  return problems > 0 ? EXIT_FAILURE : EXIT_OK;
}
