import { appendFileSync, existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Lockfile } from "../src/types.js";
import { cli, makeCatalog, makeProject, readJson, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

function bumpRemote(name: string, version: string) {
  const original = fx.registry;
  const next = structuredClone(original);
  next.skills.find((s) => s.name === name)!.version = version;
  fx.registry = next;
  return () => (fx.registry = original);
}

describe("update", () => {
  it("update three outcomes: locally modified is skipped, newer registry version reinstalls, equal is up to date", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "mass-beta", "mass-gamma", "-a", "claude-code"]);
    const alphaSkill = join(p.cwd, ".claude/skills/mass-alpha/SKILL.md");
    appendFileSync(alphaSkill, "\nlocal edit\n");
    const restore = bumpRemote("mass-beta", "0.2.0");
    try {
      const r = await cli(p, ["update"]);
      expect(r.code, r.stderr).toBe(0);
      expect(r.stdout).toBe("mass-alpha: locally modified, skipped (use --force)\nmass-beta: updated to 0.2.0\nmass-gamma: up to date\n");
      expect(readFileSync(alphaSkill, "utf8")).toContain("local edit");
      const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
      expect(lock.skills["mass-alpha"].version).toBe("0.1.0");
      expect(lock.skills["mass-beta"].version).toBe("0.2.0");
    } finally {
      restore();
    }
  });

  it("force overwrites local edits and records a new installedAt", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
    const lockPath = join(p.cwd, "mass-skills.lock.json");
    const before = readJson<Lockfile>(lockPath);
    before.skills["mass-alpha"].installedAt = "2020-01-01T00:00:00.000Z";
    writeFileSync(lockPath, JSON.stringify(before));
    const skill = join(p.cwd, ".claude/skills/mass-alpha/SKILL.md");
    appendFileSync(skill, "\nlocal edit\n");
    const r = await cli(p, ["update", "--force"]);
    expect(r.code, r.stderr).toBe(0);
    expect(r.stdout).toBe("mass-alpha: overwritten to 0.1.0\n");
    expect(readFileSync(skill, "utf8")).toBe(readFileSync(join(fx.root, "skills/mass-alpha/SKILL.md"), "utf8"));
    const after = readJson<Lockfile>(lockPath);
    expect(after.skills["mass-alpha"].installedAt).toBe("2026-09-14T12:00:00.000Z");
  });

  it("update reports missing and not-in-registry and writes nothing", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "mass-beta", "-a", "claude-code"]);
    const lockPath = join(p.cwd, "mass-skills.lock.json");
    const lockBefore = readFileSync(lockPath, "utf8");
    rmSync(join(p.cwd, ".claude/skills/mass-alpha"), { recursive: true });
    const betaSkill = join(p.cwd, ".claude/skills/mass-beta/SKILL.md");
    const betaBefore = readFileSync(betaSkill, "utf8");
    const original = fx.registry;
    const next = structuredClone(original);
    next.skills = next.skills.filter((s) => s.name !== "mass-beta");
    fx.registry = next;
    try {
      const r = await cli(p, ["update"]);
      expect(r.code, r.stderr).toBe(0);
      expect(r.stdout).toBe("mass-alpha: missing (run mass-skills install)\nmass-beta: not in registry\n");
      expect(readFileSync(lockPath, "utf8")).toBe(lockBefore);
      expect(readFileSync(betaSkill, "utf8")).toBe(betaBefore);
      expect(existsSync(join(p.cwd, ".claude/skills/mass-alpha"))).toBe(false);
    } finally {
      fx.registry = original;
    }
  });

  it("check writes nothing and prints every state", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "mass-beta", "mass-gamma", "-a", "claude-code"]);
    const lockPath = join(p.cwd, "mass-skills.lock.json");
    const lockBefore = readFileSync(lockPath, "utf8");
    const alphaSkill = join(p.cwd, ".claude/skills/mass-alpha/SKILL.md");
    appendFileSync(alphaSkill, "\nlocal edit\n");
    const alphaBefore = readFileSync(alphaSkill, "utf8");
    const betaMtime = statSync(join(p.cwd, ".claude/skills/mass-beta/SKILL.md")).mtimeMs;
    const original = fx.registry;
    const next = structuredClone(original);
    next.skills.find((s) => s.name === "mass-beta")!.version = "0.2.0";
    next.skills = next.skills.filter((s) => s.name !== "mass-gamma");
    next.deprecated["mass-gamma"] = { since: "2026-02-02", replacedBy: ["mass-alpha"], reason: "merged" };
    fx.registry = next;
    try {
      const r = await cli(p, ["update", "--check"]);
      expect(r.code, r.stderr).toBe(0);
      expect(r.stdout).toBe("mass-alpha: locally modified\nmass-beta: update available 0.2.0\nmass-gamma: deprecated since 2026-02-02, use: mass-alpha\n");
      expect(readFileSync(lockPath, "utf8")).toBe(lockBefore);
      expect(readFileSync(alphaSkill, "utf8")).toBe(alphaBefore);
      expect(statSync(join(p.cwd, ".claude/skills/mass-beta/SKILL.md")).mtimeMs).toBe(betaMtime);
    } finally {
      fx.registry = original;
    }
    const s = await cli(p, ["update", "--check"]);
    expect(s.stdout).toContain("mass-beta: up to date\n");
  });
});
