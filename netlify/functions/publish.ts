import { handlePublish } from "../../app/lib/publish-handler.ts";

/**
 * Кнопка «Опубликовать» в админке → пересборка сайта.
 *
 * Проверяет, что нажал вошедший в админку, и дёргает build hook.
 * Адрес хука — `BUILD_HOOK_URL`, он берётся в Netlify:
 * Site configuration → Build & deploy → Build hooks.
 *
 * Хук — это секрет: POST по нему запускает сборку без всякой проверки,
 * поэтому он живёт в переменных окружения, а не в коде.
 */
export default (request: Request) => handlePublish(request, process.env);

export const config = { path: "/api/publish" };
