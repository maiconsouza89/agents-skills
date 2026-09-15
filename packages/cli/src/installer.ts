import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { hashFiles, sha256, type Registry, type RegistrySkill } from "@mass-solutions/skills-core";
import { agentSkillsDir, type Agent, type ScopeOptions } from "./agents.js";
import { fetchFile } from "./download.js";
import { isSafeRelativePath, isSafeSkillName } from "./paths.js";
import { CliError, type LockEntry } from "./types.js";

/** A skill fully downloaded and verified into a temp directory, not yet placed anywhere. */
export interface StagedSkill {
  skill: RegistrySkill;
  dir: string;
}

/** Resolve a name against the registry: deprecated -> exit 1 pointing at the replacement; absent -> exit 2. */
export function lookupSkill(registry: Registry, name: string): RegistrySkill {
  const dep = registry.deprecated?.[name];
  if (dep) {
    throw new CliError(`"${name}" is deprecated since ${dep.since}: ${dep.reason}. Use: ${dep.replacedBy.join(", ")}`, 1);
  }
  const skill = registry.skills.find((s) => s.name === name);
  if (!skill) throw new CliError(`Unknown skill "${name}". Try: mass-skills search ${name}`, 2);
  return skill;
}

function assertSafe(skill: RegistrySkill): void {
  if (!isSafeSkillName(skill.name)) throw new CliError(`Unsafe path: skill name "${skill.name}"`, 1);
  for (const f of skill.files) {
    if (!isSafeRelativePath(f.path)) throw new CliError(`Unsafe path: ${skill.name}/${f.path}`, 1);
  }
}

/**
 * Download every file of a skill into a fresh temp directory and verify each `sha256` and the
 * `contentHash`. Nothing outside the temp directory is touched; on any failure the temp dir is removed.
 */
export async function stageSkill(env: NodeJS.ProcessEnv, ref: string, skill: RegistrySkill, fetchImpl: typeof fetch = fetch): Promise<StagedSkill> {
  assertSafe(skill);
  const dir = mkdtempSync(join(tmpdir(), `mass-skills-${skill.name}-`));
  try {
    for (const f of skill.files) {
      const bytes = await fetchFile(env, ref, skill.path, f.path, fetchImpl);
      if (sha256(bytes) !== f.sha256) throw new CliError(`Integrity check failed for ${skill.name}: ${f.path}`, 1);
      const target = join(dir, f.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
    const { contentHash } = hashFiles(dir);
    if (contentHash !== skill.contentHash) throw new CliError(`Integrity check failed for ${skill.name}: contentHash`, 1);
    return { skill, dir };
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    throw e;
  }
}

/** Copy a staged skill into `<agent skills dir>/<name>/` for each agent, replacing what was there. */
export function placeSkill(staged: StagedSkill, agents: ReadonlyArray<Agent>, scope: ScopeOptions): string[] {
  const placed: string[] = [];
  for (const agent of agents) {
    const base = agentSkillsDir(agent, scope);
    mkdirSync(base, { recursive: true });
    const dest = join(base, staged.skill.name);
    const tmp = join(base, `.${staged.skill.name}.mass-skills-tmp`);
    rmSync(tmp, { recursive: true, force: true });
    cpSync(staged.dir, tmp, { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    renameSync(tmp, dest);
    placed.push(dest);
  }
  rmSync(staged.dir, { recursive: true, force: true });
  return placed;
}

export function lockEntryFor(skill: RegistrySkill, ref: string, agents: ReadonlyArray<Agent>, previous: LockEntry | undefined, now: Date): LockEntry {
  const ids = new Set<string>(previous?.agents ?? []);
  for (const a of agents) ids.add(a.id);
  return {
    version: skill.version,
    contentHash: skill.contentHash,
    ref,
    agents: [...ids],
    installedAt: now.toISOString(),
  };
}

/** Where a lock entry's skill lives for one agent, or undefined when the folder is gone. */
export function installedDir(name: string, agent: Agent, scope: ScopeOptions): string | undefined {
  const dir = join(agentSkillsDir(agent, scope), name);
  return existsSync(dir) ? dir : undefined;
}
