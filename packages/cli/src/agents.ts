import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { CliError } from "./types.js";

/** Plan door 10: agent ids with their project-scope and global-scope skill directories. */
export interface Agent {
  id: string;
  /** Relative to the project cwd. */
  projectDir: string;
  /** Relative to the user's home. */
  globalDir: string;
}

export const AGENTS: ReadonlyArray<Agent> = [
  { id: "claude-code", projectDir: ".claude/skills", globalDir: ".claude/skills" },
  { id: "cursor", projectDir: ".agents/skills", globalDir: ".cursor/skills" },
  { id: "codex", projectDir: ".agents/skills", globalDir: ".codex/skills" },
  { id: "github-copilot", projectDir: ".agents/skills", globalDir: ".copilot/skills" },
  { id: "opencode", projectDir: ".agents/skills", globalDir: ".config/opencode/skills" },
  { id: "windsurf", projectDir: ".windsurf/skills", globalDir: ".codeium/windsurf/skills" },
  { id: "gemini-cli", projectDir: ".agents/skills", globalDir: ".gemini/skills" },
  { id: "cline", projectDir: ".agents/skills", globalDir: ".agents/skills" },
];

export const AGENT_IDS: ReadonlyArray<string> = AGENTS.map((a) => a.id);

/** Project folders whose presence in the cwd selects an agent under `-a auto`. */
const AUTO_MARKERS: ReadonlyArray<{ folder: string; agents: string[] }> = [
  { folder: ".claude", agents: ["claude-code"] },
  { folder: ".agents", agents: ["cursor", "codex", "github-copilot", "opencode", "gemini-cli", "cline"] },
  { folder: ".windsurf", agents: ["windsurf"] },
];

export const NPX_FALLBACK = "npx skills add maiconsouza89/agents-skills";

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

/** Resolve `-a` ids (including `auto`) to agents, or throw the usage error the plan words. */
export function resolveAgents(ids: ReadonlyArray<string>, cwd: string): Agent[] {
  const out: Agent[] = [];
  const push = (a: Agent) => {
    if (!out.includes(a)) out.push(a);
  };
  for (const id of ids) {
    if (id === "auto") {
      const detected = AUTO_MARKERS.filter((m) => existsSync(join(cwd, m.folder))).flatMap((m) => m.agents);
      if (detected.length === 0) {
        throw new CliError(`No agent detected in ${cwd} (looked for .claude/, .agents/, .windsurf/). Supported: ${AGENT_IDS.join(", ")}`, 2);
      }
      for (const d of detected) push(agentById(d)!);
      continue;
    }
    const agent = agentById(id);
    if (!agent) {
      throw new CliError(`Unsupported agent "${id}". Supported: ${AGENT_IDS.join(", ")}. For other agents use: ${NPX_FALLBACK}`, 2);
    }
    push(agent);
  }
  return out;
}

export interface ScopeOptions {
  cwd: string;
  home: string;
  global: boolean;
}

/** Absolute skills directory for an agent in the requested scope. */
export function agentSkillsDir(agent: Agent, scope: ScopeOptions): string {
  return scope.global ? join(scope.home, agent.globalDir) : join(scope.cwd, agent.projectDir);
}

/** Real path of the deepest existing ancestor of `dir`, for a directory that may not exist yet. */
function realBase(dir: string): string {
  let p = resolve(dir);
  for (;;) {
    try {
      return realpathSync(p);
    } catch {
      const parent = dirname(p);
      if (parent === p) return p;
      p = parent;
    }
  }
}

/** True when `dir` resolves to `root` or somewhere under it, following symlinks. */
function isInside(dir: string, root: string): boolean {
  const rel = relative(realBase(root), realBase(dir));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * Refuse to create, replace or delete anything through a project-scope skills directory that a
 * symlink puts outside the project. Global scope writes under the user's home on purpose.
 */
export function assertWritableSkillsDir(agent: Agent, scope: ScopeOptions): string {
  const dir = agentSkillsDir(agent, scope);
  if (!scope.global && !isInside(dir, scope.cwd)) {
    throw new CliError(`Refusing to write to ${agent.projectDir}: it resolves to ${realBase(dir)}, outside the project at ${realBase(scope.cwd)}`, 1);
  }
  return dir;
}
