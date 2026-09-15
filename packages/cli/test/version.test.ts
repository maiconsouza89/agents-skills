import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cli, makeCatalog, makeProject, serveCatalog } from "./helpers.js";

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")) as { version: string };

describe("--version", () => {
  it("-V and --version print the package version and exit 0", async () => {
    const fx = await serveCatalog(makeCatalog());
    try {
      const p = makeProject(fx);
      for (const flag of ["-V", "--version"]) {
        const r = await cli(p, [flag]);
        expect(r.code, flag).toBe(0);
        expect(r.stdout.trim(), flag).toBe(packageJson.version);
        expect(r.stderr, flag).toBe("");
      }
    } finally {
      await fx.close();
    }
  });
});
