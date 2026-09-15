import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const SKILL = read("skills/mass-issue-priority/SKILL.md");
const RUBRIC = read("skills/mass-issue-priority/references/rubric.md");
const SIBLING = read("skills/mass-issue-complexity/SKILL.md");
const LEVELS = ["p0", "p1", "p2", "backlog"];

const frontmatter = (text: string) => text.split("---")[1];
const description = (text: string) => frontmatter(text).split("\n").find((l) => l.startsWith("description:"))!.slice("description:".length).trim();
// The level's own section, bounded by the next heading of any level - the last level heading is
// followed by `## ` sections, so splitting on `### ` alone would swallow the rest of the file.
const section = (level: string) => RUBRIC.split(/\n#{2,3} /).find((s) => new RegExp(`^\`?${level}\`?\\b`).test(s))!;

describe("mass-issue-priority", () => {
  it("carries the catalog frontmatter", () => {
    const fm = frontmatter(SKILL);
    for (const line of [
      "name: mass-issue-priority",
      "license: CC-BY-4.0",
      "author: mass-solutions",
      'version: "0.1.0"',
      "category: workflow",
      'tags: "issues, triage, prioritization, priority"',
    ]) {
      expect(fm, line).toContain(line);
    }
    expect(fm).toMatch(/reviewed: "\d{4}-\d{2}-\d{2}"/);
  });

  it("describes itself by the catalog formula", () => {
    const d = description(SKILL);
    expect(d.length).toBeLessThanOrEqual(1024);
    expect(d).toMatch(/^.+\. Use when ".+", ".+" or ".+"\. Do NOT use for .+\.$/);
    const doNot = d.slice(d.indexOf("Do NOT use for"));
    expect(doNot).toContain("mass-issue-complexity");
    expect(doNot).toContain("mass-pr-description");
  });

  it("separates itself from the sibling skills in the evals", () => {
    const triggers = JSON.parse(read("skills/mass-issue-priority/evals/triggers.json"));
    expect(triggers.should.length).toBeGreaterThanOrEqual(3);
    expect(triggers.shouldNot.length).toBeGreaterThanOrEqual(3);
    expect(triggers.shouldNot.some((p: string) => /complex/i.test(p))).toBe(true);
    expect(triggers.shouldNot.some((p: string) => /pull request description/i.test(p))).toBe(true);
  });

  it("is listed in the registry", () => {
    const registry = JSON.parse(read("skills-registry.json"));
    const entry = registry.skills.find((s: { name: string }) => s.name === "mass-issue-priority");
    expect(entry, "mass-issue-priority in skills-registry.json").toBeDefined();
    expect(entry.category).toBe("workflow");
  });

  it("points the sibling skill at this one", () => {
    const d = description(SIBLING);
    expect(d.slice(d.indexOf("Do NOT use for"))).toContain("mass-issue-priority");
    expect(frontmatter(SIBLING)).toContain('version: "0.1.1"');
  });

  it("fixes the output contract", () => {
    // The fenced block itself, not the prose around it: the contract is what a caller copies.
    const block = SKILL.split("```").find((b) => b.includes("Priority: <p0|p1|p2|backlog>"))!;
    expect(block, "fenced output block").toBeDefined();
    expect(block.trim().split("\n")[0]).toBe("Priority: <p0|p1|p2|backlog>");
    expect(block).toContain("Justification:");
    expect(block).toMatch(/2 to 4 bullets/);
  });

  it("says it writes nothing", () => {
    expect(SKILL).toMatch(/no label is applied/i);
    expect(SKILL).toMatch(/nothing is written to a project board/i);
    expect(SKILL).toMatch(/the issue is not\s+rewritten/i);
  });

  it("sends the reader to the rubric first", () => {
    expect(SKILL).toContain("references/rubric.md");
    expect(SKILL).toMatch(/read it before the first classification/i);
  });

  it("defines every level with its signals", () => {
    for (const level of LEVELS) {
      const body = section(level);
      const signals = body.split("\n").filter((l) => l.startsWith("- "));
      expect(signals.length, `${level} signals`).toBeGreaterThanOrEqual(3);
    }
  });

  it("names what does not count as a signal", () => {
    const body = RUBRIC.split("\n## ").find((s) => s.startsWith("What does not count"))!;
    for (const nonSignal of [/complexity or effort/i, /urgent tone/i, /length of the text/i, /priority already written/i, /who opened it/i]) {
      expect(body, String(nonSignal)).toMatch(nonSignal);
    }
  });

  it("breaks ties downward", () => {
    const body = RUBRIC.split("\n## ").find((s) => s.startsWith("Tie-breaking"))!;
    expect(body).toMatch(/strongest impact signal wins/i);
    expect(body).toMatch(/neighbouring levels, take the lower one/i);
    expect(body).toMatch(/name in the justification the\s+signal that would raise it/i);
  });

  it("still answers on a vague issue", () => {
    expect(SKILL).toMatch(/still return the most likely\s+level/i);
    expect(SKILL).toMatch(/name the\s+missing detail that would change it/i);
  });

  it("works an example for every level", () => {
    const body = RUBRIC.split("\n## ").find((s) => s.startsWith("Worked examples"))!;
    for (const level of LEVELS) {
      const example = body.split("\n- ").find((e) => e.includes(`-> \`${level}\``));
      expect(example, `worked example for ${level}`).toBeDefined();
      expect(example!.split("->")[0].length, `${level} example states an issue`).toBeGreaterThan(40);
    }
  });
});
