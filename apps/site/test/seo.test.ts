import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { BASE, DIST, REPO_ROOT, buildSite, dom, html, walk } from "./helpers";
import { LANGS, type Lang } from "../src/lib/i18n";

const SITE_URL = "https://maiconsouza89.github.io";
const registry = JSON.parse(readFileSync(join(REPO_ROOT, "skills-registry.json"), "utf8"));

let files: string[] = [];
beforeAll(() => {
  buildSite();
  files = walk(DIST);
});

describe("SEO basics", () => {
  it("sitemap.xml exists and lists home, catalog and at least one skill for each language", () => {
    expect(files).toContain("sitemap.xml");
    const content = html(DIST, "sitemap.xml");
    expect(content).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    // EN and PT home pages
    expect(content).toContain(`${SITE_URL}${BASE}`);
    expect(content).toContain(`${SITE_URL}${BASE}pt-br/`);
    // Skill pages in both languages
    const firstName = (registry.skills as Array<{ name: string }>)[0].name;
    expect(content).toContain(`${SITE_URL}${BASE}skills/${firstName}/`);
    expect(content).toContain(`${SITE_URL}${BASE}pt-br/skills/${firstName}/`);
    // Static pages
    for (const path of ["catalog/", "install/", "agents/", "security/", "about/"]) {
      expect(content).toContain(`${SITE_URL}${BASE}${path}`);
      expect(content).toContain(`${SITE_URL}${BASE}pt-br/${path}`);
    }
  });

  it("robots.txt exists and references the sitemap", () => {
    expect(files).toContain("robots.txt");
    const content = html(DIST, "robots.txt");
    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain(`Sitemap: ${SITE_URL}${BASE}sitemap.xml`);
  });

  it("llms.txt exists and lists skills", () => {
    expect(files).toContain("llms.txt");
    const content = html(DIST, "llms.txt");
    expect(content).toContain("# Mass Skills");
    const firstName = (registry.skills as Array<{ name: string }>)[0].name;
    expect(content).toContain(firstName);
    expect(content).toContain(`${SITE_URL}${BASE}skills/${firstName}/`);
  });

  for (const [page, lang, otherLang] of [
    ["index.html", "en", "pt-BR"],
    ["pt-br/index.html", "pt-br", "en"],
    ["skills/mass-code-review/index.html", "en", "pt-BR"],
  ] as Array<[string, Lang, string]>) {
    it(`${page}: canonical, hreflang and og/twitter tags`, () => {
      const d = dom(DIST, page);
      const isEn = lang === "en";
      const pathSegment = page.replace("index.html", "").replace(/^pt-br\//, "");
      const enHref = `${SITE_URL}${BASE}${pathSegment}`;
      const ptHref = `${SITE_URL}${BASE}pt-br/${pathSegment}`;
      const canonicalHref = isEn ? enHref : ptHref;

      // Canonical
      const canonical = d.querySelector('link[rel="canonical"]')!;
      expect(canonical, `${page}: canonical missing`).not.toBeNull();
      expect(canonical.getAttribute("href")).toBe(canonicalHref);

      // hreflang self-reference, other language and x-default
      const enLink = d.querySelector('link[rel="alternate"][hreflang="en"]')!;
      expect(enLink, `${page}: hreflang en missing`).not.toBeNull();
      expect(enLink.getAttribute("href")).toBe(enHref);

      const ptLink = d.querySelector('link[rel="alternate"][hreflang="pt-BR"]')!;
      expect(ptLink, `${page}: hreflang pt-BR missing`).not.toBeNull();
      expect(ptLink.getAttribute("href")).toBe(ptHref);

      const xDefault = d.querySelector('link[rel="alternate"][hreflang="x-default"]')!;
      expect(xDefault, `${page}: hreflang x-default missing`).not.toBeNull();
      expect(xDefault.getAttribute("href")).toBe(enHref);

      // Open Graph
      expect(d.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("website");
      expect(d.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonicalHref);
      expect(d.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBeTruthy();
      expect(d.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBeTruthy();
      expect(d.querySelector('meta[property="og:site_name"]')?.getAttribute("content")).toBe("Mass Skills");

      // Twitter
      expect(d.querySelector('meta[name="twitter:card"]')?.getAttribute("content")).toBe("summary");
      expect(d.querySelector('meta[name="twitter:url"]')?.getAttribute("content")).toBe(canonicalHref);
      expect(d.querySelector('meta[name="twitter:title"]')?.getAttribute("content")).toBeTruthy();
      expect(d.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBeTruthy();
    });
  }

  it("skill page has SoftwareSourceCode and BreadcrumbList JSON-LD", () => {
    const d = dom(DIST, "skills/mass-code-review/index.html");
    const scriptEl = d.querySelector('script[type="application/ld+json"]')!;
    expect(scriptEl, "JSON-LD script missing").not.toBeNull();
    const jsonLd: unknown[] = JSON.parse(scriptEl.textContent ?? "[]");
    expect(Array.isArray(jsonLd)).toBe(true);
    const types = (jsonLd as Array<{ "@type": string }>).map((n) => n["@type"]);
    expect(types).toContain("WebSite");
    expect(types).toContain("SoftwareSourceCode");
    expect(types).toContain("BreadcrumbList");
    const softwareNode = (jsonLd as Array<{ "@type": string; name: string; version: string; license: string }>).find(
      (n) => n["@type"] === "SoftwareSourceCode",
    )!;
    expect(softwareNode.name).toBe("mass-code-review");
    expect(softwareNode.license).toBe("https://creativecommons.org/licenses/by/4.0/");
  });

  it("home page has WebSite JSON-LD only (no SoftwareSourceCode)", () => {
    const d = dom(DIST, "index.html");
    const scriptEl = d.querySelector('script[type="application/ld+json"]')!;
    expect(scriptEl, "JSON-LD script missing").not.toBeNull();
    const jsonLd: unknown[] = JSON.parse(scriptEl.textContent ?? "[]");
    const types = (jsonLd as Array<{ "@type": string }>).map((n) => n["@type"]);
    expect(types).toContain("WebSite");
    expect(types).not.toContain("SoftwareSourceCode");
    expect(types).not.toContain("BreadcrumbList");
  });

  it("sitemap.xml lists all skill pages and all static pages", () => {
    const content = html(DIST, "sitemap.xml");
    const names: string[] = (registry.skills as Array<{ name: string }>).map((s) => s.name);
    for (const name of names) {
      expect(content, `sitemap missing skill ${name}`).toContain(`skills/${name}/`);
    }
  });
});
