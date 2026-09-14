import { handleTrack } from "../../app/lib/track-handler.ts";

/**
 * Счётчик посещений. Пишет строку в `page_views` сервисным ключом.
 *
 * Заработает только после того, как накачен `database/analytics.sql`
 * и задана `TRACK_SALT`. Без них обработчик молча отвечает 204: страница
 * посетителя не должна ломаться из-за ненастроенной аналитики.
 *
 * Адрес посетителя Netlify кладёт в `x-nf-client-connection-ip` — этот
 * заголовок обработчик уже читает, менять ничего не нужно.
 */
export default (request: Request) => handleTrack(request, process.env);

export const config = { path: "/api/track" };
