import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { DOOR_10 } from "../../../packages/cli/test/door10.js";
import { BASE, DIST, REPO_ROOT, SITE_ROOT, buildSite, dom, html, text, walk } from "./helpers";

const registry = JSON.parse(readFileSync(join(REPO_ROOT, "skills-registry.json"), "utf8"));
const categories = JSON.parse(readFileSync(join(REPO_ROOT, "skills", "_categories.json"), "utf8")) as Array<{
  id: string;
  en: string;
  "pt-br": string;
}>;
const names: string[] = registry.skills.map((s: { name: string }) => s.name);
const REPO = "maiconsouza89/agents-skills";

let files: string[] = [];
beforeAll(() => {
  buildSite();
  files = walk(DIST);
});

describe("site build", () => {
  it("generates every route under the base for en and pt-br", () => {
    const expected = ["404.html", "index.html", "install/index.html", "agents/index.html", "search-index.json", "pt-br/index.html", "pt-br/install/index.html", "pt-br/agents/index.html"];
    for (const n of names) expected.push(`skills/${n}/index.html`, `pt-br/skills/${n}/index.html`);
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

  it("home lists grouped and ordered skills with search, filter and a language switch", () => {
    for (const [page, lang, switchTo] of [
      ["index.html", "en", `${BASE}pt-br/`],
      ["pt-br/index.html", "pt-br", BASE],
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
      expect(d.querySelector("[data-lang-switch]")!.getAttribute("href")).toBe(switchTo);
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
      }
    }
  });

  it("404 page links to both catalogs", () => {
    const d = dom(DIST, "404.html");
    const hrefs = [...d.querySelectorAll("main a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(BASE);
    expect(hrefs).toContain(`${BASE}pt-br/`);
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

  it("zero client js outside home, one script on the home page", () => {
    for (const f of files.filter((f) => f.endsWith(".html"))) {
      const count = (html(DIST, f).match(/<script/g) ?? []).length;
      if (f === "index.html" || f === "pt-br/index.html") expect(count, f).toBe(1);
      else expect(count, f).toBe(0);
    }
    expect(html(DIST, "index.html")).toContain("search-index.json");
  });
});
