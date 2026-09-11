// С расширением .ts: этот модуль запускает и Node напрямую — плагин
// dev-сервера и локальный сервер, — а он без расширения импорт не находит.

/**
 * Публикация: дёргает сборку на хостинге.
 *
 * Сайт — статика, и правка в админке не видна, пока его не пересобрали.
 * Хостинг даёт для этого секретный адрес (build hook): POST по нему
 * запускает сборку и выкладку. Обработчик существует ровно затем, чтобы
 * этот адрес не оказался в браузере: он секретный, а всё, что попало
 * в бандл, публично.
 *
 * Контракт тот же, что у приёма заявки и счётчика: обычный `Request`
 * на входе, обычный `Response` на выходе. Такой обработчик понимают
 * Cloudflare Workers, Netlify Functions, Vercel, Deno и Bun — хостинг
 * ещё не выбран (PLAN.md §10).
 */

export type PublishEnv = {
  /**
   * Секретный адрес сборки от хостинга.
   *
   * Netlify: Site settings → Build & deploy → Build hooks.
   * Vercel: Settings → Git → Deploy Hooks.
   * Cloudflare Pages: Settings → Builds & deployments → Deploy hooks.
   *
   * У всех трёх это «POST по адресу, тело не нужно». GitHub Actions умеет
   * то же самое через repository_dispatch, но там нужны ещё заголовок
   * с токеном и тело с именем события — под него обработчик придётся
   * дополнить, и лучше это сделать, когда хостинг выбран, чем гадать.
   */
  BUILD_HOOK_URL?: string;

  /** Проверка, что кнопку нажал вошедший в админку, а не кто угодно. */
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  /** Для отметки времени публикации — она пишется мимо RLS. */
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

/**
 * Не чаще раза в минуту.
 *
 * Сборка идёт минуты, и вторая, запущенная следом, встаёт в очередь
 * за первой — без всякой пользы, но за те же деньги. Кнопка в админке
 * на время публикации не нажимается, однако полагаться на интерфейс
 * в вопросе, который стоит денег, нельзя: запрос отправляют и мимо него.
 *
 * Хранится в базе, а не в памяти: у serverless-функции памяти между
 * вызовами нет — каждый запрос может попасть в свежий процесс, и счётчик
 * в переменной модуля всегда будет нулевым.
 */
const COOLDOWN_MS = 60_000;

async function lastPublish(env: PublishEnv): Promise<number> {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/settings?key=eq.last_publish&select=value`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return 0;
    const rows = (await res.json()) as { value?: unknown }[];
    const value = rows[0]?.value;
    return typeof value === "string" ? Date.parse(value) || 0 : 0;
  } catch {
    // Недоступная база не должна мешать публикации: без отметки времени
    // мы теряем защиту от частых нажатий, но не саму возможность собрать.
    return 0;
  }
}

async function markPublished(env: PublishEnv, at: string): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/settings`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        // Строка может ещё не существовать: upsert, а не update. Update
        // по несуществующему ключу вернул бы успех и ноль изменений —
        // отметка не появилась бы никогда, и молча.
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        key: "last_publish",
        value: at,
        label: "Когда последний раз запускали сборку",
      }),
    });
  } catch (error) {
    console.error("Не удалось записать время публикации", error);
  }
}

/**
 * Кто нажал кнопку.
 *
 * Без проверки адрес /api/publish становится кнопкой «запусти сборку»
 * для всего интернета: разослать по нему тысячу запросов стоит секунду,
 * а хостингу — минуты сборки и деньги за них.
 *
 * Проверяем не свой секрет, а сессию Supabase: админка и так держит токен
 * вошедшего, и второй механизм входа означал бы второй пароль, который
 * где-то надо хранить.
 */
async function signedIn(request: Request, env: PublishEnv): Promise<boolean> {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) return false;

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function handlePublish(
  request: Request,
  env: PublishEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("Публикация: нет SUPABASE_URL или SUPABASE_ANON_KEY");
    return json({ error: "not_configured" }, 500);
  }

  if (!(await signedIn(request, env))) {
    return json({ error: "unauthorized" }, 401);
  }

  // Отдельный ответ, а не общая ошибка: пока хостинг не выбран, адреса
  // сборки взяться неоткуда, и админка должна сказать об этом прямо,
  // а не показывать «что-то пошло не так».
  if (!env.BUILD_HOOK_URL) {
    return json({ error: "no_hook" }, 503);
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const since = Date.now() - (await lastPublish(env));
    if (since < COOLDOWN_MS) {
      return json(
        { error: "too_soon", waitSeconds: Math.ceil((COOLDOWN_MS - since) / 1000) },
        429
      );
    }
  }

  try {
    const res = await fetch(env.BUILD_HOOK_URL, { method: "POST" });

    if (!res.ok) {
      console.error(`Хостинг отказал: ${res.status}`, await res.text());
      return json({ error: "hook_failed", status: res.status }, 502);
    }
  } catch (error) {
    console.error("Не достучались до хостинга", error);
    return json({ error: "hook_unreachable" }, 502);
  }

  const at = new Date().toISOString();
  if (env.SUPABASE_SERVICE_ROLE_KEY) await markPublished(env, at);

  return json({ ok: true, at }, 200);
}
