import { describe, expect, it } from "vitest";
import { makeRoot, makeSkill, validFrontmatter } from "../../packages/core/test/helpers.js";
import { main } from "../../dev/tools/stale";

function run(argv: string[]) {
  let out = "";
  const code = main(argv, { write: (s: string) => (out += s) });
  return { code, out };
}

describe("stale", () => {
  it("lists stale skills older than --days with the reviewed date and the age", () => {
    const root = makeRoot();
    makeSkill(root, "mass-old", { frontmatter: validFrontmatter("mass-old", { reviewed: '"2026-06-15"' }) });
    makeSkill(root, "mass-edge", { frontmatter: validFrontmatter("mass-edge", { reviewed: '"2026-06-16"' }) });
    makeSkill(root, "mass-fresh", { frontmatter: validFrontmatter("mass-fresh", { reviewed: '"2026-09-01"' }) });
    const r = run(["--root", root, "--days", "90", "--today", "2026-09-14"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe("mass-old - reviewed 2026-06-15 (91 days)\n");
    const thirty = run(["--root", root, "--days", "10", "--today", "2026-09-14"]);
    expect(thirty.out.split("\n").filter(Boolean)).toHaveLength(3);
  });

  it("prints nothing when none is stale and still exits 0", () => {
    const root = makeRoot();
    makeSkill(root, "mass-fresh", { frontmatter: validFrontmatter("mass-fresh", { reviewed: '"2026-09-01"' }) });
    const r = run(["--root", root, "--today", "2026-09-14"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe("");
  });
});
