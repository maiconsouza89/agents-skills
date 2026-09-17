import type { APIContext } from "astro";
import { buildFeed } from "../../lib/feed";
import { langPaths, type Lang } from "../../lib/i18n";

// `/feed.xml` for en and `/pt-br/feed.xml`, from the same params as the `[...lang]` pages.
export function getStaticPaths() {
  return langPaths();
}

export function GET({ props }: APIContext<{ lang: Lang }>) {
  return new Response(buildFeed(props.lang), { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
}
