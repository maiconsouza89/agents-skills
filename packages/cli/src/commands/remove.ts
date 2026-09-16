import { rmSync } from "node:fs";
import { join } from "node:path";
import { agentById, assertWritableSkillsDir, type ScopeOptions } from "../agents.js";
import { audit } from "../audit.js";
import { loadLock, type Session } from "../context.js";
import { writeLock } from "../lockfile.js";
import { CliError, EXIT_OK } from "../types.js";

export async function remove(s: Session, names: string[]): Promise<number> {
  const lock = loadLock(s);
  const scope: ScopeOptions = { cwd: s.scope.cwd, home: s.scope.home, global: s.opts.global };
  for (const name of names) {
    if (!lock.skills[name]) {
      const error = new CliError(`"${name}" is not in ${s.lockFile}`, 2);
      audit(s, { command: "remove", skill: name, result: "failed", error });
      throw error;
    }
  }
  for (const name of names) {
    const entry = lock.skills[name];
    try {
      for (const id of entry.agents) {
        const agent = agentById(id);
        if (!agent) continue;
        rmSync(join(assertWritableSkillsDir(agent, scope), name), { recursive: true, force: true });
      }
    } catch (e) {
      audit(s, { command: "remove", skill: name, version: entry.version, ref: entry.ref, agents: entry.agents, result: "failed", error: e });
      writeLock(s.lockFile, lock);
      throw e;
    }
    delete lock.skills[name];
    s.ctx.stdout.write(`${name}: removed from ${entry.agents.join(", ")}\n`);
    audit(s, {
      command: "remove",
      skill: name,
      version: entry.version,
      contentHash: entry.contentHash,
      ref: entry.ref,
      agents: entry.agents,
      result: "ok",
    });
  }
  writeLock(s.lockFile, lock);
  return EXIT_OK;
}
