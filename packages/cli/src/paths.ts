import { NAME_RE } from "@mass-solutions/skills-core";

/** A registry `files[].path` is safe when it is relative, has no `..` segment and no absolute or drive prefix. */
export function isSafeRelativePath(p: string): boolean {
  if (typeof p !== "string" || p.length === 0) return false;
  if (p.startsWith("/") || p.startsWith("\\") || /^[A-Za-z]:/.test(p)) return false;
  if (p.includes("\0")) return false;
  const segments = p.split(/[\\/]/);
  return segments.every((s) => s.length > 0 && s !== "." && s !== "..");
}

export function isSafeSkillName(name: string): boolean {
  return typeof name === "string" && NAME_RE.test(name);
}

/** Compare two `x.y.z` strings: negative when a < b, 0 when equal, positive when a > b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
