import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSkill, validateCatalog } from "@mass-solutions/skills-core";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SKILLS = join(ROOT, "skills");
const CATALOG = ["mass-code-review", "mass-commit-message", "mass-issue-complexity", "mass-pr-description", "mass-security-checklist", "mass-skill-authoring"];

describe("example skills", () => {
  it("catalog skills validate and stay under 80 lines", () => {
    const dirs = readdirSync(SKILLS).filter((e) => !e.startsWith("_") && statSync(join(SKILLS, e)).isDirectory()).sort();
    expect(dirs).toEqual(CATALOG);
    for (const name of CATALOG) {
      const lines = readFileSync(join(SKILLS, name, "SKILL.md"), "utf8").split("\n").length;
      expect(lines, name).toBeLessThanOrEqual(80);
    }
    const result = validateCatalog(ROOT);
    expect(result.skills).toEqual(CATALOG);
    expect(result.findings).toEqual([]);
  });

  it("skill-authoring exercises references and evals", () => {
    const dir = join(SKILLS, "mass-skill-authoring");
    const refs = readdirSync(join(dir, "references"));
    expect(refs.length).toBeGreaterThanOrEqual(1);
    const body = parseSkill(dir).body;
    expect(refs.some((f) => body.includes(`references/${f}`))).toBe(true);
    const triggers = JSON.parse(readFileSync(join(dir, "evals", "triggers.json"), "utf8"));
    expect(triggers.should.length).toBeGreaterThanOrEqual(3);
    expect(triggers.shouldNot.length).toBeGreaterThanOrEqual(3);
  });

  it("commit-message scripts and pr-description assets", () => {
    const scripts = readdirSync(join(SKILLS, "mass-commit-message", "scripts"));
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    for (const s of scripts) {
      const abs = join(SKILLS, "mass-commit-message", "scripts", s);
      expect(readFileSync(abs, "utf8").startsWith("#!")).toBe(true);
      expect(statSync(abs).mode & 0o111, `${s} executable`).not.toBe(0);
    }
    const assets = readdirSync(join(SKILLS, "mass-pr-description", "assets"));
    expect(assets.length).toBeGreaterThanOrEqual(1);
    const body = parseSkill(join(SKILLS, "mass-pr-description")).body;
    expect(assets.some((a) => body.includes(`assets/${a}`))).toBe(true);
  });

  it("code-review requires and security-checklist minimal", () => {
    const review = parseSkill(join(SKILLS, "mass-code-review")).frontmatter!;
    expect((review.metadata as Record<string, string>).requires).toBe("git, gh");
    expect(typeof review["allowed-tools"]).toBe("string");
    expect((review["allowed-tools"] as string).length).toBeGreaterThan(0);
    const minimal = readdirSync(join(SKILLS, "mass-security-checklist"));
    expect(minimal).toEqual(["SKILL.md"]);
  });

  it("categories and deprecated files", () => {
    const categories = JSON.parse(readFileSync(join(SKILLS, "_categories.json"), "utf8")) as Array<{ id: string; en: string; "pt-br": string }>;
    const ids = categories.map((c) => c.id);
    for (const c of categories) {
      expect(typeof c.en).toBe("string");
      expect(typeof c["pt-br"]).toBe("string");
    }
    for (const name of CATALOG) {
      const meta = parseSkill(join(SKILLS, name)).frontmatter!.metadata as Record<string, string>;
      expect(ids, `${name} category`).toContain(meta.category);
    }
    expect(JSON.parse(readFileSync(join(SKILLS, "_deprecated.json"), "utf8"))).toEqual({});
    expect(existsSync(join(SKILLS, "LICENSE"))).toBe(true);
  });
});
