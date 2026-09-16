import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Repo policies the validator does not enforce. Frontmatter, description, scripts, links and the
// registry are covered by `pnpm validate` and `pnpm registry --check`, which run before the tests.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SKILLS = join(ROOT, "skills");
const MAX_SKILL_LINES = 80;

describe("catalog", () => {
  it("every skill keeps SKILL.md short", () => {
    const dirs = readdirSync(SKILLS).filter((e) => !e.startsWith("_") && statSync(join(SKILLS, e)).isDirectory());
    expect(dirs.length).toBeGreaterThan(0);
    for (const name of dirs) {
      const lines = readFileSync(join(SKILLS, name, "SKILL.md"), "utf8").split("\n").length;
      expect(lines, name).toBeLessThanOrEqual(MAX_SKILL_LINES);
    }
  });

  it("categories carry both languages and the licenses are MIT for the repo and CC-BY-4.0 for the skills", () => {
    const categories = JSON.parse(readFileSync(join(SKILLS, "_categories.json"), "utf8")) as Array<Record<string, unknown>>;
    expect(categories.length).toBeGreaterThan(0);
    for (const c of categories) {
      expect(typeof c.id, JSON.stringify(c)).toBe("string");
      expect(typeof c.en, JSON.stringify(c)).toBe("string");
      expect(typeof c["pt-br"], JSON.stringify(c)).toBe("string");
    }
    expect(readFileSync(join(ROOT, "LICENSE"), "utf8")).toMatch(/^MIT License/);
    expect(readFileSync(join(SKILLS, "LICENSE"), "utf8")).toContain("Creative Commons Attribution 4.0");
  });
});
