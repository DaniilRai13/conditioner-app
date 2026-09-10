import { createServer } from "node:http";
import { readDevVars } from "./dev-vars.ts";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handleLead, type LeadEnv } from "../app/lib/lead-handler.ts";

/**
 * Локальный просмотр собранного сайта вместе с приёмом заявки.
 *
 * Нужен потому, что хостинг ещё не выбран, а форму проверять надо уже
 * сейчас: `npm run dev` отдаёт страницы, но не знает про /api/lead, а
 * инструменты хостингов тянут за собой сам хостинг. Здесь обычный Node
 * и тот же обработчик, что уедет в прод, — путь от формы до телеграма
 * проверяется целиком.
 *
 * Это инструмент разработки, не сервер для боевой работы: без сжатия,
 * кэширования и защиты от нагрузки.
 *
 * Запуск: npm run build && npm run serve
 */

const ROOT = "build/client";
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

/**
 * Путь запроса в файл на диске. Страницы лежат каталогами с index.html —
 * ровно так их отдают статические хостинги, поэтому и здесь так же.
 */
async function resolveFile(pathname: string): Promise<string | null> {
  // normalize + отсечение «..» — иначе запросом /../../.dev.vars отдадим
  // собственные ключи. Сервер локальный, но привычка должна быть общей.
  const clean = normalize(decodeURIComponent(pathname)).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  const candidates = [
    join(ROOT, clean),
    join(ROOT, clean, "index.html"),
    join(ROOT, clean + ".html"),
  ];

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // Файла нет — пробуем следующий вариант.
    }
  }
  return null;
}

const env = await readDevVars();

if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
  console.warn("В .dev.vars нет ключей телеграма — форма ответит ошибкой.");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/api/lead") {
    // Собираем стандартный Request: обработчик тот же, что в проде,
    // и подменять ему интерфейс ради локального запуска нельзя.
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);

    const response = await handleLead(
      new Request(url, {
        method: req.method,
        headers: req.headers as unknown as HeadersInit,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      }),
      env,
    );

    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    console.log(`${req.method} /api/lead → ${response.status}`);
    return;
  }

  const file = (await resolveFile(url.pathname)) ?? join(ROOT, "404.html");
  try {
    const body = await readFile(file);
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    res.writeHead(file.endsWith("404.html") ? 404 : 200, {
      "Content-Type": type,
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Не найдено. Соберите сайт: npm run build");
  }
});

server.listen(PORT, () => {
  console.log(`Сайт: http://localhost:${PORT}`);
  console.log("Заявки уходят в телеграм по ключам из .dev.vars");
});
