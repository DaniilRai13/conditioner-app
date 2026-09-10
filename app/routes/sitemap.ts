import { sitemapXml } from "~/lib/sitemap";
import { site } from "~/config/site";

/**
 * Ресурсный роут: без компонента, только loader с готовым ответом.
 *
 * При пререндере React Router записывает тело ответа в build/client
 * как обычный файл — на CDN уедет статический sitemap.xml, никакого
 * рантайма ему не нужно. Домен берётся из site.url: пока там заглушка,
 * и карта сайта поменяется вместе с ней при запуске.
 */
export function loader() {
  return new Response(sitemapXml(site.url), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
