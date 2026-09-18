import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateSkill } from "@mass-solutions/skills-core";
import { main } from "../../dev/tools/new-skill";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const TOOL = join(REPO_ROOT, "dev", "tools", "new-skill.ts");

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "mass-new-skill-"));
  mkdirSync(join(root, "skills"));
  writeFileSync(join(root, "skills", "_categories.json"), JSON.stringify([{ id: "workflow", en: "Git workflow", "pt-br": "Fluxo Git" }]));
  writeFileSync(join(root, "skills", "_deprecated.json"), "{}");
  return root;
}

function sink() {
  let text = "";
  return { write: (s: string) => (text += s), text: () => text };
}

function run(args: string[]) {
  const out = sink();
  const err = sink();
  const status = main(args, out, err);
  return { status, stdout: out.text(), stderr: err.text() };
}

describe("pnpm new-skill", () => {
  // The only spawn: nothing else in CI runs the script through its bin entry.
  it("scaffolds a skill that validates", () => {
    const root = makeRoot();
    const res = spawnSync("pnpm", ["exec", "tsx", TOOL, "mass-exemplo", "--root", root], { cwd: REPO_ROOT, encoding: "utf8" });
    expect(res.status, res.stderr).toBe(0);
    const dir = join(root, "skills", "mass-exemplo");
    const skill = readFileSync(join(dir, "SKILL.md"), "utf8");
    const today = new Date().toISOString().slice(0, 10);
    expect(skill).toMatch(/^---\nname: mass-exemplo\n/);
    expect(skill).toMatch(/\ndescription: .+\. Use when .+\. Do NOT use for .+\.\n/);
    expect(skill).toContain("\nlicense: CC-BY-4.0\n");
    expect(skill).toContain("\n  author: mass-solutions\n");
    expect(skill).toContain('\n  version: "0.1.0"\n');
    expect(skill).toContain("\n  category: workflow\n");
    expect(skill).toMatch(/\n  tags: ".+"\n/);
    expect(skill).toContain(`\n  reviewed: "${today}"\n`);
    const readme = readFileSync(join(dir, "README.md"), "utf8").trim().split("\n");
    expect(readme).toHaveLength(3);
    expect(validateSkill(dir, { root })).toEqual([]);
  });

  it("refuses an existing skill with exit 2 and leaves it untouched", () => {
    const root = makeRoot();
    expect(run(["mass-exemplo", "--root", root]).status).toBe(0);
    const skillPath = join(root, "skills", "mass-exemplo", "SKILL.md");
    writeFileSync(skillPath, "edited by hand\n");
    const res = run(["mass-exemplo", "--root", root]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("skills/mass-exemplo/ already exists");
    expect(readFileSync(skillPath, "utf8")).toBe("edited by hand\n");
  });

  it("rejects an invalid name with exit 2 and creates nothing", () => {
    const root = makeRoot();
    for (const bad of ["exemplo", "mass-Exemplo", "mass--x", "mass-"]) {
      const res = run([bad, "--root", root]);
      expect(res.status, bad).toBe(2);
      expect(res.stderr).toContain("^mass-[a-z0-9]+(-[a-z0-9]+)*$");
      expect(existsSync(join(root, "skills", bad))).toBe(false);
    }
  });
});
