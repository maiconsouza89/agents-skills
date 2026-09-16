import { describe, expect, it } from "vitest";
import { main } from "../src/bin/validate.js";
import { makeRoot, makeSkill, validFrontmatter } from "./helpers.js";

function sink() {
  let text = "";
  return { write: (s: string) => (text += s), text: () => text };
}

// The bin runs in-process: `pnpm validate` inside `pnpm check` already exercises the process entry.
function run(root: string) {
  const out = sink();
  const err = sink();
  const status = main([root], out, err);
  return { status, stdout: out.text(), stderr: err.text() };
}

describe("validate bin", () => {
  it("prints one line per finding and exits 1", () => {
    const root = makeRoot();
    makeSkill(root, "mass-bad", { frontmatter: validFrontmatter("mass-bad", { extra: "yes", license: "MIT" }) });
    const res = run(root);
    expect(res.status).toBe(1);
    const lines = res.stdout.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const line of lines) {
      expect(line).toMatch(/^[a-z-]+\/[a-z-]+ skills\/mass-bad\/SKILL\.md:\d+ .+$/);
    }
    expect(lines.some((l) => l.startsWith("frontmatter/unknown-key "))).toBe(true);
    expect(lines.some((l) => l.startsWith("frontmatter/metadata "))).toBe(true);
  });

  it("exits 0 with nothing on stdout when the catalog is clean", () => {
    const root = makeRoot();
    makeSkill(root, "mass-ok");
    const res = run(root);
    expect(res.status).toBe(0);
    expect(res.stdout).toBe("");
  });
});
