import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashFiles } from "@mass-solutions/skills-core";
import { describe, expect, it } from "vitest";

// The repository installs its own catalog with `mass-skills` (see "Dogfooding" in CLAUDE.md):
// every skill in skills/ is tracked in mass-skills.lock.json and copied, unchanged, into the
// project directories of the supported agents. Everything below runs offline.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const LOCK = join(ROOT, "mass-skills.lock.json");
const INSTALL_DIRS = [".claude/skills", ".agents/skills"];

interface Lock {
  version: number;
  skills: Record<string, { version: string; contentHash: string; ref: string; agents: string[] }>;
}

function skillFolders(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

const lock = JSON.parse(readFileSync(LOCK, "utf8")) as Lock;
const locked = Object.keys(lock.skills).sort();

describe("dogfooding", () => {
  it("the lockfile tracks exactly the skills of the catalog", () => {
    expect(lock.version).toBe(1);
    expect(locked).toEqual(skillFolders("skills"));
  });

  it("every locked skill is installed for claude-code and for the .agents/skills agents", () => {
    for (const name of locked) {
      expect(lock.skills[name].agents, name).toContain("claude-code");
      expect(lock.skills[name].agents.length, name).toBeGreaterThan(1);
    }
  });

  it.each(INSTALL_DIRS)("%s holds every locked skill with the locked contentHash and nothing else", (dir) => {
    expect(skillFolders(dir)).toEqual(locked);
    for (const name of locked) {
      const installed = join(ROOT, dir, name);
      expect(existsSync(join(installed, "SKILL.md")), name).toBe(true);
      expect(hashFiles(installed).contentHash, `${dir}/${name}`).toBe(lock.skills[name].contentHash);
    }
  });

  it("the installed copies and the lockfile are committed, the audit log is not", () => {
    const tracked = execFileSync("git", ["-C", ROOT, "ls-files", "--", "mass-skills.lock.json", ...INSTALL_DIRS], { encoding: "utf8" })
      .trim()
      .split("\n");
    expect(tracked).toContain("mass-skills.lock.json");
    for (const dir of INSTALL_DIRS) for (const name of locked) expect(tracked, `${dir}/${name}`).toContain(`${dir}/${name}/SKILL.md`);
    const lines = readFileSync(join(ROOT, ".gitignore"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    for (const entry of ["mass-skills.audit.jsonl", ".claude/settings.local.json", "node_modules/", "apps/site/dist/", ".astro/", "security-status.json"]) {
      expect(lines, entry).toContain(entry);
    }
    for (const entry of [".claude/skills/", ".agents/", "mass-skills.lock.json", "skills-lock.json"]) {
      expect(lines, entry).not.toContain(entry);
    }
    expect(existsSync(join(ROOT, "skills-lock.json"))).toBe(false);
  });
});
