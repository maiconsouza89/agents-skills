#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildRegistry, diffRegistry, REGISTRY_FILE, serializeRegistry } from "../index.js";

export function main(argv: string[], out = process.stdout, err = process.stderr): number {
  const check = argv.includes("--check");
  const rootIdx = argv.indexOf("--root");
  const root = resolve(rootIdx >= 0 ? argv[rootIdx + 1] : process.cwd());
  const file = join(root, REGISTRY_FILE);
  let generated;
  try {
    generated = buildRegistry(root);
  } catch (e) {
    err.write(`${(e as Error).message}\n`);
    return 1;
  }
  if (!check) {
    writeFileSync(file, serializeRegistry(generated));
    err.write(`wrote ${REGISTRY_FILE} with ${generated.skills.length} skill(s)\n`);
    return 0;
  }
  if (!existsSync(file)) {
    err.write(`${REGISTRY_FILE} is missing; run \`pnpm registry\`\n`);
    return 1;
  }
  const committed = JSON.parse(readFileSync(file, "utf8"));
  const diff = diffRegistry(committed, generated);
  if (diff.length === 0) {
    err.write(`${REGISTRY_FILE} is up to date\n`);
    return 0;
  }
  out.write(`${REGISTRY_FILE} is out of date; run \`pnpm registry\`. Divergent fields:\n`);
  for (const d of diff) out.write(`  ${d}\n`);
  return 1;
}

if (process.argv[1]?.endsWith("bin/registry.ts") || process.argv[1]?.endsWith("bin/registry.js")) {
  process.exit(main(process.argv.slice(2)));
}
