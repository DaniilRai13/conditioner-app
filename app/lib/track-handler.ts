// С расширением .ts: этот модуль запускает и Node напрямую — локальный
// сервер scripts/serve.ts и плагин dev-сервера, — а он без расширения
// импорт не находит.

/**
 * Счётчик посещений.
 *
 * Почему свой, а не Метрика. Чужой счётчик — это скрипт весом в сотню
 * килобайт на каждой странице, баннер про куки и данные, которые живут
 * не у нас. Здесь на странице десяток строк, на устройство посетителя
 * не пишется ничего, а цифры лежат в нашей же базе рядом с заявками —
 * и «сколько заходов» можно честно поделить на «сколько заявок».
 *
 * Метрике это не замена: она умеет поисковые запросы, карты кликов
 * и рекламные кампании. Когда дойдёт до продвижения, её ставят
 * дополнительно, а эти цифры остаются как своя независимая проверка.
 *
 * Контракт тот же, что у приёма заявки: на вход обычный `Request`,
 * на выход обычный `Response`. Такой обработчик понимают Cloudflare
 * Workers, Netlify Functions, Vercel, Deno и Bun, а обёртка под любой
 * из них выходит в три строки — хостинг ещё не выбран (PLAN.md §10).
 */

export type TrackEnv = {
  /** Адрес проекта Supabase. */
  SUPABASE_URL?: string;
  /**
   * Сервисный ключ. Обходит RLS — поэтому живёт ТОЛЬКО на сервере
   * и никогда не получает префикс VITE_: с ним он уехал бы в браузер,
   * и любой желающий получил бы полный доступ к базе.
   */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /**
   * Соль для отпечатка посетителя. Любая длинная случайная строка.
   * Без неё отпечаток вычисляется перебором: адресов в стране конечное
   * число, и sha256 от одного адреса подбирается за минуты.
   */
  TRACK_SALT?: string;
};

/** Роботы. Список не исчерпывающий и не должен быть: он отделяет
 * известных краулеров, а не защищает от подделки — подделывать
 * счётчик посещений незачем. */
const BOT = /bot|crawl|spider|slurp|bingpreview|yandex\.com\/bots|headless|lighthouse|curl|wget|python-requests/i;

const MOBILE = /android|iphone|ipod|windows phone|iemobile|blackberry|opera mini/i;
const TABLET = /ipad|tablet|playbook|silk|android(?!.*mobile)/i;

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (TABLET.test(ua)) return "tablet";
  if (MOBILE.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Отпечаток посетителя: sha256 от адреса, браузера, сегодняшней даты и соли.
 *
 * Соль меняется вместе с датой, поэтому один и тот же человек завтра даёт
 * другой отпечаток. Это ограничение, а не недоработка: по такому следу
 * нельзя составить историю посещений конкретного человека, а на вопрос
 * «сколько людей было в среду» он отвечает точно.
 *
 * Отсюда же следует, что сумма посетителей по дням — это число ПОСЕЩЕНИЙ,
 * а не людей: пришедший дважды за неделю посчитан дважды. Складывать их
 * и называть результат людьми нельзя, и в админке он так и подписан.
 */
async function fingerprint(ip: string, ua: string, salt: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Адрес клиента. У каждого хостинга свой заголовок, поэтому перебираем. */
function clientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-real-ip") ??
    // x-forwarded-for — список через запятую, первый элемент клиентский.
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

/** Хост из адреса перехода. Свой же домен переходом не считается. */
function referrerHost(referrer: string, siteHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host === siteHost ? null : host.slice(0, 253);
  } catch {
    return null;
  }
}

/** Путь без строки запроса и якоря, обрезанный по длине колонки. */
function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  const path = raw.split(/[?#]/)[0];
  return path.length <= 200 ? path : path.slice(0, 200);
}

/**
 * Ответ всегда 204 и всегда быстрый.
 *
 * Счётчик не должен быть заметен посетителю ни при каких обстоятельствах:
 * упавшая база, кончившийся ключ, опечатка в пути — всё это проблемы
 * владельца сайта, а не человека, который просто открыл страницу.
 * Поэтому наружу уходит «принято» независимо от того, что случилось
 * внутри, а причина остаётся в журнале сервера.
 */
const noContent = () =>
  new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

export async function handleTrack(
  request: Request,
  env: TrackEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.TRACK_SALT) {
    // Молча: ненастроенный счётчик не повод ломать страницу. В журнале
    // видно, а посетитель не должен знать о нём вообще.
    console.error("Счётчик не настроен: нет SUPABASE_URL, ключа или TRACK_SALT");
    return noContent();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return noContent();
  }

  const body = payload as { path?: unknown; ref?: unknown };
  const path = cleanPath(body.path);
  if (!path) return noContent();

  const ua = request.headers.get("user-agent") ?? "";
  const siteHost = new URL(request.url).hostname.replace(/^www\./, "");

  const row = {
    path,
    visitor_hash: await fingerprint(clientIp(request), ua, env.TRACK_SALT),
    referrer_host: referrerHost(
      typeof body.ref === "string" ? body.ref : "",
      siteHost
    ),
    device: deviceOf(ua),
    is_bot: BOT.test(ua),
  };

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/page_views`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        // Строка в ответе не нужна — экономим на обратной передаче.
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      console.error(`Счётчик: Supabase ответил ${res.status}`, await res.text());
    }
  } catch (error) {
    console.error("Счётчик: запрос к Supabase не прошёл", error);
  }

  return noContent();
}
