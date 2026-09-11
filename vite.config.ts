import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";
import { handleLead } from "./app/lib/lead-handler.ts";
import { handleTrack } from "./app/lib/track-handler.ts";
import { handlePublish } from "./app/lib/publish-handler.ts";
import { devEnv } from "./scripts/dev-vars.ts";

/**
 * Серверные endpoint-ы на dev-сервере: заявка, счётчик, публикация.
 *
 * Без них POST проваливается в catch-all роут «*» и падает с «did not
 * provide an action for route routes/not-found» — форма на localhost:5173
 * просто не работает, и выглядит это как ошибка в коде.
 *
 * Обработчики те же, что уедут на хостинг: `app/lib/lead-handler.ts`
 * и `app/lib/track-handler.ts`. Отдельных заглушек для разработки нет
 * намеренно — заглушка врёт, и расхождение с боем находится уже на живых
 * заявках.
 *
 * Промежуточный слой ставится ДО внутренних слоёв Vite (для этого функция
 * ничего не возвращает): вернув функцию, мы попали бы в очередь после
 * React Router, и тот успел бы забрать запрос себе.
 */
function serverApi(): Plugin {
  const routes: Record<
    string,
    (request: Request, env: Record<string, string | undefined>) => Promise<Response>
  > = {
    "/api/lead": handleLead,
    "/api/track": handleTrack,
    "/api/publish": handlePublish,
  };

  return {
    name: "server-api-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = Object.keys(routes).find((path) => req.url?.startsWith(path));
        if (!route) return next();

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);

        const url = new URL(req.url!, "http://localhost");
        const response = await routes[route](
          new Request(url, {
            method: req.method,
            headers: req.headers as unknown as HeadersInit,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }),
          await devEnv(),
        );

        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  plugins: [serverApi(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Позволяет писать `@use "mixins" as *;` вместо "../../styles/mixins".
        // additionalData сознательно не используем: он подставился бы и в сам
        // _mixins.scss, дав циклический импорт.
        loadPaths: ["app/styles"],
      },
    },
  },
});
