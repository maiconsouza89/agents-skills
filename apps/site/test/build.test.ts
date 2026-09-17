import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { DOOR_10 } from "../../../packages/cli/test/door10.js";
import { BASE, DIST, REPO_ROOT, SITE_ROOT, buildSite, dom, html, text, walk } from "./helpers";
import { LANG_META, LANGS, t, type Lang } from "../src/lib/i18n";

const registry = JSON.parse(readFileSync(join(REPO_ROOT, "skills-registry.json"), "utf8"));
const categories = JSON.parse(readFileSync(join(REPO_ROOT, "skills", "_categories.json"), "utf8")) as Array<{
  id: string;
  en: string;
  "pt-br": string;
}>;
const names: string[] = registry.skills.map((s: { name: string }) => s.name);
const REPO = "maiconsouza89/agents-skills";
const SITE_URL = "https://maiconsouza89.github.io";

/** Category ids that have at least one skill, in `_categories.json` order. */
function usedCategoryIds(): string[] {
  return categories.map((c) => c.id).filter((id) => registry.skills.some((s: { category: string }) => s.category === id));
}

/** The header language switch: a disclosure that shows only the current code, named "Language: <code>", listing one link per language. */
function expectLangSwitch(d: Document, lang: Lang, switchTo: string) {
  const switches = d.querySelectorAll("[data-lang-switch]");
  expect(switches).toHaveLength(1);
  const menu = switches[0];
  expect(menu.tagName).toBe("DETAILS");
  const summary = menu.querySelector("summary")!;
  expect(text(summary)).toBe(`${t(lang).language}: ${LANG_META[lang].code}`);
  expect(text(summary.querySelector(":scope > .sr-only"))).toBe(`${t(lang).language}:`);
  const links = [...menu.querySelectorAll("a")];
  expect(links.map((a) => a.getAttribute("hreflang"))).toEqual(LANGS);
  const current = links.find((a) => a.getAttribute("hreflang") === lang)!;
  const other = links.find((a) => a.getAttribute("hreflang") !== lang)!;
  expect(current.getAttribute("aria-current")).toBe("true");
  expect(other.hasAttribute("aria-current")).toBe(false);
  expect(other.getAttribute("href")).toBe(switchTo);
  for (const [i, a] of links.entries()) expect(text(a)).toBe(`${LANG_META[LANGS[i]].code} ${LANG_META[LANGS[i]].name}`);
}

let files: string[] = [];
beforeAll(() => {
  buildSite();
  files = walk(DIST);
});

