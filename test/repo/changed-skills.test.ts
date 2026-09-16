import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Registry, RegistrySkill } from "@mass-solutions/skills-core";
import { changedSkills, main } from "../../tools/changed-skills";

function capture() {
  let out = "";
  let err = "";
  return { out: { write: (s: string) => (out += s) }, err: { write: (s: string) => (err += s) }, get: () => ({ out, err }) };
}

function registry(skills: Array<[string, string]>): Registry {
  return {
    version: 1,
    generatedAt: "2026-09-15T00:00:00.000Z",
    repo: "maiconsouza89/agents-skills",
    skills: skills.map(([name, contentHash]) => ({ name, path: `skills/${name}`, contentHash }) as RegistrySkill),
    deprecated: {},
  };
}

function file(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mass-changed-"));
  const p = join(dir, "registry.json");
  writeFileSync(p, content);
  return p;
}

const base = registry([
  ["mass-alpha", "aaa"],
  ["mass-beta", "bbb"],
]);

describe("changed-skills", () => {
  it("prints nothing when no contentHash moved and no skill file was touched", () => {
    expect(changedSkills(base, registry([["mass-alpha", "aaa"], ["mass-beta", "bbb"]]), ["skills/_categories.json"])).toEqual([]);
  });

  it("picks the skills whose contentHash changed, and only those", () => {
    const head = registry([["mass-alpha", "aaa2"], ["mass-beta", "bbb"]]);
    expect(changedSkills(base, head)).toEqual(["skills/mass-alpha"]);
  });

  it("picks a new skill and ignores a removed one", () => {
    const head = registry([["mass-alpha", "aaa"], ["mass-gamma", "ggg"]]);
    expect(changedSkills(base, head)).toEqual(["skills/mass-gamma"]);
  });

  it("treats a rename as the new path only", () => {
    const head = registry([["mass-alpha", "aaa"], ["mass-renamed", "bbb"]]);
    expect(changedSkills(base, head)).toEqual(["skills/mass-renamed"]);
  });

  it("picks a skill with a touched file even when the registry was not regenerated", () => {
    const head = registry([["mass-alpha", "aaa"], ["mass-beta", "bbb"]]);
    expect(changedSkills(base, head, ["skills/mass-beta/SKILL.md"])).toEqual(["skills/mass-beta"]);
    // A path that merely starts with the skill path is not inside it.
    expect(changedSkills(base, head, ["skills/mass-beta-extra/SKILL.md"])).toEqual([]);
  });

  it("refuses a skill path that is not a plain catalog directory", () => {
    const head = registry([["mass-alpha", "aaa"]]);
    head.skills.push({ name: "x", path: "skills/a b; rm -rf /", contentHash: "zzz" } as RegistrySkill);
    expect(() => changedSkills(base, head)).toThrow(/refusing to scan an unexpected skill path/);
  });

  it("cli prints the changed paths on one line, nothing when unchanged, and fails on a bad registry", () => {
    const baseFile = file(JSON.stringify(base));
    const changed = capture();
    const headFile = file(JSON.stringify(registry([["mass-alpha", "aaa2"], ["mass-beta", "bbb2"]])));
    expect(main(["--base", baseFile, "--head", headFile], "", changed.out, changed.err)).toBe(0);
    expect(changed.get().out).toBe("skills/mass-alpha skills/mass-beta\n");

    const same = capture();
    expect(main(["--base", baseFile, "--head", file(JSON.stringify(base))], "\n", same.out, same.err)).toBe(0);
    expect(same.get().out).toBe("");

    const touched = capture();
    expect(main(["--base", baseFile, "--head", file(JSON.stringify(base))], "skills/mass-alpha/scripts/run.sh\n", touched.out, touched.err)).toBe(0);
    expect(touched.get().out).toBe("skills/mass-alpha\n");

    const usage = capture();
    expect(main([], "", usage.out, usage.err)).toBe(2);
    expect(usage.get().err).toContain("--base");

    const bad = capture();
    expect(main(["--base", baseFile, "--head", file('{"skills":"nope"}')], "", bad.out, bad.err)).toBe(1);
    expect(bad.get().err).toContain('expected a registry with a "skills" list');
  });

  it("the committed registry is a valid input and reports no change against itself", () => {
    const committed = join(new URL("../..", import.meta.url).pathname, "skills-registry.json");
    const c = capture();
    expect(main(["--base", committed, "--head", committed], "", c.out, c.err)).toBe(0);
    expect(c.get().out).toBe("");
  });
});
