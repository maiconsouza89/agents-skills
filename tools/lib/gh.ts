// Shared git/GitHub helpers for the maintainer scripts in tools/. Used by start-issue.ts and
// triage-issue.ts so both work the same way locally and in a Claude Code web session, where
// GraphQL is blocked (see ghApi below) and gh itself is sometimes missing from PATH.
import { execFileSync } from "node:child_process";

export type Exec = (cmd: string, args: string[]) => string;
export type FetchLike = typeof fetch;

export const MCP_HINT = "If this is a Claude Code web session, ask Claude to read/write it through the GitHub MCP tool instead.";

export const defaultExec: Exec = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// Reads the repo's `owner/name` from the origin remote instead of `gh repo view`, which is GraphQL
// and fails behind the Claude Code cloud sandbox's GitHub proxy.
export function ownerAndName(remoteUrl: string): { owner: string; name: string } {
  const m = remoteUrl.trim().match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (!m) throw new Error(`origin remote is not a github.com URL: ${remoteUrl.trim()}`);
  return { owner: m[1], name: m[2] };
}

// Calls the GitHub REST API for one endpoint (never GraphQL - the cloud sandbox's GitHub proxy
// blocks it except for a pinned set of PR operations). Prefers the `gh` CLI (already
// authenticated, and the only path exercised locally); if `gh` itself is missing (ENOENT - seen
// in some Claude Code web sessions even though it's documented as pre-installed there), falls
// back to a direct HTTPS call authenticated with GH_TOKEN/GITHUB_TOKEN, which the session's
// GitHub proxy populates.
export async function ghApi(
  exec: Exec,
  fetchImpl: FetchLike,
  env: NodeJS.ProcessEnv,
  method: "GET" | "POST" | "PATCH" | "PUT",
  path: string,
  ghArgs: string[],
  jsonBody?: unknown,
): Promise<any> {
  try {
    const out = exec("gh", ghArgs);
    return out.trim() ? JSON.parse(out) : undefined;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
    const token = env.GH_TOKEN || env.GITHUB_TOKEN;
    if (!token) throw new Error(`gh CLI not found and no GH_TOKEN/GITHUB_TOKEN in the environment. ${MCP_HINT}`);
    const res = await fetchImpl(`https://api.github.com/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(jsonBody ? { "content-type": "application/json" } : {}),
      },
      body: jsonBody ? JSON.stringify(jsonBody) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`gh CLI not found; the GitHub REST API fallback also failed (${res.status} ${text.slice(0, 200)}). ${MCP_HINT}`);
    return text.trim() ? JSON.parse(text) : undefined;
  }
}

// Follows the `Link: rel="next"` header so callers get every page of a REST list endpoint, the
// same way `gh api --paginate` concatenates pages for the gh-CLI path.
export async function ghApiPaginated(
  exec: Exec,
  fetchImpl: FetchLike,
  env: NodeJS.ProcessEnv,
  path: string,
  ghArgs: string[],
): Promise<any[]> {
  try {
    const out = exec("gh", ghArgs);
    return out.trim() ? JSON.parse(out) : [];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
    const token = env.GH_TOKEN || env.GITHUB_TOKEN;
    if (!token) throw new Error(`gh CLI not found and no GH_TOKEN/GITHUB_TOKEN in the environment. ${MCP_HINT}`);
    const items: any[] = [];
    let url: string | null = `https://api.github.com/${path}${path.includes("?") ? "&" : "?"}per_page=100`;
    while (url) {
      const res: Response = await fetchImpl(url, {
        headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
      });
      const text: string = await res.text();
      if (!res.ok) throw new Error(`gh CLI not found; the GitHub REST API fallback also failed (${res.status} ${text.slice(0, 200)}). ${MCP_HINT}`);
      items.push(...(text.trim() ? JSON.parse(text) : []));
      const link: string = res.headers?.get?.("link") ?? "";
      const next: string | undefined = link
        .split(",")
        .map((p: string) => p.trim())
        .find((p: string) => p.endsWith('rel="next"'));
      url = next ? next.slice(next.indexOf("<") + 1, next.indexOf(">")) : null;
    }
    return items;
  }
}
