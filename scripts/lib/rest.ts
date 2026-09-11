import { readFile } from "node:fs/promises";

/**
 * Обращение к Supabase из скриптов — по HTTP, без клиентской библиотеки.
 *
 * Библиотека @supabase/supabase-js рассчитана на браузер: она держит сессию,
 * подписывается на события, тянет за собой сотни килобайт. Скрипту нужен
 * один GET с двумя заголовками, и голый fetch честнее показывает, что
 * именно уходит на сервер, — а когда проверяешь права, это и есть предмет
 * проверки.
 */

export type Credentials = { url: string; key: string };

/** Ключи из окружения, а если их там нет — из .env. */
export async function credentials(): Promise<Credentials> {
  let url = process.env.VITE_SUPABASE_URL ?? "";
  let key = process.env.VITE_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) {
    try {
      const raw = await readFile(".env", "utf8");
      for (const line of raw.split("\n")) {
        const [name, ...rest] = line.trim().split("=");
        const value = rest.join("=").trim();
        if (name === "VITE_SUPABASE_URL" && !url) url = value;
        if (name === "VITE_SUPABASE_ANON_KEY" && !key) key = value;
      }
    } catch {
      // Файла нет — сообщим ниже вместе с остальными случаями.
    }
  }

  if (!url || !key) {
    console.error(
      "Нет VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY.\n" +
        "Локально они берутся из .env, в сборке — из переменных окружения\n" +
        "(GitHub Secrets). Как их получить — database/README.md."
    );
    process.exit(1);
  }

  return { url: url.replace(/\/$/, ""), key };
}

/** Запрос к PostgREST. Возвращает ответ как есть — статус тоже бывает целью. */
export function rest(
  { url, key }: Credentials,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
}
