import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

describe(".gitignore", () => {
  it("tooling skills are untracked and the build outputs are ignored", () => {
    const lines = readFileSync(join(ROOT, ".gitignore"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    for (const entry of [".claude/skills/", "skills-lock.json", "node_modules/", "apps/site/dist/", ".astro/"]) {
      expect(lines, entry).toContain(entry);
    }
    const tracked = execFileSync("git", ["-C", ROOT, "ls-files", "--", ".claude/skills", "skills-lock.json"], { encoding: "utf8" }).trim();
    expect(tracked).toBe("");
  });
});
