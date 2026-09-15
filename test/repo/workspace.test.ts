import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

describe("workspace", () => {
  it("workspace declares the three packages and pnpm resolved them", () => {
    const ws = parse(readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8"));
    expect(ws.packages).toEqual(expect.arrayContaining(["packages/*", "apps/*"]));
    for (const dir of ["packages/core", "packages/cli", "apps/site"]) {
      expect(existsSync(join(ROOT, dir, "package.json")), dir).toBe(true);
    }
    expect(JSON.parse(readFileSync(join(ROOT, "packages/core/package.json"), "utf8")).name).toBe("@mass-solutions/skills-core");
    expect(JSON.parse(readFileSync(join(ROOT, "packages/cli/package.json"), "utf8")).name).toBe("@mass-solutions/skills-cli");
    // `pnpm install --frozen-lockfile` linked the workspace dependency of the CLI onto core.
    expect(existsSync(join(ROOT, "packages/cli/node_modules/@mass-solutions/skills-core/package.json"))).toBe(true);
    expect(existsSync(join(ROOT, "pnpm-lock.yaml"))).toBe(true);
  });

  it("root scripts expose check, validate, registry, build, test, scan, new-skill, stale and start-issue", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    for (const s of ["check", "validate", "registry", "build", "test", "scan", "new-skill", "stale", "start-issue"]) {
      expect(typeof pkg.scripts[s], s).toBe("string");
    }
    const check: string = pkg.scripts.check;
    const iValidate = check.indexOf("pnpm validate");
    const iRegistry = check.indexOf("pnpm registry --check");
    const iTest = check.indexOf("pnpm test");
    expect(iValidate).toBeGreaterThanOrEqual(0);
    expect(iRegistry).toBeGreaterThan(iValidate);
    expect(iTest).toBeGreaterThan(iRegistry);
    expect(check).toMatch(/&&/);
    expect(pkg.engines.node).toBe(">=22.12");
    expect(readFileSync(join(ROOT, ".nvmrc"), "utf8").trim()).toBe("24");
  });
});
