import { appendFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cli, makeCatalog, makeProject, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

describe("doctor", () => {
  it("doctor reports every state: ok, missing, modified, deprecated, and exits 1 when any is not ok", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "mass-beta", "mass-gamma", "-a", "claude-code"]);
    const healthy = await cli(p, ["doctor"]);
    expect(healthy.code, healthy.stderr).toBe(0);
    expect(healthy.stdout).toBe("mass-alpha: ok\nmass-beta: ok\nmass-gamma: ok\n");

    rmSync(join(p.cwd, ".claude/skills/mass-alpha"), { recursive: true });
    appendFileSync(join(p.cwd, ".claude/skills/mass-beta/SKILL.md"), "\nedit\n");
    const original = fx.registry;
    const next = structuredClone(original);
    next.skills = next.skills.filter((s) => s.name !== "mass-gamma");
    next.deprecated["mass-gamma"] = { since: "2026-02-02", replacedBy: ["mass-alpha"], reason: "merged" };
    fx.registry = next;
    try {
      const r = await cli(p, ["doctor"]);
      expect(r.code).toBe(1);
      expect(r.stdout).toBe("mass-alpha: missing\nmass-beta: modified\nmass-gamma: deprecated\n");
    } finally {
      fx.registry = original;
    }
  });
});
