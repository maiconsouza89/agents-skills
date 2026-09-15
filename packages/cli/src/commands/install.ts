import { resolveAgents, type ScopeOptions } from "../agents.js";
import { loadLock, loadRegistry, type Session } from "../context.js";
import { lockEntryFor, lookupSkill, placeSkill, stageSkill, type StagedSkill } from "../installer.js";
import { writeLock } from "../lockfile.js";
import { EXIT_OK } from "../types.js";

export interface InstallOptions {
  agents: string[];
}

/**
 * Install: resolve every name and agent first, stage and verify every skill, and only then write
 * anything into the agent directories and the lockfile. A failure before placement leaves both untouched.
 */
export async function install(s: Session, names: string[], opts: InstallOptions): Promise<number> {
  const agents = resolveAgents(opts.agents, s.ctx.cwd);
  const registry = await loadRegistry(s);
  const skills = names.map((n) => lookupSkill(registry, n));
  const staged: StagedSkill[] = [];
  try {
    for (const skill of skills) staged.push(await stageSkill(s.ctx.env, s.opts.ref, skill, s.fetchImpl));
  } catch (e) {
    for (const st of staged) {
      try {
        const { rmSync } = await import("node:fs");
        rmSync(st.dir, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    }
    throw e;
  }
  const scope: ScopeOptions = { cwd: s.scope.cwd, home: s.scope.home, global: s.opts.global };
  const lock = loadLock(s);
  for (const st of staged) {
    const placed = placeSkill(st, agents, scope);
    lock.skills[st.skill.name] = lockEntryFor(st.skill, s.opts.ref, agents, lock.skills[st.skill.name], s.now);
    s.ctx.stdout.write(`${st.skill.name}@${st.skill.version}: installed to ${placed.join(", ")}\n`);
  }
  writeLock(s.lockFile, lock);
  return EXIT_OK;
}
