import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cli, makeCatalog, makeProject, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog({ "mass-old": { since: "2026-01-01", replacedBy: ["mass-alpha"], reason: "renamed" } }));
});
afterAll(() => fx.close());

describe("exit codes", () => {
  it("exit code contract: 0 success, 1 execution failure, 2 usage error, errors on stderr only", async () => {
    const table: Array<{ argv: string[]; code: number; setup?: () => void; teardown?: () => void }> = [
      { argv: ["list"], code: 0 },
      { argv: ["search", "alpha"], code: 0 },
      { argv: ["install", "mass-alpha", "-a", "claude-code"], code: 0 },
      { argv: ["install", "mass-old", "-a", "claude-code"], code: 1 },
      { argv: ["install", "mass-alpha", "-a", "claude-code"], code: 1, setup: () => fx.overrides.set("skills/mass-alpha/SKILL.md", Buffer.from("x")), teardown: () => fx.overrides.clear() },
      { argv: ["list"], code: 1, setup: () => fx.overrides.set("skills-registry.json", 404), teardown: () => fx.overrides.clear() },
      { argv: ["install", "mass-alpha", "-a", "vim"], code: 2 },
      { argv: ["install", "mass-nope", "-a", "claude-code"], code: 2 },
      { argv: ["frobnicate"], code: 2 },
      { argv: ["install"], code: 2 },
      { argv: ["list", "--bogus"], code: 2 },
    ];
    for (const row of table) {
      const p = makeProject(fx);
      row.setup?.();
      try {
        const r = await cli(p, row.argv);
        expect(r.code, row.argv.join(" ")).toBe(row.code);
        if (row.code === 0) expect(r.stderr, row.argv.join(" ")).toBe("");
        else {
          expect(r.stderr.length, row.argv.join(" ")).toBeGreaterThan(0);
          expect(r.stdout, row.argv.join(" ")).toBe("");
        }
      } finally {
        row.teardown?.();
      }
    }
  });
});
