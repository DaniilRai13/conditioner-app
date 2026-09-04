import type { Config } from "@react-router/dev/config";
import { services } from "./app/data/services";
import { articles } from "./app/data/articles";
import { categories } from "./app/data/categories";
import { solutions } from "./app/data/solutions";
import { getProductSlugs } from "./app/lib/queries";

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
      ...getStaticPaths(),
      ...services.map((s) => `/services/${s.slug}`),
      ...articles.map((a) => `/articles/${a.slug}`),
      ...categories.map((c) => `/catalog/${c.slug}`),
      ...getProductSlugs().map((slug) => `/product/${slug}`),
      ...solutions.map((s) => `/solutions/${s.slug}`),
    ];
  },
} satisfies Config;
