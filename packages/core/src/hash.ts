import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listFiles } from "./files.js";
import type { RegistryFile } from "./types.js";

export const SHIPPED_EXCLUDES: ReadonlyArray<string> = ["evals/"];

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Hash every shipped file of a skill (everything except `evals/**`), byte-sorted by path,
 * and derive the skill's contentHash: sha256 over the concatenation of `"<path>\n<sha256>\n"`.
 */
export function hashFiles(dir: string): { files: RegistryFile[]; contentHash: string } {
  const files = listFiles(dir, SHIPPED_EXCLUDES).map((path) => {
    const data = readFileSync(join(dir, path));
    return { path, sha256: sha256(data), bytes: data.length };
  });
  return { files, contentHash: contentHashOf(files) };
}

export function contentHashOf(files: ReadonlyArray<Pick<RegistryFile, "path" | "sha256">>): string {
  return sha256(files.map((f) => `${f.path}\n${f.sha256}\n`).join(""));
}
