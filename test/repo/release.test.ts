import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const json = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

describe("release", () => {
  it("changesets config targets main, ignores the site, and the two packages carry the scoped names", () => {
    const config = json(".changeset/config.json");
    expect(config.baseBranch).toBe("main");
    expect(config.ignore).toEqual(["site"]);
    expect(json("packages/core/package.json").name).toBe("@mass-solutions/skills-core");
    expect(json("packages/cli/package.json").name).toBe("@mass-solutions/skills-cli");
    expect(json("apps/site/package.json").name).toBe("site");
    expect(json("package.json").devDependencies["@changesets/cli"]).toMatch(/^\^3\./);
  });
});
