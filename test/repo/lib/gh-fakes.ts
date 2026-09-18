// Shared fakes for tools that use dev/tools/lib/gh.ts's Exec and FetchLike.
import type { Exec, FetchLike } from "../../../dev/tools/lib/gh.js";

export const ENOENT = () => Object.assign(new Error("spawnSync gh ENOENT"), { code: "ENOENT" });

// Answers each command by its longest matching prefix and records every call in order.
export function fakeExec(responses: Record<string, string | Error>) {
  const calls: string[] = [];
  const exec: Exec = (cmd, args) => {
    const line = [cmd, ...args].join(" ");
    calls.push(line);
    const key = Object.keys(responses)
      .filter((k) => line.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    const res = key === undefined ? "" : responses[key];
    if (res instanceof Error) throw res;
    return res;
  };
  return { calls, exec };
}

// A fake `fetch` for the REST fallback used when `gh` itself is missing (ENOENT). Handler keys
// are `"METHOD url"`; a `link` header can be set on a response for pagination tests.
export function fakeFetch(handlers: Record<string, { status: number; body?: unknown; link?: string }>) {
  const calls: string[] = [];
  const fn: FetchLike = (async (url: string | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    calls.push(key);
    const h = handlers[key];
    const { status, body, link } = h ?? { status: 404, body: { message: "not found" } };
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === undefined ? "" : JSON.stringify(body)),
      headers: { get: (name: string) => (name.toLowerCase() === "link" ? (link ?? null) : null) },
    } as unknown as Response;
  }) as FetchLike;
  return { calls, fn };
}

// Throws if called; use as the default fetchImpl for tests that never exercise the ENOENT fallback.
export const unusedFetch: FetchLike = (async () => {
  throw new Error("fetch should not be called when gh is available");
}) as FetchLike;
