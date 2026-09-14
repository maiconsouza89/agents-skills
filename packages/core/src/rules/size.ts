import { relative } from "node:path";
import { estimateTokens, MAX_LINES, TOKEN_FAIL, TOKEN_WARN } from "../constants.js";
import type { Finding, Rule } from "../types.js";

export const sizeRule: Rule = (ctx) => {
  const path = relative(ctx.root, `${ctx.skill.dir}/SKILL.md`).split("\\").join("/");
  const out: Finding[] = [];
  const tokens = estimateTokens(ctx.skill.raw);
  if (tokens > TOKEN_FAIL) {
    out.push({ rule: "size/tokens", path, line: 1, message: `SKILL.md estimates ${tokens} tokens, max ${TOKEN_FAIL}`, severity: "error" });
  } else if (tokens > TOKEN_WARN) {
    out.push({ rule: "size/tokens-warn", path, line: 1, message: `SKILL.md estimates ${tokens} tokens, above ${TOKEN_WARN}; move material to references/`, severity: "warn" });
  }
  const lines = ctx.skill.raw.split("\n").length;
  if (lines > MAX_LINES) {
    out.push({ rule: "size/tokens", path, line: MAX_LINES + 1, message: `SKILL.md has ${lines} lines, max ${MAX_LINES}`, severity: "error" });
  }
  return out;
};
