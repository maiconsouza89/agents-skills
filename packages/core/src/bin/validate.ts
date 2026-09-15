#!/usr/bin/env node
import { resolve } from "node:path";
import { formatFinding, hasErrors, validateCatalog } from "../index.js";

export type Writer = { write(chunk: string): unknown };

export function main(argv: string[], out: Writer = process.stdout, err: Writer = process.stderr): number {
  const args = argv.filter((a) => !a.startsWith("-"));
  const root = resolve(args[0] ?? process.cwd());
  let result;
  try {
    result = validateCatalog(root);
  } catch (e) {
    err.write(`${(e as Error).message}\n`);
    return 1;
  }
  for (const f of result.findings) out.write(`${formatFinding(f)}\n`);
  const errors = result.findings.filter((f) => f.severity === "error").length;
  const warns = result.findings.length - errors;
  err.write(`validated ${result.skills.length} skill(s): ${errors} error(s), ${warns} warning(s)\n`);
  return hasErrors(result.findings) ? 1 : 0;
}

if (process.argv[1]?.endsWith("bin/validate.ts") || process.argv[1]?.endsWith("bin/validate.js")) {
  process.exit(main(process.argv.slice(2)));
}
