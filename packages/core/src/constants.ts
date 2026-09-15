export const REPO = "maiconsouza89/agents-skills";
export const REGISTRY_FILE = "skills-registry.json";
export const CATALOG_DIR = "skills";
export const CATEGORIES_FILE = "_categories.json";
export const DEPRECATED_FILE = "_deprecated.json";

export const ALLOWED_KEYS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"] as const;
export const REQUIRED_METADATA = ["author", "version", "category", "tags", "reviewed"] as const;
export const REQUIRED_LICENSE = "CC-BY-4.0";

export const NAME_RE = /^mass-[a-z0-9]+(-[a-z0-9]+)*$/;
export const NAME_MAX = 64;
export const DESCRIPTION_MAX = 1024;
export const DESCRIPTION_RE = /^.+\. Use when .+\. Do NOT use for .+\.$/s;
export const COMPATIBILITY_MAX = 500;
export const SEMVER_RE = /^\d+\.\d+\.\d+$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const TOKEN_WARN = 3000;
export const TOKEN_FAIL = 6000;
export const MAX_LINES = 500;
export const BINARY_PROBE_BYTES = 8192;

export const SECRET_PATTERNS: ReadonlyArray<{ id: string; re: RegExp }> = [
  { id: "aws-access-key", re: /AKIA[0-9A-Z]{16}/ },
  { id: "github-token", re: /gh[pousr]_[A-Za-z0-9]{36}/ },
  { id: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: "generic-secret", re: /(api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i },
];

export const SHELL_PATTERNS: ReadonlyArray<{ id: string; re: RegExp }> = [
  { id: "curl-pipe-shell", re: /\bcurl\b[^|\n]*\|\s*(?:sudo\s+)?(?:sh|bash)\b/ },
  { id: "wget-pipe-shell", re: /\bwget\b[^|\n]*\|\s*(?:sudo\s+)?(?:sh|bash)\b/ },
  { id: "base64-pipe-shell", re: /\bbase64\s+(?:-d|--decode)\b[^|\n]*\|\s*(?:sudo\s+)?(?:sh|bash)\b/ },
  { id: "eval-subshell", re: /\beval\s+\$\(/ },
  { id: "env-exfiltration", re: /\b(?:env|printenv)\b[^|\n]*\|[^\n]*\b(?:curl|wget|nc)\b/ },
];

export const INJECTION_PHRASES: ReadonlyArray<string> = [
  "ignore previous instructions",
  "ignore all previous",
  "disregard your instructions",
  "you are now",
  "do not tell the user",
];

/** Estimated tokens for a text: ceil(chars / 4). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
