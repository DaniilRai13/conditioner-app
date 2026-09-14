import { readDevVars } from "./dev-vars.ts";

/**
 * Страховка для черновой сборки.
 *
 * `npm run build:preview` собирает копию сайта, закрытую от индексации.
 * Закрывает её одна переменная — `VITE_PREVIEW_URL`: из неё берутся
 * и адрес в canonical, и noindex в мета-тегах, и запрет в robots.txt
 * (см. комментарий в `app/config/site.ts`).
 *
 * Беда в том, что без неё команда не падает, а тихо собирает обычный,
 * открытый поиску сайт — с canonical на `https://example.by`, домен
 * которого нам не принадлежит. На хостинге переменные задаются в веб-
 * интерфейсе, где опечатку в имени видно только по последствиям,
 * а последствия тут — черновик в поисковой выдаче. Вычищается он
 * месяцами, поэтому лучше уронить сборку.
 *
 * На хостинге значение приходит в process.env, локально лежит
 * в `.env.preview` (файл закрыт .gitignore) — проверяем оба места.
 */
const fromFile = await readDevVars(".env.preview");
const url = (process.env.VITE_PREVIEW_URL ?? fromFile.VITE_PREVIEW_URL ?? "").trim();

if (!url) {
  console.error(
    "VITE_PREVIEW_URL не задана — черновая сборка вышла бы открытой для поиска.\n" +
      "  Локально: положите её в .env.preview\n" +
      "  На Netlify: Site configuration → Environment variables\n" +
      "  Значение — адрес выкладки целиком, например https://climatline.netlify.app",
  );
  process.exit(1);
}

// Без схемы `new URL` не соберётся, а canonical получится битым — причём
// страницы при этом соберутся молча, и увидит это поисковик, а не мы.
let parsed: URL;
try {
  parsed = new URL(url);
} catch {
  console.error(`VITE_PREVIEW_URL = «${url}» — это не адрес целиком. Нужна схема: https://…`);
  process.exit(1);
}

if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
  console.error(`VITE_PREVIEW_URL = «${url}» — ожидается https.`);
  process.exit(1);
}

console.log(`Черновая сборка: ${url}, индексация закрыта`);
