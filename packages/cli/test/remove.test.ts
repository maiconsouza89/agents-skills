import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Lockfile } from "../src/types.js";
import { cli, makeCatalog, makeProject, readJson, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

describe("remove", () => {
  it("removes only registered agents and drops the lockfile entry", async () => {
    const p = makeProject(fx, [".claude", ".windsurf"]);
    await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
    await cli(p, ["install", "mass-beta", "-a", "claude-code", "windsurf"]);
    // a copy of mass-alpha placed by hand in windsurf, not recorded for that agent
    mkdirSync(join(p.cwd, ".windsurf/skills/mass-alpha"), { recursive: true });
    writeFileSync(join(p.cwd, ".windsurf/skills/mass-alpha/SKILL.md"), "manual\n");
    const r = await cli(p, ["remove", "mass-alpha"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(p.cwd, ".claude/skills/mass-alpha"))).toBe(false);
    expect(existsSync(join(p.cwd, ".windsurf/skills/mass-alpha/SKILL.md"))).toBe(true);
    expect(existsSync(join(p.cwd, ".claude/skills/mass-beta/SKILL.md"))).toBe(true);
    const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
    expect(Object.keys(lock.skills)).toEqual(["mass-beta"]);
    const again = await cli(p, ["remove", "mass-alpha"]);
    expect(again.code).toBe(2);
  });
});