describe("site build", () => {
  it("generates every route under the base for en and pt-br", () => {
    const expected = ["404.html", "index.html", "catalog/index.html", "install/index.html", "agents/index.html", "security/index.html", "about/index.html", "search-index.json", "pt-br/index.html", "pt-br/catalog/index.html", "pt-br/install/index.html", "pt-br/agents/index.html", "pt-br/security/index.html", "pt-br/about/index.html"];
    for (const n of names) expected.push(`skills/${n}/index.html`, `pt-br/skills/${n}/index.html`);
    for (const c of usedCategoryIds()) expected.push(`catalog/${c}/index.html`, `pt-br/catalog/${c}/index.html`);
    for (const e of expected) expect(files, e).toContain(e);
    expect(files.filter((f) => f.startsWith("skills/"))).toHaveLength(names.length);
    for (const f of files.filter((f) => f.endsWith(".html"))) {
      const page = html(DIST, f);
      for (const m of page.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
        expect(m[1], `${f}: ${m[1]}`).toMatch(new RegExp(`^${BASE.replace(/\//g, "\\/")}`));
      }
    }
    expect(JSON.parse(html(DIST, "search-index.json")).map((s: { name: string }) => s.name).sort()).toEqual([...names].sort());
  });

  it("reads the catalog in place through glob() and never copies SKILL.md into the site", () => {
    const config = readFileSync(join(SITE_ROOT, "src", "content.config.ts"), "utf8");
    expect(config).toContain("glob({");
    expect(config).toMatch(/pattern:\s*"\*\/SKILL\.md"/);
    expect(config).toMatch(/base:\s*CATALOG_ROOT/);
    const astroConfig = readFileSync(join(SITE_ROOT, "astro.config.mjs"), "utf8");
    expect(astroConfig).toContain('process.env.MASS_CATALOG_ROOT ||= src("../../skills")');
    const copies = walk(SITE_ROOT).filter((f) => f.endsWith("SKILL.md") && !f.startsWith("node_modules/") && !f.startsWith("dist"));
    expect(copies).toEqual([]);
  });

  it("home explains what an Agent Skill is, in each language, without repeating the other language", () => {
    const seen: string[][] = [];
    for (const [page, lang] of [
      ["index.html", "en"],
      ["pt-br/index.html", "pt-br"],
    ] as const) {
      const d = dom(DIST, page);
      const block = d.querySelector("[data-what-is]")!;
      expect(block, page).toBeTruthy();
      expect(text(block.querySelector("h2")!)).toBe(t(lang).whatIsTitle);
      const points = [...block.querySelectorAll("[data-what-is-point]")];
      expect(points.map((p) => text(p.querySelector("h3")!))).toEqual(t(lang).whatIsPoints.map((p) => p.title));
      for (const [i, point] of points.entries()) {
        expect(text(point.querySelector("p")!)).toBe(t(lang).whatIsPoints[i].body);
      }
      // The block sits above the catalog CTA, confirming the page leads the user toward the catalog.
      const catalogCta = d.querySelector("[data-catalog-cta]");
      expect(catalogCta, page).not.toBeNull();
      seen.push(points.map((p) => text(p)));
    }
    expect(seen[0]).not.toEqual(seen[1]);
  });

  it("catalog lists grouped and ordered skills with search, filter and a language switch", () => {
    for (const [page, lang, switchTo] of [
      ["catalog/index.html", "en", `${BASE}pt-br/catalog/`],
      ["pt-br/catalog/index.html", "pt-br", `${BASE}catalog/`],
    ] as const) {
      const d = dom(DIST, page);
      const sections = [...d.querySelectorAll("[data-catalog] > section[data-category]")];
      const usedIds = categories.map((c) => c.id).filter((id) => registry.skills.some((s: { category: string }) => s.category === id));
      expect(sections.map((s) => s.getAttribute("data-category"))).toEqual(usedIds);
      let total = 0;
      for (const section of sections) {
        const id = section.getAttribute("data-category")!;
        const label = categories.find((c) => c.id === id)![lang];
        expect(text(section.querySelector("h2"))).toContain(label);
        const items = [...section.querySelectorAll("[data-skill]")];
        const itemNames = items.map((li) => li.getAttribute("data-name"));
        expect(itemNames).toEqual([...itemNames].sort());
        for (const li of items) {
          const name = li.getAttribute("data-name")!;
          const reg = registry.skills.find((s: { name: string }) => s.name === name);
          expect(li.querySelector("a")!.getAttribute("href")).toBe(`${BASE}${lang === "en" ? "" : "pt-br/"}skills/${name}/`);
          expect(text(li)).toContain(name);
          expect(text(li)).toContain(reg.description);
          expect(text(li)).toContain(reg.version);
        }
        total += items.length;
      }
      expect(total).toBe(names.length);
      expect(d.querySelector("input#q")).not.toBeNull();
      const options = [...d.querySelectorAll<HTMLInputElement>('input[type="radio"][name="category"]')].map((o) => o.getAttribute("value"));
      expect(options).toEqual(["", ...usedIds]);
      expect(d.querySelector<HTMLInputElement>('input[name="category"][value=""]')!.hasAttribute("checked")).toBe(true);
      expectLangSwitch(d, lang, switchTo);
    }
  });

  it("category pages: one per used category, its skills sorted, linked from the catalog and the skill page, empty categories skipped", () => {
    const used = usedCategoryIds();
    expect(files.filter((f) => /^catalog\/[^/]+\/index\.html$/.test(f)).sort()).toEqual(used.map((c) => `catalog/${c}/index.html`).sort());
    for (const lang of LANGS) {
      const prefix = `${BASE}${lang === "en" ? "" : "pt-br/"}`;
      for (const id of used) {
        const d = dom(DIST, `${lang === "en" ? "" : "pt-br/"}catalog/${id}/index.html`);
        const label = categories.find((c) => c.id === id)![lang];
        expect(text(d.querySelector("h1"))).toBe(label);
        const itemNames = [...d.querySelectorAll("[data-skill]")].map((li) => li.getAttribute("data-name"));
        const inCategory = (registry.skills as Array<{ name: string; category: string }>).filter((s) => s.category === id).map((s) => s.name).sort();
        expect(itemNames).toEqual(inCategory);
        const pills = [...d.querySelectorAll("[data-category-links] a")];
        expect(pills.map((a) => a.getAttribute("data-category-link"))).toEqual(used);
        expect(pills.filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.getAttribute("data-category-link"))).toEqual([id]);
        expect(d.querySelector("[data-lang-switch] a:not([aria-current])")!.getAttribute("href")).toBe(`${BASE}${lang === "en" ? "pt-br/" : ""}catalog/${id}/`);
      }
      const catalog = dom(DIST, `${lang === "en" ? "" : "pt-br/"}catalog/index.html`);
      for (const id of used) expect(catalog.querySelector(`h2 [data-category-link="${id}"]`)!.getAttribute("href")).toBe(`${prefix}catalog/${id}/`);
      const skill = registry.skills.find((s: { name: string }) => s.name === "mass-code-review");
      const page = dom(DIST, `${lang === "en" ? "" : "pt-br/"}skills/mass-code-review/index.html`);
      expect(page.querySelector(".page-head [data-category-link]")!.getAttribute("href")).toBe(`${prefix}catalog/${skill.category}/`);
    }
  });

  it("skill page content: description parts, body in english on both routes, metadata, files, hash, source and the install panel", () => {
    const name = "mass-code-review";
    const reg = registry.skills.find((s: { name: string }) => s.name === name);
    const bodies: string[] = [];
    for (const [page, warning] of [
      [`skills/${name}/index.html`, "Only the mass-skills CLI verifies hashes."],
      [`pt-br/skills/${name}/index.html`, "Só o CLI mass-skills verifica hash."],
    ] as const) {
      const d = dom(DIST, page);
      expect(text(d.querySelector("[data-what]"))).toBe("Reviews a pull request or a local diff for correctness bugs, missing tests and unsafe changes, and reports findings with file and line.");
      expect(text(d.querySelector("[data-when]"))).toBe('"review this PR", "review my changes" or "look for bugs in this diff"');
      expect(text(d.querySelector("[data-not]"))).toBe("writing the PR description (use mass-pr-description) or for a security-only audit of a skill (use mass-security-checklist)");
      const body = d.querySelector("[data-skill-body]")!;
      expect(body.getAttribute("lang")).toBe("en");
      expect(body.querySelector("h2[id]")).not.toBeNull();
      bodies.push(body.querySelector("[data-content]")!.innerHTML);
      const meta = text(d.querySelector("[data-metadata]"));
      for (const v of [reg.author, reg.version, reg.reviewed, reg.tags.join(", ")]) expect(meta).toContain(v);
      expect(text(d.querySelector("[data-requires]"))).toBe("git, gh");
      expect(text(d.querySelector("[data-allowed-tools]"))).not.toBe("");
      const fileRows = [...d.querySelectorAll("[data-file]")];
      expect(fileRows.map((r) => r.getAttribute("data-file"))).toEqual(reg.files.map((f: { path: string }) => f.path));
      for (const f of reg.files) expect(text(d.querySelector(`[data-file="${f.path}"]`))).toContain(String(f.bytes));
      expect(text(d.querySelector("[data-content-hash]"))).toBe(reg.contentHash);
      expect(d.querySelector("[data-source]")!.getAttribute("href")).toBe(`https://github.com/${REPO}/tree/main/skills/${name}`);
      const install = text(d.querySelector("[data-install]"));
      expect(install).toContain(`npx @mass-solutions/skills-cli install ${name} -a <agent>`);
      expect(install).toContain(`npx skills add ${REPO} --skill ${name}`);
      expect(install).toContain(`/plugin marketplace add ${REPO}`);
      expect(install).toContain(warning);
    }
    expect(bodies[0]).toBe(bodies[1]);
  });

  it("links every known mass-* reference in \"Do NOT use for\" to that skill's page in the current language", () => {
    // Every mass-* token in the "Do NOT use for" part that names another skill in the catalog, in order.
    const refs = (skill: { name: string; description: string }) =>
      [...(skill.description.split("Do NOT use for")[1] ?? "").matchAll(/mass-[a-z0-9]+(?:-[a-z0-9]+)*/g)]
        .map((m) => m[0])
        .filter((n) => n !== skill.name && names.includes(n));
    const withRefs = (registry.skills as Array<{ name: string; description: string }>).filter((s) => refs(s).length > 0);
    expect(withRefs.length).toBeGreaterThan(0);
    for (const [prefix, lang] of [["", "en"], ["pt-br/", "pt-br"]] as const) {
      for (const skill of withRefs) {
        const d = dom(DIST, `${prefix}skills/${skill.name}/index.html`);
        const not = d.querySelector("[data-not]")!;
        const expected = refs(skill);
        const links = [...not.querySelectorAll("a[data-related]")];
        expect(links.map((a) => a.textContent), `${lang} ${skill.name}`).toEqual(expected);
        for (const a of links) {
          expect(a.getAttribute("href")).toBe(`${BASE}${prefix}skills/${a.textContent}/`);
        }
        // The surrounding prose is untouched: the rendered text still matches the description formula.
        expect(text(not)).toBe(skill.description.split("Do NOT use for")[1].trim().replace(/\.$/, ""));
      }
    }
  });

  it("splitSkillRefs keeps punctuation out of the reference and leaves unknown mass-* names as text", async () => {
    process.env.MASS_CATALOG_ROOT ??= join(REPO_ROOT, "skills");
    const { splitSkillRefs } = await import("../src/lib/catalog");
    expect(splitSkillRefs("writing X (use mass-y).", ["mass-y"])).toEqual([
      { text: "writing X (use " },
      { text: "mass-y", skill: "mass-y" },
      { text: ")." },
    ]);
    expect(splitSkillRefs("a (use mass-gone) or mass-y", ["mass-y"])).toEqual([
      { text: "a (use mass-gone) or " },
      { text: "mass-y", skill: "mass-y" },
    ]);
  });

  it("minimal skill omits extra files section and lists only SKILL.md; a skill with references/ shows it", () => {
    const minimal = dom(DIST, "skills/mass-security-checklist/index.html");
    expect(minimal.querySelector("[data-extra-files]")).toBeNull();
    expect([...minimal.querySelectorAll("[data-file]")].map((r) => r.getAttribute("data-file"))).toEqual(["SKILL.md"]);
    const rich = dom(DIST, "skills/mass-skill-authoring/index.html");
    expect(text(rich.querySelector("[data-extra-files]"))).toContain("references/");
  });

  it("install and agents pages: three paths in order with what each verifies, and the eight agents with both paths", () => {
    for (const [page, titles] of [
      ["install/index.html", ["1. mass-skills CLI", "2. npx skills add", "3. Claude Code marketplace"]],
      ["pt-br/install/index.html", ["1. CLI mass-skills", "2. npx skills add", "3. Marketplace do Claude Code"]],
    ] as const) {
      const d = dom(DIST, page);
      const items = [...d.querySelectorAll("[data-install-paths] > li")];
      expect(items.map((li) => text(li.querySelector("h2")))).toEqual([...titles]);
      expect(text(items[0])).toMatch(/sha256/);
      expect(text(items[1])).toMatch(/Nothing is verified|Nada é conferido/);
      expect(text(items[2])).toMatch(/No hash verification|Sem verificação de hash/);
    }
    for (const page of ["agents/index.html", "pt-br/agents/index.html"]) {
      const d = dom(DIST, page);
      const rows = [...d.querySelectorAll("[data-agents] tbody tr")];
      expect(rows.map((r) => r.getAttribute("data-agent"))).toEqual(DOOR_10.map((a) => a.id));
      for (const a of DOOR_10) {
        const row = text(d.querySelector(`[data-agent="${a.id}"]`));
        expect(row).toContain(`${a.project}/`);
        expect(row).toContain(`~/${a.global}/`);
        expect(d.querySelector(`[data-agent="${a.id}"] a`)!.getAttribute("href")).toBe(`${BASE}${page.startsWith("pt-br/") ? "pt-br/" : ""}agents/${a.id}/`);
      }
    }
  });

  it("agent pages: one per supported agent with the install command, both paths and the category links", () => {
    expect(files.filter((f) => /^agents\/[^/]+\/index\.html$/.test(f)).sort()).toEqual(DOOR_10.map((a) => `agents/${a.id}/index.html`).sort());
    for (const lang of LANGS) {
      for (const a of DOOR_10) {
        const d = dom(DIST, `${lang === "en" ? "" : "pt-br/"}agents/${a.id}/index.html`);
        expect(text(d.querySelector("h1"))).toBe(t(lang).agentTitle(a.id));
        expect(text(d.querySelector("[data-agent-install] code"))).toBe(`npx @mass-solutions/skills-cli install <skill> -a ${a.id}`);
        const paths = text(d.querySelector("[data-agent-paths]"));
        expect(paths).toContain(`${a.project}/`);
        expect(paths).toContain(`~/${a.global}/`);
        expect(d.querySelectorAll("[data-category-links] a")).toHaveLength(usedCategoryIds().length);
        expect(d.querySelector("[data-category-links] [aria-current]")).toBeNull();
      }
    }
  });

  it("about page: localized sections in each language, nav entry marked current, language switch to the other about", () => {
    const seen: string[] = [];
    for (const [page, lang, switchTo] of [
      ["about/index.html", "en", `${BASE}pt-br/about/`],
      ["pt-br/about/index.html", "pt-br", `${BASE}about/`],
    ] as const) {
      const d = dom(DIST, page);
      const dict = t(lang);
      const about = d.querySelector("[data-about]")!;
      expect(about, page).toBeTruthy();
      expect(text(about.querySelector("h1"))).toBe(dict.aboutTitle);
      expect(text(about.querySelector(".page-head p.body-lg"))).toBe(dict.aboutIntro);
      const sections = [...about.querySelectorAll("[data-about-section]")];
      expect(sections.map((s) => text(s.querySelector("h2")))).toEqual(dict.aboutSections.map((s) => s.title));
      for (const [i, s] of sections.entries()) expect(text(s.querySelector("p"))).toBe(dict.aboutSections[i].body);
      const trust = [...about.querySelectorAll("[data-about-trust-point]")];
      expect(trust.map((p) => text(p.querySelector("h3")))).toEqual(dict.aboutTrust.map((p) => p.title));
      expect(text(about.querySelector("[data-about-team] p.body-lg"))).toBe(dict.aboutTeamBody);
      expect(about.querySelector("[data-maintainer]")!.getAttribute("href")).toBe("https://github.com/maiconsouza89");
      const cta = [...about.querySelectorAll("[data-about-cta] a")].map((a) => a.getAttribute("href"));
      expect(cta).toEqual([`https://github.com/${REPO}/blob/main/CONTRIBUTING.md`, `https://github.com/${REPO}/blob/main/SECURITY.md`]);
      const current = d.querySelector('.nav-links a[aria-current="page"]')!;
      expect(text(current)).toBe(dict.nav.about);
      expect(current.getAttribute("href")).toBe(`${BASE}${lang === "en" ? "" : "pt-br/"}about/`);
      expectLangSwitch(d, lang, switchTo);
      const otherHreflang = lang === "en" ? "pt-BR" : "en";
      expect(d.querySelector(`link[rel="alternate"][hreflang="${otherHreflang}"]`)!.getAttribute("href")).toBe(`${SITE_URL}${switchTo}`);
      // The footer "Site" column follows the nav, so About is reachable from every page.
      expect([...d.querySelectorAll(".footer a")].map((a) => a.getAttribute("href"))).toContain(`${BASE}${lang === "en" ? "" : "pt-br/"}about/`);
      seen.push(text(about));
    }
    expect(seen[0]).not.toBe(seen[1]);
  });

  it("404 page links to both catalogs", () => {
    const d = dom(DIST, "404.html");
    const hrefs = [...d.querySelectorAll("main a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(`${BASE}catalog/`);
    expect(hrefs).toContain(`${BASE}pt-br/catalog/`);
  });

  it("design tokens: dark canvas, lavender as the only accent, sans body with mono in code, radius from the scale, no shadow or gradient, no ascii markers", () => {
    const css = files.filter((f) => f.endsWith(".css")).map((f) => html(DIST, f)).join("\n");
    expect(css).toMatch(/color-scheme:dark/);
    expect(css).toMatch(/--color-canvas:#010102/);
    expect(css).toMatch(/--color-ink:#f7f8f8/);
    expect(css).toMatch(/--color-primary:#5e6ad2/);
    expect(css).toMatch(/body\{[^}]*background:var\(--color-canvas\)/);
    expect(css).toMatch(/body\{[^}]*color:var\(--color-ink\)/);
    expect(css).toMatch(/body\{[^}]*font-family:var\(--font-sans\)/);
    // Each rule as [selector, declarations]; the selector is what sits between the previous "{" (an @media opener) and this one.
    const rules = css.split("}").filter((b) => b.includes("{")).map((b) => {
      const i = b.lastIndexOf("{");
      return [b.slice(b.lastIndexOf("{", i - 1) + 1, i).trim(), b.slice(i + 1)] as const;
    });
    for (const sel of ["code", "pre", ".snippet", ".terminal"]) {
      const rule = rules.find(([selector, body]) => selector.split(",").map((x) => x.trim()).includes(sel) && body.includes("font-family"))?.[1];
      expect(rule, sel).toMatch(/font-family:var\(--font-mono\)/);
    }
    expect(css).not.toMatch(/box-shadow/);
    expect(css).not.toMatch(/gradient/);
    const radius = rules.filter(([, body]) => body.includes("border-radius"));
    expect(radius.length).toBeGreaterThan(0);
    for (const [selector, body] of radius) expect(body, selector).toMatch(/border-radius:var\(--radius-(xs|sm|md|lg|xl|pill)\)/);
    const primary = rules.filter(([, body]) => body.includes("var(--color-primary)"));
    expect(primary.length).toBeGreaterThan(0);
    for (const [selector] of primary) {
      for (const part of selector.split(",")) expect(part.trim(), selector).toMatch(/^(\.btn-primary|\.brand-mark|\.prose a)\b/);
    }
    const head = html(DIST, "index.html");
    const fontCss = css + head;
    for (const family of ["Inter", "JetBrains Mono"]) {
      expect(fontCss, family).toMatch(new RegExp(`@font-face\\{[^}]*font-family:"?${family}[^}]*url\\(["']?${BASE}_astro/fonts/[^)]+\\.woff2`, "i"));
    }
    expect(head).toMatch(new RegExp(`<link rel="preload" href="${BASE}_astro/fonts/[^"]+\\.woff2"`));
    for (const f of files.filter((f) => f.endsWith(".html"))) {
      const page = html(DIST, f);
      expect(page, f).not.toContain("[+]");
      expect(page, f).not.toContain("[-]");
    }
  });

  it("two scripts on every page (JSON-LD + copy-to-clipboard), three on the catalog page (+ search)", () => {
    for (const f of files.filter((f) => f.endsWith(".html"))) {
      const count = (html(DIST, f).match(/<script/g) ?? []).length;
      if (f === "catalog/index.html" || f === "pt-br/catalog/index.html") expect(count, f).toBe(3);
      else expect(count, f).toBe(2);
    }
    expect(html(DIST, "catalog/index.html")).toContain("search-index.json");
  });
});
