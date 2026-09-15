import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe(".github", () => {
  it("codeowners lists the maintainer for everything and for skills/", () => {
    const lines = read(".github/CODEOWNERS").trim().split("\n");
    expect(lines).toEqual(["* @maiconsouza89", "/skills/ @maiconsouza89"]);
  });

  it("issue templates are valid issue forms with the required fields", () => {
    const proposal = parse(read(".github/ISSUE_TEMPLATE/skill-proposal.yml"));
    const bug = parse(read(".github/ISSUE_TEMPLATE/skill-bug.yml"));
    for (const form of [proposal, bug]) {
      expect(typeof form.name).toBe("string");
      expect(typeof form.description).toBe("string");
      expect(Array.isArray(form.body)).toBe(true);
    }
    const ids = (form: { body: Array<{ id?: string }> }) => form.body.map((b) => b.id).filter(Boolean);
    expect(ids(proposal)).toEqual(expect.arrayContaining(["name", "problem", "use-when", "do-not-use", "agents"]));
    expect(ids(bug)).toEqual(expect.arrayContaining(["skill", "agent", "version", "expected", "observed"]));
    const nameField = proposal.body.find((b: { id?: string }) => b.id === "name");
    expect(nameField.attributes.description).toContain("mass-");
  });

  it("pull request template requires a linked issue and the checklist", () => {
    const tpl = read(".github/PULL_REQUEST_TEMPLATE.md");
    expect(tpl).toContain("Issue vinculada: #");
    expect(tpl).toMatch(/- \[ \] .*pnpm check/);
    expect(tpl).toMatch(/- \[ \] .*metadata\.reviewed/);
  });

  it("dependabot covers npm and github-actions weekly", () => {
    const cfg = parse(read(".github/dependabot.yml"));
    expect(cfg.version).toBe(2);
    const eco = cfg.updates.map((u: { "package-ecosystem": string }) => u["package-ecosystem"]).sort();
    expect(eco).toEqual(["github-actions", "npm"]);
    for (const u of cfg.updates) expect(u.schedule.interval).toBe("weekly");
  });
});
