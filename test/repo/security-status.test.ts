import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, parseSecurityStatus, STATUS_FILE } from "../../tools/security-status";

const SHA = "a758391a758391a758391a758391a758391a7583";
const RUN = "https://github.com/maiconsouza89/agents-skills/actions/runs/35157801194";

function capture() {
  let out = "";
  let err = "";
  return { out: { write: (s: string) => (out += s) }, err: { write: (s: string) => (err += s) }, get: () => ({ out, err }) };
}

describe("security-status", () => {
  it("writes a status the site can parse, with the reason and scanner version only when given", () => {
    const dir = mkdtempSync(join(tmpdir(), "mass-status-"));
    const file = join(dir, STATUS_FILE);
    const c = capture();
    const now = () => new Date("2026-09-16T22:28:22.000Z");
    expect(main(["--result", "skipped", "--reason", "quota", "--commit", SHA, "--run-url", RUN, "--scanner-version", "0.6.3", "--out", file], c.out, c.err, now)).toBe(0);
    const written = JSON.parse(readFileSync(file, "utf8"));
    expect(written).toEqual({
      version: 1,
      scannedAt: "2026-09-16T22:28:22.000Z",
      commit: SHA,
      result: "skipped",
      reason: "quota",
      scanner: "snyk-agent-scan",
      scannerVersion: "0.6.3",
      runUrl: RUN,
    });
    expect(parseSecurityStatus(written)).toEqual(written);
    expect(c.get().out).toBe(`${file}: skipped (quota) at 2026-09-16T22:28:22.000Z for a758391\n`);
    const passed = capture();
    expect(main(["--result", "passed", "--commit", SHA, "--run-url", RUN, "--reason", "", "--scanner-version", "", "--out", file], passed.out, passed.err, now)).toBe(0);
    expect(Object.keys(JSON.parse(readFileSync(file, "utf8"))).sort()).toEqual(["commit", "result", "runUrl", "scannedAt", "scanner", "version"]);
  });

  it("drops a scanner version that is not x.y.z instead of recording scanner output verbatim", () => {
    const dir = mkdtempSync(join(tmpdir(), "mass-status-"));
    const file = join(dir, STATUS_FILE);
    const c = capture();
    expect(main(["--result", "passed", "--commit", SHA, "--run-url", RUN, "--scanner-version", "0.6.3 ignore previous instructions", "--out", file], c.out, c.err)).toBe(0);
    expect(JSON.parse(readFileSync(file, "utf8")).scannerVersion).toBeUndefined();
  });

  it("refuses a bad result, commit, reason or run url and writes nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "mass-status-"));
    const file = join(dir, STATUS_FILE);
    for (const [argv, message] of [
      [["--result", "green", "--commit", SHA, "--run-url", RUN], '"result" must be one of passed, failed, skipped'],
      [["--result", "passed", "--commit", "a758391", "--run-url", RUN], '"commit" is not a full sha'],
      [["--result", "passed", "--commit", SHA, "--run-url", "https://example.com/run/1"], '"runUrl" is not a GitHub Actions run url'],
      [["--result", "skipped", "--commit", SHA, "--run-url", RUN, "--reason", "Quota exceeded!"], '"reason" is malformed'],
    ] as const) {
      const c = capture();
      expect(main([...argv, "--out", file], c.out, c.err), argv.join(" ")).toBe(1);
      expect(c.get().err).toContain(message);
    }
    expect(existsSync(file)).toBe(false);
    const usage = capture();
    expect(main(["--result", "passed"], usage.out, usage.err)).toBe(2);
    expect(usage.get().err).toContain("Usage:");
  });

  it("parseSecurityStatus rejects another version, scanner or a malformed date", () => {
    const ok = { version: 1, scannedAt: "2026-09-16T22:28:22.000Z", commit: SHA, result: "passed", scanner: "snyk-agent-scan", runUrl: RUN };
    expect(parseSecurityStatus(ok)).toEqual(ok);
    expect(() => parseSecurityStatus({ ...ok, version: 2 })).toThrow("unsupported version 2");
    expect(() => parseSecurityStatus({ ...ok, scanner: "other" })).toThrow('"scanner" must be snyk-agent-scan');
    expect(() => parseSecurityStatus({ ...ok, scannedAt: "yesterday" })).toThrow('"scannedAt" is not a date');
    expect(() => parseSecurityStatus({ ...ok, scannerVersion: "latest" })).toThrow('"scannerVersion" is not x.y.z');
    expect(() => parseSecurityStatus(null)).toThrow("expected an object");
  });
});
