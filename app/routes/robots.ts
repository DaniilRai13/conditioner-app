import { robotsTxt } from "~/lib/sitemap";
import { site, IS_PREVIEW } from "~/config/site";

/**
 * Ресурсный роут, как и sitemap: на пререндере станет статическим
 * robots.txt в корне сборки. Живёт роутом, а не файлом в public/,
 * чтобы адрес карты сайта брался из того же site.url, а не был
 * захардкожен второй раз.
 */
export function loader() {
  return new Response(robotsTxt(site.url, IS_PREVIEW), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
