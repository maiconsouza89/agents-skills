import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

describe(".claude-plugin", () => {
  it("marketplace shape follows door 5", () => {
    const mkt = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/marketplace.json"), "utf8"));
    expect(mkt.name).toBe("mass-solutions");
    expect(mkt.owner.name).toBe("Mass Solutions");
    expect(mkt.plugins).toHaveLength(1);
    const plugin = mkt.plugins[0];
    expect(plugin.name).toBe("mass-solutions-skills");
    expect(plugin.source).toBe("./");
    expect(plugin.skills).toEqual(["./skills/"]);
    expect(plugin.license).toBe("CC-BY-4.0");
    expect(typeof plugin.description).toBe("string");
    expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);

    const manifest = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/plugin.json"), "utf8"));
    expect(manifest.name).toBe("mass-solutions-skills");
    expect(manifest.version).toBe(plugin.version);
    expect(manifest.author.name).toBe("Mass Solutions");
    expect(typeof manifest.description).toBe("string");
  });
});
