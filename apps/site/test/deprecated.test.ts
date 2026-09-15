import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildRegistry, serializeRegistry } from "@mass-solutions/skills-core";
import { makeRoot, makeSkill } from "../../../packages/core/test/helpers.js";
import { BASE, buildSite, dom, text } from "./helpers";

describe("deprecated skill page", () => {
  it("deprecated page shows the banner, the replacement and no install panel", () => {
    const root = makeRoot({
      "mass-old-review": { since: "2026-08-01", replacedBy: ["mass-alpha"], reason: "merged into mass-alpha" },
    });
    makeSkill(root, "mass-alpha", { body: "# Alpha\n\nSteps.\n" });
    writeFileSync(join(root, "skills-registry.json"), serializeRegistry(buildRegistry(root)));
    const out = mkdtempSync(join(tmpdir(), "mass-site-"));
    buildSite(out, { MASS_CATALOG_ROOT: join(root, "skills") });
    for (const page of ["skills/mass-old-review/index.html", "pt-br/skills/mass-old-review/index.html"]) {
      const d = dom(out, page);
      const banner = d.querySelector("[data-deprecated]")!;
      expect(text(banner)).toContain("Deprecated since 2026-08-01");
      expect(text(banner)).toContain("merged into mass-alpha");
      const link = banner.querySelector("a")!;
      expect(link.textContent).toBe("mass-alpha");
      expect(link.getAttribute("href")).toBe(`${BASE}${page.startsWith("pt-br/") ? "pt-br/" : ""}skills/mass-alpha/`);
      expect(d.querySelector("[data-install]")).toBeNull();
      expect(text(d.querySelector("main"))).not.toContain("mass-skills install");
    }
    expect(text(dom(out, "skills/mass-alpha/index.html").querySelector("[data-install]"))).toContain("mass-skills install mass-alpha");
  });
});
