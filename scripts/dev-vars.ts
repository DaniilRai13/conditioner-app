import { readFile } from "node:fs/promises";

/**
 * Чтение `.dev.vars` — файла с ключами для локальной работы.
 *
 * Формат тот же, что у `.env`: `ИМЯ=значение`, комментарии с `#`. Имя взято
 * не случайно — так этот файл называют хостинги с serverless-функциями,
 * и при переезде он подойдёт как есть.
 *
 * В одном месте, потому что читают его трое: локальный сервер, проверка
 * бота и dev-сервер Vite. Три копии парсера разошлись бы на первой же
 * мелочи вроде пробелов вокруг знака равенства.
 *
 * Файл закрыт `.gitignore`. Ключам в репозитории не место: из истории git
 * они достаются одной командой из любого клона.
 */
export async function readDevVars(
  path = ".dev.vars",
): Promise<Record<string, string>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    // Файла нет — это нормально: значит, ключи не заданы, и вызывающий
    // сам решит, ругаться ему или работать без них.
    return {};
  }

  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

/**
 * Окружение для серверных обработчиков на dev-сервере.
 *
 * Собирается из двух файлов, и это не прихоть, а следствие того, что у них
 * разные роли. В `.env` лежит то, что уезжает в браузер (префикс VITE_ —
 * требование Vite), в `.dev.vars` — то, что браузеру видеть нельзя.
 * Разделение по файлам, а не по префиксу внутри одного: иначе судьбу
 * сервисного ключа решали бы пять символов, которые легко забыть убрать.
 *
 * Имена здесь больше не перекладываются. Раньше `VITE_SUPABASE_URL`
 * копировался в `SUPABASE_URL`, и то же дублирование тянулось в переменные
 * хостинга. Теперь публичные имена разбирает сам обработчик
 * (`app/lib/server-env.ts`), и одного комплекта достаточно везде.
 *
 * Оба файла отдаются как есть, `.dev.vars` последним: это файл локальных
 * ключей, и последнее слово за ним.
 */
export async function devEnv(): Promise<Record<string, string>> {
  const [env, preview, secrets] = await Promise.all([
    readDevVars(".env"),
    readDevVars(".env.preview"),
    readDevVars(".dev.vars"),
  ]);

  return {
    ...env,
    // Адрес сайта для ссылки на товар в сообщении бота. Берётся из
    // .env.preview — там он и лежит; раньше читался из .env и потому
    // всегда был пуст, а ссылки в тестовых сообщениях вели на заглушку.
    SITE_URL: preview.VITE_PREVIEW_URL ?? "",
    ...secrets,
  };
}
