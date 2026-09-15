import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as core from "../src/index.js";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

function sources(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|js|mjs|astro)$/.test(e) ? [p] : [];
  });
}

describe("core public api", () => {
  it("public api exposes the parse, validate, hash and registry functions", () => {
    for (const fn of ["parseSkill", "validateSkill", "validateCatalog", "hashFiles", "buildRegistry"] as const) {
      expect(typeof core[fn], fn).toBe("function");
    }
  });

  it("no duplicate parser: cli and site never import gray-matter or node:crypto", () => {
    const files = [...sources(join(REPO_ROOT, "packages/cli/src")), ...sources(join(REPO_ROOT, "apps/site/src"))];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/from\s+["']gray-matter["']/);
      expect(text, file).not.toMatch(/from\s+["'](node:)?crypto["']/);
    }
  });
});
