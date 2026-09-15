import { rmSync } from "node:fs";
import { join } from "node:path";
import { agentById, agentSkillsDir, type ScopeOptions } from "../agents.js";
import { loadLock, type Session } from "../context.js";
import { writeLock } from "../lockfile.js";
import { CliError, EXIT_OK } from "../types.js";

export async function remove(s: Session, names: string[]): Promise<number> {
  const lock = loadLock(s);
  const scope: ScopeOptions = { cwd: s.scope.cwd, home: s.scope.home, global: s.opts.global };
  for (const name of names) {
    if (!lock.skills[name]) throw new CliError(`"${name}" is not in ${s.lockFile}`, 2);
  }
  for (const name of names) {
    const entry = lock.skills[name];
    for (const id of entry.agents) {
      const agent = agentById(id);
      if (!agent) continue;
      rmSync(join(agentSkillsDir(agent, scope), name), { recursive: true, force: true });
    }
    delete lock.skills[name];
    s.ctx.stdout.write(`${name}: removed from ${entry.agents.join(", ")}\n`);
  }
  writeLock(s.lockFile, lock);
  return EXIT_OK;
}
