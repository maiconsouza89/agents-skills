import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { registryMain, validateMain } from "@mass-solutions/skills-core";
import { cli, makeCatalog, makeSkill } from "./helpers.js";

function sink() {
  let text = "";
  return { write: (s: string) => (text += s), text: () => text };
}

function project(root: string) {
  return { cwd: root, home: root, env: {} as NodeJS.ProcessEnv };
}

describe("mirrors", () => {
  it("validate and registry mirror root scripts: same exit codes on a valid and an invalid catalog", async () => {
    const good = makeCatalog();
    const bad = makeCatalog();
    makeSkill(bad, "mass-broken", { frontmatter: "name: mass-broken\ndescription: nope" });
    for (const root of [good, bad]) {
      const core = validateMain([root], sink(), sink());
      const viaCli = await cli(project(root), ["validate", "."]);
      expect(viaCli.code, root).toBe(core);
    }
    expect(await cli(project(good), ["validate"]).then((r) => r.code)).toBe(0);
    expect(await cli(project(bad), ["validate"]).then((r) => r.code)).toBe(1);

    // registry: missing file -> 1 both; after generating -> 0 both; after drift -> 1 both
    expect(registryMain(["--root", good, "--check"], sink(), sink())).toBe(1);
    expect((await cli(project(good), ["registry", "--check"])).code).toBe(1);
    expect((await cli(project(good), ["registry"])).code).toBe(0);
    expect(registryMain(["--root", good, "--check"], sink(), sink())).toBe(0);
    expect((await cli(project(good), ["registry", "--check"])).code).toBe(0);
    writeFileSync(join(good, "skills/mass-gamma/assets/t.md"), "changed\n");
    expect(registryMain(["--root", good, "--check"], sink(), sink())).toBe(1);
    expect((await cli(project(good), ["registry", "--check"])).code).toBe(1);
  });
});
