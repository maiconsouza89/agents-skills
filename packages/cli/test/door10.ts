/** Plan door 10, written literally so no proof derives its expectation from `src/agents.ts`. */
export const DOOR_10: ReadonlyArray<{ id: string; project: string; global: string }> = [
  { id: "claude-code", project: ".claude/skills", global: ".claude/skills" },
  { id: "cursor", project: ".agents/skills", global: ".cursor/skills" },
  { id: "codex", project: ".agents/skills", global: ".codex/skills" },
  { id: "github-copilot", project: ".agents/skills", global: ".copilot/skills" },
  { id: "opencode", project: ".agents/skills", global: ".config/opencode/skills" },
  { id: "windsurf", project: ".windsurf/skills", global: ".codeium/windsurf/skills" },
  { id: "gemini-cli", project: ".agents/skills", global: ".gemini/skills" },
  { id: "cline", project: ".agents/skills", global: ".agents/skills" },
];
