import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRegistry, contentHashOf, hashFiles } from "../src/index.js";
import { makeRoot, makeSkill, validFrontmatter } from "./helpers.js";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

describe("buildRegistry", () => {
  it("registry shape follows door 3", () => {
    const deprecated = { "mass-old": { since: "2026-01-01", replacedBy: ["mass-b"], reason: "renamed" } };
    const root = makeRoot(deprecated);
    makeSkill(root, "mass-b", {
      frontmatter: validFrontmatter("mass-b", { tags: '"git, commits, conventional"' }),
      files: {
        "references/z.md": "z",
        "references/a.md": "a",
        "assets/t.md": "t",
        "evals/triggers.json": JSON.stringify({ should: [], shouldNot: [] }),
      },
    });
    makeSkill(root, "mass-a");
    const now = new Date("2026-09-14T12:00:00.000Z");
    const reg = buildRegistry(root, { now });

    expect(reg.version).toBe(1);
    expect(reg.repo).toBe("maiconsouza89/agents-skills");
    expect(reg.generatedAt).toBe("2026-09-14T12:00:00.000Z");
    expect(reg.deprecated).toEqual(deprecated);
    expect(reg.skills.map((s) => s.name)).toEqual(["mass-a", "mass-b"]);

    const b = reg.skills[1];
    expect(b.path).toBe("skills/mass-b");
    expect(b.description).toMatch(/^Does one thing\./);
    expect(b.category).toBe("workflow");
    expect(b.tags).toEqual(["git", "commits", "conventional"]);
    expect(b.version).toBe("0.1.0");
    expect(b.reviewed).toBe("2026-09-14");
    expect(b.author).toBe("mass-solutions");
    expect(b.license).toBe("CC-BY-4.0");
    expect(b.files.map((f) => f.path)).toEqual(["SKILL.md", "assets/t.md", "references/a.md", "references/z.md"]);
    for (const f of b.files) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.bytes).toBeGreaterThan(0);
    }
    expect(b.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(b.contentHash).toBe(contentHashOf(b.files));
    const raw = readFileSync(`${root}/skills/mass-b/SKILL.md`, "utf8");
    expect(b.tokens).toBe(Math.ceil(raw.length / 4));
  });

  it("contentHash known answer", () => {
    // sha256("alpha\n"), sha256("beta\n") and sha256("SKILL.md\n<A>\nreferences/a.md\n<B>\n"), computed with sha256sum.
    const A = "b6a98d9ce9a2d9149288fa3df42d377c3e42737afdcdaf714e33c0a100b51060";
    const B = "f2c82decdd7181cf98945929a62598db7e6b477e11f6e0eb0ae97020eff151ad";
    const EXPECTED = "3b79a4bfd1bb7cbd95fe209b292a58bb7d433a9b711aef949d1d91614c56a900";
    const root = makeRoot();
    const dir = makeSkill(root, "mass-k", { noSkillMd: true, files: { "SKILL.md": "alpha\n", "references/a.md": "beta\n", "evals/triggers.json": "{}" } });
    const { files, contentHash } = hashFiles(dir);
    expect(files).toEqual([
      { path: "SKILL.md", sha256: A, bytes: 6 },
      { path: "references/a.md", sha256: B, bytes: 5 },
    ]);
    expect(contentHash).toBe(EXPECTED);
  });

  it("committed registry version and repo", () => {
    const reg = JSON.parse(readFileSync(`${REPO_ROOT}/skills-registry.json`, "utf8"));
    expect(reg.version).toBe(1);
    expect(reg.repo).toBe("maiconsouza89/agents-skills");
  });
});
