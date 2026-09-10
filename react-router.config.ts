import type { Config } from "@react-router/dev/config";
import { dynamicPaths } from "./app/lib/sitemap";

export default {
  // Рантайм-сервера нет: сайт целиком уезжает на CDN статикой.
  // Следствие — в роутах нельзя использовать action и headers,
  // заявки уходят в отдельную serverless-функцию (см. PLAN.md §8).
  ssr: false,

  // Лоадеры пререндеренных роутов выполняются на этапе сборки —
  // сюда же попадёт фетч каталога из Supabase (PLAN.md §5.2).
  //
  // getStaticPaths() отдаёт только статические роуты. Динамические
  // (:slug) нужно перечислить руками: иначе они уедут в SPA-фолбэк
  // и потеряют пререндер, а вместе с ним и SEO.
  async prerender({ getStaticPaths }) {
    return [
      // Черновики из routes/dev в сборку не идут.
      ...getStaticPaths().filter((path) => !path.startsWith("/dev/")),
      // Динамические пути — из того же модуля, что и карта сайта:
      // так собранное и заявленное поисковику не могут разойтись.
      ...dynamicPaths(),
      "/sitemap.xml",
      "/robots.txt",
    ];
  },
} satisfies Config;
