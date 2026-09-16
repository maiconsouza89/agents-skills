import { absLocalized } from "../lib/i18n";

export function GET() {
  const sitemapUrl = absLocalized("en", "sitemap.xml");
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  return new Response(content, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
