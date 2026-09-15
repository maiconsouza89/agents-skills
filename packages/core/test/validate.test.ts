import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateCatalog } from "../src/index.js";
import { makeRoot, makeSkill } from "./helpers.js";

describe("validateCatalog", () => {
  it("walks only the catalog and returns zero findings for a valid skill", () => {
    const root = makeRoot();
    makeSkill(root, "mass-a");
    // Invalid SKILL.md files outside skills/ must never be visited.
    for (const dir of [".claude/skills/x", "node_modules/y", "packages/z", "apps/w"]) {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, "SKILL.md"), "---\nbogus: true\n---\n");
    }
    // Underscore entries and plain files inside skills/ are not skills either.
    mkdirSync(join(root, "skills", "_drafts", "mass-draft"), { recursive: true });
    writeFileSync(join(root, "skills", "_drafts", "mass-draft", "SKILL.md"), "---\nbogus: true\n---\n");
    writeFileSync(join(root, "skills", "LICENSE"), "CC-BY-4.0");

    const result = validateCatalog(root, { today: "2026-09-14" });
    expect(result.skills).toEqual(["mass-a"]);
    expect(result.findings).toEqual([]);
  });
});
