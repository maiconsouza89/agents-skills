import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function headingOrder(text: string, headings: string[]) {
  const idx = headings.map((h) => text.indexOf(`\n## ${h}`));
  for (const [i, h] of headings.entries()) expect(idx[i], `heading "${h}"`).toBeGreaterThanOrEqual(0);
  for (let i = 1; i < idx.length; i++) expect(idx[i], `"${headings[i]}" after "${headings[i - 1]}"`).toBeGreaterThan(idx[i - 1]);
}

describe("documents", () => {
  it("licenses: MIT at the root, CC-BY-4.0 for skills, both declared in the readmes", () => {
    expect(read("LICENSE")).toMatch(/^MIT License/);
    expect(read("skills/LICENSE")).toContain("Creative Commons Attribution 4.0");
    for (const readme of ["README.md", "README.pt-br.md"]) {
      const text = read(readme);
      expect(text).toContain("MIT");
      expect(text).toContain("CC-BY-4.0");
      expect(text).toContain("skills/LICENSE");
    }
  });

  it("readme sections in order for EN and PT, with the three install paths and the hash warning", () => {
    const en = read("README.md");
    headingOrder(en, ["What is this", "Install", "Skills", "Contributing", "Security", "License"]);
    const pt = read("README.pt-br.md");
    headingOrder(pt, ["O que é", "Instalação", "Skills", "Contribuir", "Segurança", "Licença"]);
    for (const text of [en, pt]) {
      expect(text).toContain("mass-skills");
      expect(text).toContain("npx skills add maiconsouza89/mass-solutions-skills");
      expect(text).toContain("/plugin marketplace add maiconsouza89/mass-solutions-skills");
      expect(text).toMatch(/Only the `mass-skills` CLI verifies hashes|Só o CLI `mass-skills` verifica hash/);
      expect(text).toContain("CONTRIBUTING.md");
      expect(text).toContain("SECURITY.md");
    }
  });

  it("contributing: issue-first, the new-skill flow, conventional commits and the reviewed rule", () => {
    const text = read("CONTRIBUTING.md");
    expect(text).toMatch(/[Ii]ssue primeiro|[Ii]ssue first/);
    expect(text).toContain("pnpm new-skill");
    expect(text).toContain("pnpm check");
    expect(text).toMatch(/PR|pull request/i);
    expect(text).toContain("Conventional Commits");
    expect(text).toContain("metadata.reviewed");
    expect(text).toMatch(/membros.*PR direto|members.*directly/i);
  });

  it("security policy: private advisory, no public issue, validator + snyk, allowlist with expiresAt", () => {
    const text = read("SECURITY.md");
    expect(text).toContain("/security/advisories/new");
    expect(text).toMatch(/[Nn]unca abra uma issue pública|[Nn]ever open a public issue/);
    expect(text).toMatch(/[Vv]alidador|[Vv]alidator/);
    expect(text).toContain("Snyk Agent Scan");
    expect(text).toContain("security-scan-allowlist.yaml");
    expect(text).toContain("expiresAt");
  });

  it("agents and claude: catalog rules, the tlc-spec-lean block, and CLAUDE.md pointing to AGENTS.md", () => {
    const agents = read("AGENTS.md");
    expect(agents).toContain("skills/<name>/SKILL.md");
    expect(agents).toContain("^mass-[a-z0-9]+(-[a-z0-9]+)*$");
    expect(agents).toContain("Use when");
    expect(agents).toContain("Do NOT use for");
    expect(agents).toContain("pnpm check");
    expect(agents).toMatch(/\n## tlc-spec-lean\n\nprofile: standard\nbudget: 150k\n/);
    const claude = read("CLAUDE.md");
    expect(claude).toContain("AGENTS.md");
    expect(claude).toMatch(/pt-BR/);
    expect(claude).toMatch(/[Ii]ngl[êe]s|English/);
  });
});
