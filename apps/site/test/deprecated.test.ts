import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildRegistry, serializeRegistry } from "@mass-solutions/skills-core";
import { makeRoot, makeSkill, validFrontmatter } from "../../../packages/core/test/helpers.js";
import { BASE, buildSite, dom, html, text } from "./helpers";

describe("deprecated skill page", () => {
  it("deprecated page shows the banner, the replacement and no install panel", () => {
    const root = makeRoot({
      "mass-old-review": { since: "2026-08-01", replacedBy: ["mass-alpha"], reason: "merged into mass-alpha" },
    });
    makeSkill(root, "mass-alpha", { body: "# Alpha\n\nSteps.\n", frontmatter: validFrontmatter("mass-alpha", { reviewed: '"2026-07-01"' }) });
    writeFileSync(join(root, "skills-registry.json"), serializeRegistry(buildRegistry(root)));
    const out = mkdtempSync(join(tmpdir(), "mass-site-"));
    buildSite(out, { MASS_CATALOG_ROOT: join(root, "skills") });
    for (const page of ["skills/mass-old-review/index.html", "pt-br/skills/mass-old-review/index.html"]) {
      const d = dom(out, page);
      const banner = d.querySelector("[data-deprecated]")!;
      const expectedDeprecatedSince = page.startsWith("pt-br/")
        ? "Descontinuada desde 2026-08-01"
        : "Deprecated since 2026-08-01";
      expect(text(banner)).toContain(expectedDeprecatedSince);
      expect(text(banner)).toContain("merged into mass-alpha");
      const link = banner.querySelector("a")!;
      expect(link.textContent).toBe("mass-alpha");
      expect(link.getAttribute("href")).toBe(`${BASE}${page.startsWith("pt-br/") ? "pt-br/" : ""}skills/mass-alpha/`);
      expect(d.querySelector("[data-install]")).toBeNull();
      expect(text(d.querySelector("main"))).not.toContain("npx @mass-solutions/skills-cli install");
    }
    expect(text(dom(out, "skills/mass-alpha/index.html").querySelector("[data-install]"))).toContain(
      "npx @mass-solutions/skills-cli install mass-alpha",
    );

    // The feed carries the deprecation once, dated by `since` (later than mass-alpha's review), with the same notice as the page.
    for (const [path, notice] of [
      ["feed.xml", "Deprecated since 2026-08-01. Reason: merged into mass-alpha. Use instead: mass-alpha."],
      ["pt-br/feed.xml", "Descontinuada desde 2026-08-01. Motivo: merged into mass-alpha. Use no lugar: mass-alpha."],
    ]) {
      const feed = new JSDOM(html(out, path), { contentType: "application/xml" }).window.document.documentElement;
      const entries = [...feed.querySelectorAll(":scope > entry")];
      expect(entries.map((e) => e.querySelector("title")!.textContent)).toEqual(["mass-old-review", "mass-alpha"]);
      const gone = entries[0];
      expect(gone.querySelector("updated")?.textContent).toBe("2026-08-01T00:00:00Z");
      expect(gone.querySelector("category")).toBeNull();
      expect(gone.querySelector("content")?.textContent).toBe(notice);
    }
  });
});
