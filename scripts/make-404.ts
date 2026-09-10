import { copyFileSync, existsSync } from "node:fs";

/**
 * Статические хостинги (Cloudflare Pages, Netlify, GitHub Pages) отдают
 * файл 404.html на любой адрес, которому не нашлось совпадения. React
 * Router кладёт рядом __spa-fallback.html — ту же оболочку приложения,
 * которая на клиенте отрисует наш роут "*", то есть нормальную страницу
 * «не найдено» с меню, подвалом и ссылками на решения.
 *
 * Без этого файла посетитель по битой ссылке увидит служебную заглушку
 * хостинга, где нет ни одной ссылки обратно на сайт.
 */
const from = "build/client/__spa-fallback.html";
const to = "build/client/404.html";

if (existsSync(from)) {
  copyFileSync(from, to);
  console.log("404.html готов");
} else {
  console.warn("нет " + from + " — 404.html не создан");
}
