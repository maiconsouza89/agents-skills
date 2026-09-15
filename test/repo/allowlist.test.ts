import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../../tools/allowlist";

function capture() {
  let out = "";
  let err = "";
  return { out: { write: (s: string) => (out += s) }, err: { write: (s: string) => (err += s) }, get: () => ({ out, err }) };
}

function file(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mass-allow-"));
  const p = join(dir, "security-scan-allowlist.yaml");
  writeFileSync(p, content);
  return p;
}

describe("allowlist", () => {
  it("expired entry fails with the entry named and no flags printed", () => {
    const p = file(`- risk: prompt-injection
  skill: mass-alpha
  reason: false positive on the word ignore
  expiresAt: "2026-09-01"
- risk: dangerous-download
  skill: mass-beta
  reason: documented curl in a code block
  expiresAt: "2027-01-01"
`);
    const c = capture();
    expect(main(["--file", p, "--today", "2026-09-14"], c.out, c.err)).toBe(1);
    expect(c.get().err).toBe("Allowlist entry expired: prompt-injection mass-alpha 2026-09-01\n");
    expect(c.get().out).toBe("");
  });

  it("valid entries become ignore flags, and an empty allowlist prints nothing", () => {
    const p = file(`- risk: prompt-injection
  skill: mass-alpha
  reason: false positive
  expiresAt: "2026-12-31"
- risk: prompt-injection
  skill: mass-beta
  reason: same phrase
  expiresAt: "2026-12-31"
- risk: dangerous-download
  skill: mass-beta
  reason: documented
  expiresAt: "2026-09-14"
`);
    const c = capture();
    expect(main(["--file", p, "--today", "2026-09-14"], c.out, c.err)).toBe(0);
    expect(c.get().out).toBe("--ignore-risks prompt-injection,dangerous-download\n");
    expect(c.get().err).toBe("");
    const empty = capture();
    expect(main(["--file", file("[]\n"), "--today", "2026-09-14"], empty.out, empty.err)).toBe(0);
    expect(empty.get().out).toBe("");
    const committed = capture();
    expect(main(["--file", join(new URL("../..", import.meta.url).pathname, "security-scan-allowlist.yaml")], committed.out, committed.err)).toBe(0);
    const bad = capture();
    expect(main(["--file", file("- risk: x\n  skill: y\n"), "--today", "2026-09-14"], bad.out, bad.err)).toBe(1);
    expect(bad.get().err).toContain('missing "reason"');
  });
});
