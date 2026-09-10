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
