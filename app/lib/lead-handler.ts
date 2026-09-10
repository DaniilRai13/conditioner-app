// С расширением .ts: этот модуль запускает и Node напрямую — локальный
// сервер scripts/serve.ts, — а он без расширения импорт не находит.
// Сборщикам явное расширение не мешает (tsconfig: allowImportingTsExtensions).
import { leadSchema } from "./lead-schema.ts";
import { formatLeadMessage } from "./lead-message.ts";

/**
 * Приём заявки и отправка в телеграм — без единой строчки, привязанной
 * к конкретному хостингу.
 *
 * На вход обычный `Request`, на выход обычный `Response` — веб-стандарт,
 * который понимают Cloudflare Workers, Netlify Functions, Vercel Edge,
 * Deno и Bun. Обёртка под любой из них выходит в три строки, а вся
 * проверка, разметка и обработка ошибок остаются здесь.
 *
 * Так сделано потому, что хостинг ещё не выбран (PLAN.md §10). Написать
 * логику внутрь обработчика конкретной платформы — значит переписывать
 * её заново при переезде, а переписанное второй раз всегда отличается
 * от оригинала в мелочах, которые всплывают на живых заявках.
 *
 * Секреты приходят аргументом, а не читаются из глобального окружения:
 * у каждой платформы оно своё (env в Workers, process.env в Node), и
 * обращение к чужому уронило бы модуль ещё на импорте.
 */

export type LeadEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  /** Адрес сайта для ссылки на товар в сообщении. */
  SITE_URL?: string;
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export async function handleLead(
  request: Request,
  env: LeadEnv,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    // Отдельный ответ, а не общая ошибка: без него ненастроенный хостинг
    // выглядит как «форма просто не работает», и причину ищут в коде.
    console.error("Нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID");
    return json({ error: "not_configured" }, 500);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  // Та же схема, что на клиенте. Клиентскую проверку обходят curl-ом
  // за секунду, и без серверной в телеграм полетит что угодно.
  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        error: "validation",
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }

  const lead = parsed.data;

  // Ловушка для ботов. Схема и так требует пустую строку, но здесь мы
  // отвечаем им успехом: узнав об отказе, боты подбирают обход,
  // а получив 200, уходят довольными.
  if (lead.company) return json({ ok: true }, 200);

  const text = formatLeadMessage(lead, env.SITE_URL ?? "https://example.by");

  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        // Ссылка на товар не должна разворачиваться в карточку:
        // предпросмотр сайта займёт пол-экрана в переписке.
        link_preview_options: { is_disabled: true },
      }),
    },
  );

  if (!res.ok) {
    // Ответ телеграма пишем в лог целиком — там лежит причина
    // («chat not found», «can't parse entities»), без неё чинить нечего.
    console.error("Телеграм отказал:", res.status, await res.text());
    return json({ error: "telegram" }, 502);
  }

  return json({ ok: true }, 200);
}
