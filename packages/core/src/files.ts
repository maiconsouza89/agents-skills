import { readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";

/** Every regular file under `dir`, as posix paths relative to `dir`, sorted by bytes. */
export function listFiles(dir: string, exclude: ReadonlyArray<string> = []): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    const abs = rel ? join(dir, rel) : dir;
    for (const entry of readdirSync(abs)) {
      const relPath = rel ? `${rel}/${entry}` : entry;
      if (exclude.some((prefix) => relPath === prefix.replace(/\/$/, "") || relPath.startsWith(prefix))) continue;
      const st = lstatSync(join(dir, relPath));
      if (st.isDirectory()) walk(relPath);
      else if (st.isFile()) out.push(relPath);
    }
  };
  walk("");
  return out.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
}
