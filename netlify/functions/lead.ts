import { handleLead } from "../../app/lib/lead-handler.ts";

/**
 * Заявка с формы → телеграм и база.
 *
 * Обёртка на три строки: вся работа в `app/lib/lead-handler.ts`, а он
 * написан на веб-стандартах (`Request` → `Response`) и о хостинге не знает.
 * Netlify Functions v2 принимает ровно такую функцию, поэтому переезд
 * на другую площадку — это новый файл такого же размера, а не правка
 * обработчика.
 *
 * `config.path` задаёт адрес прямо здесь, без переадресаций в netlify.toml:
 * иначе имя файла и внешний адрес живут в разных местах и однажды разойдутся.
 *
 * Секреты — из `process.env`: на Netlify переменные окружения приходят
 * именно туда. Обработчик берёт их аргументом и сам никуда не лезет.
 */
export default (request: Request) => handleLead(request, process.env);

export const config = { path: "/api/lead" };
