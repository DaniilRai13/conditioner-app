import type { Config } from "@react-router/dev/config";

export default {
  // Рантайм-сервера нет: сайт целиком уезжает на CDN статикой.
  // Следствие — в роутах нельзя использовать action и headers,
  // заявки уходят в отдельную serverless-функцию (см. PLAN.md §8).
  ssr: false,

  // Лоадеры пререндеренных роутов выполняются на этапе сборки —
  // сюда же попадёт фетч каталога из Supabase (PLAN.md §5.2).
  async prerender({ getStaticPaths }) {
    return [
      ...getStaticPaths(),
      // TODO: динамические пути из Supabase — категории, товары,
      // решения, статьи. Появятся на этапе 3.
    ];
  },
} satisfies Config;
