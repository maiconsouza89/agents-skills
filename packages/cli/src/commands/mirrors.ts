import { registryMain, validateMain } from "@mass-solutions/skills-core";
import { resolve } from "node:path";
import type { RunContext } from "../types.js";

/** `mass-skills validate [dir]` mirrors `pnpm validate`: same core entry point, same exit codes. */
export function validate(ctx: RunContext, dir: string | undefined): number {
  return validateMain([resolve(ctx.cwd, dir ?? ".")], ctx.stdout, ctx.stderr);
}

/** `mass-skills registry [--check] [--root dir]` mirrors `pnpm registry`. */
export function registry(ctx: RunContext, opts: { check: boolean; root?: string }): number {
  const argv = ["--root", resolve(ctx.cwd, opts.root ?? ".")];
  if (opts.check) argv.push("--check");
  return registryMain(argv, ctx.stdout, ctx.stderr);
}
