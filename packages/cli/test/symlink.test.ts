import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cli, makeCatalog, makeProject, serveCatalog, type Fixture, type Project } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

/** A project whose `.claude/skills` is a symlink to a directory outside the project. */
function escaping(): { project: Project; outside: string } {
  const project = makeProject(fx);
  const outside = mkdtempSync(join(tmpdir(), "mass-cli-outside-"));
  symlinkSync(outside, join(project.cwd, ".claude", "skills"), "dir");
  return { project, outside };
}

describe("skills directory outside the project", () => {
  it("refuses to install through it and leaves the target untouched", async () => {
    const { project, outside } = escaping();
    const r = await cli(project, ["install", "mass-alpha", "-a", "claude-code"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("Refusing to write to .claude/skills");
    expect(r.stderr).toContain("outside the project");
    expect(readdirSync(outside)).toEqual([]);
    expect(existsSync(join(project.cwd, "mass-skills.lock.json"))).toBe(false);
  });

  it("refuses to remove through it and leaves the target untouched", async () => {
    const project = makeProject(fx);
    expect((await cli(project, ["install", "mass-alpha", "-a", "claude-code"])).code).toBe(0);
    const outside = mkdtempSync(join(tmpdir(), "mass-cli-outside-"));
    mkdirSync(join(outside, "mass-alpha"), { recursive: true });
    writeFileSync(join(outside, "mass-alpha", "SKILL.md"), "not ours\n");
    rmSync(join(project.cwd, ".claude", "skills"), { recursive: true, force: true });
    symlinkSync(outside, join(project.cwd, ".claude", "skills"), "dir");

    const r = await cli(project, ["remove", "mass-alpha"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("Refusing to write to .claude/skills");
    expect(existsSync(join(outside, "mass-alpha", "SKILL.md"))).toBe(true);
  });

  it("allows a symlink that stays inside the project", async () => {
    const project = makeProject(fx);
    const real = join(project.cwd, "vendor", "skills");
    mkdirSync(real, { recursive: true });
    rmSync(join(project.cwd, ".claude", "skills"), { recursive: true, force: true });
    symlinkSync(real, join(project.cwd, ".claude", "skills"), "dir");
    const r = await cli(project, ["install", "mass-alpha", "-a", "claude-code"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(real, "mass-alpha", "SKILL.md"))).toBe(true);
  });

  it("still installs globally, where the skills directory lives outside the project by design", async () => {
    const project = makeProject(fx);
    const r = await cli(project, ["install", "mass-alpha", "-a", "claude-code", "--global"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(project.home, ".claude/skills/mass-alpha/SKILL.md"))).toBe(true);
  });
});
