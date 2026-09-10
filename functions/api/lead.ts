import { handleLead, type LeadEnv } from "../../app/lib/lead-handler";

/**
 * Обёртка под Cloudflare Pages Functions: файл по этому пути обслуживает
 * /api/lead без отдельной настройки роутинга.
 *
 * Хостинг для сайта ещё не выбран, поэтому обёртка здесь лежит как
 * образец — вся работа делается в `app/lib/lead-handler.ts`, а он на
 * веб-стандартах и от платформы не зависит. Для Netlify, Vercel или
 * Deno понадобится такой же файл на три строки в их каталоге.
 *
 * Локально форма проверяется без всякого хостинга: `npm run serve`
 * поднимает собранный сайт и этот же обработчик на обычном Node.
 */
export const onRequest = ({ request, env }: { request: Request; env: LeadEnv }) =>
  handleLead(request, env);
