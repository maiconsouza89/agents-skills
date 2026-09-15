import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
// Spelled indirectly so the repo-wide grep in triage-issue.test.ts keeps meaning something.
const REMOVED_COMMAND = ["set", "complexity"].join("-");

function headingOrder(text: string, headings: string[]) {
  const idx = headings.map((h) => text.indexOf(`\n## ${h}`));
  for (const [i, h] of headings.entries()) expect(idx[i], `heading "${h}"`).toBeGreaterThanOrEqual(0);
  for (let i = 1; i < idx.length; i++) expect(idx[i], `"${headings[i]}" after "${headings[i - 1]}"`).toBeGreaterThan(idx[i - 1]);
}

describe("documents", () => {
  it("licenses: MIT at the root, CC-BY-4.0 for skills, both declared in the readme", () => {
    expect(read("LICENSE")).toMatch(/^MIT License/);
    expect(read("skills/LICENSE")).toContain("Creative Commons Attribution 4.0");
    const text = read("README.md");
    expect(text).toContain("MIT");
    expect(text).toContain("CC-BY-4.0");
    expect(text).toContain("skills/LICENSE");
  });

  it("readme sections in order, pointing to the site, with the three install paths and the hash warning", () => {
    const text = read("README.md");
    headingOrder(text, [
      "What are skills?",
      "Security and trust",
      "Supported agents",
      "Skills in the catalog",
      "Quick start",
      "CLI reference",
      "How it works",
      "Contributing",
      "Reporting a vulnerability",
      "License and attribution",
    ]);
    expect(text).toContain("https://maiconsouza89.github.io/agents-skills/");
    expect(text).toContain("npx @mass-solutions/skills-cli install");
    expect(text).toContain("npx skills add maiconsouza89/agents-skills");
    expect(text).toContain("/plugin marketplace add maiconsouza89/agents-skills");
    expect(text).toContain("Only the `mass-skills` CLI verifies hashes");
    expect(text).toContain("CONTRIBUTING.md");
    expect(text).toContain("SECURITY.md");
  });

  it("contributing: issue-first, the new-skill flow, conventional commits and the reviewed rule", () => {
    const text = read("CONTRIBUTING.md");
    expect(text).toContain("Issue first");
    expect(text).toContain("pnpm new-skill");
    expect(text).toContain("pnpm check");
    expect(text).toMatch(/PR|pull request/i);
    expect(text).toContain("Conventional Commits");
    expect(text).toContain("metadata.reviewed");
    expect(text).toMatch(/members.*directly/i);
  });

  it("security policy: private advisory, no public issue, validator + snyk, allowlist with expiresAt", () => {
    const text = read("SECURITY.md");
    expect(text).toContain("/security/advisories/new");
    expect(text).toContain("Never open a public issue");
    expect(text).toContain("Validator");
    expect(text).toContain("Snyk Agent Scan");
    expect(text).toContain("security-scan-allowlist.yaml");
    expect(text).toContain("expiresAt");
  });

  it("agents and claude: AGENTS.md points to CLAUDE.md, which holds the catalog rules", () => {
    const agents = read("AGENTS.md");
    expect(agents).toContain("CLAUDE.md");
    const claude = read("CLAUDE.md");
    expect(claude).toContain("AGENTS.md");
    expect(claude).toContain("skills/<name>/SKILL.md");
    expect(claude).toContain("^mass-[a-z0-9]+(-[a-z0-9]+)*$");
    expect(claude).toContain("Use when");
    expect(claude).toContain("Do NOT use for");
    expect(claude).toContain("pnpm check");
    expect(claude).toMatch(/pt-BR/);
    expect(claude).toMatch(/[Ii]ngl[êe]s|English/);
  });

  it("claude md describes the label triage flow", () => {
    const section = read("CLAUDE.md").split("\n## ").find((s) => s.startsWith("Fluxo com o GitHub Project"))!;
    for (const token of ["priority:", "area:", "complexity:", "project-fields.yml", "pnpm triage-issue <N>"]) {
      expect(section, token).toContain(token);
    }
    expect(section).not.toContain(REMOVED_COMMAND);
    expect(section).not.toMatch(/escopo `repo`\+`workflow`|`workflow`, além/);
  });

  it("claude md carries the area rule", () => {
    const section = read("CLAUDE.md").split("\n## ").find((s) => s.startsWith("Fluxo com o GitHub Project"))!;
    const mappings: Array<[string, string]> = [
      ["cli:", "CLI"],
      ["core:", "Core"],
      ["mcp:", "Core"],
      ["site:", "Site"],
      ["ci:", "CI"],
      ["release:", "CI"],
      ["catalog:", "Catalog"],
      ["skill:", "Catalog"],
    ];
    const rule = section.split("\n").find((l) => l.includes("Regra de Area"))!;
    for (const [prefix, area] of mappings) expect(rule, prefix).toMatch(new RegExp(`${prefix.replace(":", ":")}[^→]*→ ${area}`));
    expect(rule).toContain("tools/");
    expect(rule).toContain(".github/");
  });

  it("readme lists the maintainer commands", () => {
    const text = read("README.md");
    expect(text).toMatch(/tools\/ +maintainer scripts \([^)]*triage-issue[^)]*\)/);
    const line = text.split("\n").find((l) => l.startsWith("Maintainer commands:"))!;
    expect(line).toContain("pnpm triage-issue <number>");
    for (const flag of ["--priority", "--area", "--complexity"]) expect(line, flag).toContain(flag);
    expect(text).not.toContain(REMOVED_COMMAND);
  });
});
