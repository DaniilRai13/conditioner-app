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
 *
 * Адрес проекта и анонимный ключ нужны обеим сторонам, и держать их
 * в двух файлах значило бы поправить в одном, забыть в другом и полдня
 * искать, почему локально работает не так, как на хостинге. Поэтому
 * имена без префикса берутся из `.env` — но только если их не задали
 * в `.dev.vars` явно.
 *
 * Сервисный ключ так не переносится ниоткуда: у него нет и не может быть
 * версии с префиксом VITE_, иначе он уехал бы в бандл.
 */
export async function devEnv(): Promise<Record<string, string>> {
  const [env, secrets] = await Promise.all([
    readDevVars(".env"),
    readDevVars(".dev.vars"),
  ]);

  return {
    SUPABASE_URL: env.VITE_SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? "",
    SITE_URL: env.VITE_PREVIEW_URL ?? "",
    // Явно заданное в .dev.vars перекрывает вычисленное: это файл
    // для локальных ключей, и последнее слово за ним.
    ...secrets,
  };
}
