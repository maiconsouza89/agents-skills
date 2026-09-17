import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { BASE, REPO_ROOT, buildSite, dom, html, walk } from "./helpers";
import { LANGS, type Lang } from "../src/lib/i18n";

const SITE_URL = "https://maiconsouza89.github.io";
const registry = JSON.parse(readFileSync(join(REPO_ROOT, "skills-registry.json"), "utf8"));

// Own outDir: other test files build in parallel, and a shared directory would let one
// file's build clobber another file's still-running assertions.
const DIST = mkdtempSync(join(tmpdir(), "mass-site-"));
let files: string[] = [];
beforeAll(() => {
  buildSite(DIST);
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

  for (const [path, prefix, title] of [
    ["feed.xml", "", "Mass Skills: recently reviewed skills"],
    ["pt-br/feed.xml", "pt-br/", "Mass Skills: skills revisadas recentemente"],
  ] as const) {
    it(`${path}: well-formed Atom with one entry per skill, most recently reviewed first`, () => {
      expect(files).toContain(path);
      // Parsing as XML throws on malformed markup, which is the well-formedness check.
      const d = new JSDOM(html(DIST, path), { contentType: "application/xml" }).window.document;
      const feed = d.documentElement;
      expect(feed.tagName).toBe("feed");
      expect(feed.getAttribute("xmlns")).toBe("http://www.w3.org/2005/Atom");
      expect(feed.querySelector(":scope > title")?.textContent).toBe(title);
      expect(feed.querySelector(":scope > id")?.textContent).toBe(`${SITE_URL}${BASE}${path}`);
      expect(feed.querySelector(':scope > link[rel="self"]')?.getAttribute("href")).toBe(`${SITE_URL}${BASE}${path}`);
      expect(feed.querySelector(':scope > link[rel="alternate"]')?.getAttribute("href")).toBe(`${SITE_URL}${BASE}${prefix}catalog/`);

      const skills = registry.skills as Array<{ name: string; reviewed: string; category: string; description: string }>;
      const entries = [...feed.querySelectorAll(":scope > entry")];
      expect(entries).toHaveLength(skills.length);
      const dates = entries.map((e) => e.querySelector("updated")!.textContent!);
      expect(dates).toEqual([...dates].sort().reverse());
      for (const date of dates) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
      expect(feed.querySelector(":scope > updated")?.textContent).toBe(dates[0]);

      const first = entries[0];
      const name = first.querySelector("title")!.textContent!;
      const skill = skills.find((s) => s.name === name)!;
      expect(skill, `feed entry ${name} is not in the registry`).toBeDefined();
      expect(first.querySelector("id")?.textContent).toBe(`${SITE_URL}${BASE}${prefix}skills/${name}/`);
      expect(first.querySelector("link")?.getAttribute("href")).toBe(`${SITE_URL}${BASE}${prefix}skills/${name}/`);
      expect(first.querySelector("updated")?.textContent).toBe(`${skill.reviewed}T00:00:00Z`);
      expect(first.querySelector("category")?.getAttribute("term")).toBe(skill.category);
      expect(first.querySelector("summary")?.textContent).toBe(skill.description);
    });
  }

  it("every page advertises the Atom feed of its own language", () => {
    for (const [page, path] of [
      ["index.html", "feed.xml"],
      ["pt-br/index.html", "pt-br/feed.xml"],
      ["skills/mass-code-review/index.html", "feed.xml"],
      ["pt-br/skills/mass-code-review/index.html", "pt-br/feed.xml"],
    ]) {
      const links = dom(DIST, page).querySelectorAll('link[rel="alternate"][type="application/atom+xml"]');
      expect(links, page).toHaveLength(1);
      expect(links[0].getAttribute("href")).toBe(`${SITE_URL}${BASE}${path}`);
      expect(links[0].getAttribute("title")).toBeTruthy();
    }
  });

  it("sitemap.xml lists all skill pages and all static pages", () => {
    const content = html(DIST, "sitemap.xml");
    const names: string[] = (registry.skills as Array<{ name: string }>).map((s) => s.name);
    for (const name of names) {
      expect(content, `sitemap missing skill ${name}`).toContain(`skills/${name}/`);
    }
  });
});
