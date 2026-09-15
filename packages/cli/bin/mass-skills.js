#!/usr/bin/env node
// Built entry point: `pnpm build` compiles src/ into dist/. In development use `pnpm --filter @mass-solutions/skills-cli exec tsx src/bin.ts`.
import { run } from "../dist/index.js";

process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  stdout: process.stdout,
  stderr: process.stderr,
});
