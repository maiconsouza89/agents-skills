#!/usr/bin/env node
// Scaffold `skills/<name>/SKILL.md` and `README.md` for a new Mass Solutions skill.
// Usage: pnpm new-skill mass-<slug> [--root <repo root>]
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { formatFinding, NAME_RE, readCategories, todayIso, validateSkill } from "@mass-solutions/skills-core";

type Writer = { write(s: string): unknown };

export function main(argv: string[], out: Writer = process.stdout, err: Writer = process.stderr): number {
  const rootIdx = argv.indexOf("--root");
  const root = resolve(rootIdx >= 0 ? argv[rootIdx + 1] : process.cwd());
  const name = argv.filter((a, i) => !a.startsWith("-") && i !== rootIdx + 1)[0];
  if (!name || !NAME_RE.test(name)) {
    err.write(`Invalid skill name "${name ?? ""}": it must match ${NAME_RE} (kebab-case, prefixed with mass-)\n`);
    return 2;
  }
  const dir = join(root, "skills", name);
  if (existsSync(dir)) {
    err.write(`skills/${name}/ already exists\n`);
    return 2;
  }
  const categories = readCategories(root);
  const category = categories[0]?.id ?? "workflow";
  const today = todayIso();
  const title = name.replace(/^mass-/, "").replace(/-/g, " ");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    `---
name: ${name}
description: Describe what it does in one sentence. Use when "phrase one", "phrase two" or "phrase three". Do NOT use for something else (use mass-other).
license: CC-BY-4.0
metadata:
  author: mass-solutions
  version: "0.1.0"
  category: ${category}
  tags: "tag-one, tag-two"
  reviewed: "${today}"
---

# ${title[0].toUpperCase()}${title.slice(1)}

## Steps

1. First step.
2. Second step.

## Output

What the agent prints or produces when done.
`,
  );
  writeFileSync(join(dir, "README.md"), `# ${name}\nSee SKILL.md. Install with \`mass-skills install ${name} -a <agent>\`.\nLicensed CC-BY-4.0 by Mass Solutions.\n`);
  const findings = validateSkill(dir, { categories, today, root });
  for (const f of findings) err.write(`${formatFinding(f)}\n`);
  if (findings.some((f) => f.severity === "error")) return 1;
  out.write(`created skills/${name}/SKILL.md and README.md (category ${category}); edit the description and steps, then run pnpm check\n`);
  return 0;
}

if (process.argv[1]?.endsWith("new-skill.ts") || process.argv[1]?.endsWith("new-skill.js")) {
  process.exit(main(process.argv.slice(2)));
}
