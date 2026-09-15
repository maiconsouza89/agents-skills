import { REGISTRY_FILE, REPO, type Registry } from "@mass-solutions/skills-core";
import { CliError } from "./types.js";

export const DEFAULT_BASE_URL = `https://raw.githubusercontent.com/${REPO}/`;
export const DEFAULT_REF = "main";
export const FETCH_TIMEOUT_MS = 30_000;

/** Base URL (ending in `/`) from `MASS_SKILLS_BASE_URL`, else the raw GitHub URL of the catalog repo. */
export function baseUrl(env: NodeJS.ProcessEnv): string {
  const raw = env.MASS_SKILLS_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_BASE_URL;
  return base.endsWith("/") ? base : `${base}/`;
}

export function registryUrl(env: NodeJS.ProcessEnv, ref: string): string {
  return `${baseUrl(env)}${encodeURIComponent(ref)}/${REGISTRY_FILE}`;
}

export function fileUrl(env: NodeJS.ProcessEnv, ref: string, skillPath: string, filePath: string): string {
  const segments = `${skillPath}/${filePath}`.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl(env)}${encodeURIComponent(ref)}/${segments}`;
}

async function fetchBytes(url: string, fetchImpl: typeof fetch): Promise<Buffer> {
  let res: Response;
  try {
    res = await fetchImpl(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (e) {
    const cause = (e as Error & { cause?: Error }).cause;
    throw new CliError(`Failed to fetch ${url}: ${cause?.message ?? (e as Error).message}`, 1);
  }
  if (!res.ok) throw new CliError(`Failed to fetch ${url}: ${res.status}`, 1);
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchRegistry(env: NodeJS.ProcessEnv, ref: string, fetchImpl: typeof fetch = fetch): Promise<Registry> {
  const url = registryUrl(env, ref);
  const bytes = await fetchBytes(url, fetchImpl);
  try {
    return JSON.parse(bytes.toString("utf8")) as Registry;
  } catch {
    throw new CliError(`Failed to fetch ${url}: invalid JSON`, 1);
  }
}

export async function fetchFile(env: NodeJS.ProcessEnv, ref: string, skillPath: string, filePath: string, fetchImpl: typeof fetch = fetch): Promise<Buffer> {
  return fetchBytes(fileUrl(env, ref, skillPath, filePath), fetchImpl);
}
