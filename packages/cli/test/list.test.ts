import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cli, makeCatalog, makeProject, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

describe("list and search", () => {
  it("lists skills in name order with name, version, category and description up to 80 chars", async () => {
    const r = await cli(makeProject(fx), ["list"]);
    expect(r.code).toBe(0);
    const lines = r.stdout.trimEnd().split("\n");
    expect(lines.map((l) => l.split("  ")[0])).toEqual(["mass-alpha", "mass-beta", "mass-gamma"]);
    const beta = fx.registry.skills.find((s) => s.name === "mass-beta")!;
    expect(lines[1]).toBe(`mass-beta  0.1.0  quality  ${beta.description.slice(0, 80)}`);
    expect(lines[1].split("  ")[3].length).toBeLessThanOrEqual(80);
    expect(beta.description.length).toBeGreaterThan(80);
  });

  it("search matches case-insensitively on name, description and tags", async () => {
    const byName = await cli(makeProject(fx), ["search", "BETA"]);
    expect(byName.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(byName.stdout).toMatch(/^mass-beta /);
    const byDesc = await cli(makeProject(fx), ["search", "defects"]);
    expect(byDesc.stdout).toMatch(/^mass-beta /);
    const byTag = await cli(makeProject(fx), ["search", "COMMITS"]);
    expect(byTag.stdout.trimEnd().split("\n").map((l) => l.split("  ")[0])).toEqual(["mass-alpha", "mass-gamma"]);
    expect(byTag.code).toBe(0);
  });

  it("search with no match prints the message and exits 0", async () => {
    const r = await cli(makeProject(fx), ["search", "zzz-nothing"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('No skills match "zzz-nothing"\n');
    expect(r.stderr).toBe("");
  });
});
