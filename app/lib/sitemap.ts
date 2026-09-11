// Импорты относительные, а не через `~/`: этот модуль читает
// react-router.config.ts, который загружается вне Vite, и там алиас
// не разрешается. Тот же приём, что в lib/queries.ts.
import { services } from "../data/services";
import { articles } from "../data/articles";
import { categories } from "../data/categories";
import { solutions } from "../data/solutions";
import { getProductSlugs } from "./queries";

/**
 * Пути, у которых нет своего файла в routes.ts, — они порождаются данными.
 *
 * Один список на пререндер и на карту сайта. Разведи их — и рано или
 * поздно страница окажется собранной, но не заявленной поисковику,
 * или наоборот: заявленной, но отдающей 404.
 */
export function dynamicPaths(): string[] {
  return [
    ...services.map((s) => `/services/${s.slug}`),
    ...articles.map((a) => `/articles/${a.slug}`),
    ...categories.map((c) => `/catalog/${c.slug}`),
    ...getProductSlugs().map((slug) => `/product/${slug}`),
    ...solutions.map((s) => `/solutions/${s.slug}`),
  ];
}

/**
 * Страницы с собственным файлом в routes.ts, которые должны попасть
 * в карту сайта. Перечислены явно: список короткий и меняется редко,
 * а читать routes.ts из рантайма нечем.
 *
 * Чего здесь нет намеренно: /privacy — служебная страница,
 * индексировать её незачем.
 */
const STATIC_PATHS = [
  "/",
  "/catalog",
  "/solutions",
  "/services",
  "/price",
  "/articles",
  "/about",
  "/contacts",
];

function publicPaths(): string[] {
  return [...STATIC_PATHS, ...dynamicPaths()];
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Только `loc`. `priority` и `changefreq` Google не учитывает уже много
 * лет, а `lastmod` без честной даты изменения вредит: поисковик перестаёт
 * ему верить и для тех страниц, где он правдив.
 */
export function sitemapXml(base: string): string {
  const root = base.replace(/\/$/, "");
  const urls = publicPaths()
    .map((p) => `  <url><loc>${escapeXml(root + p)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * `noindex` передаётся аргументом, а не читается из окружения: этот модуль
 * загружает и react-router.config.ts, который живёт вне Vite — там
 * `import.meta.env` не существует и обращение к нему уронило бы сборку
 * целиком. Тот же приём, что с относительными импортами выше.
 */
export function robotsTxt(base: string, noindex = false): string {
  const root = base.replace(/\/$/, "");

  if (noindex) {
    return `User-agent: *
Disallow: /
`;
  }

  return `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${root}/sitemap.xml
`;
}
