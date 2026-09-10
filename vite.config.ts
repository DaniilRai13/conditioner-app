import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";
import { handleLead } from "./app/lib/lead-handler.ts";
import { readDevVars } from "./scripts/dev-vars.ts";

/**
 * Приём заявки на dev-сервере.
 *
 * Без него POST на /api/lead проваливается в catch-all роут «*» и падает
 * с «did not provide an action for route routes/not-found» — форма на
 * localhost:5173 просто не работает, и выглядит это как ошибка в коде.
 *
 * Обработчик тот же, что уедет на хостинг: `app/lib/lead-handler.ts`.
 * Отдельной заглушки для разработки нет намеренно — заглушка врёт,
 * и расхождение с боем находится уже на живых заявках.
 *
 * Промежуточный слой ставится ДО внутренних слоёв Vite (для этого функция
 * ничего не возвращает): вернув функцию, мы попали бы в очередь после
 * React Router, и тот успел бы забрать запрос себе.
 */
function leadApi(): Plugin {
  return {
    name: "lead-api-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/lead")) return next();

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);

        const url = new URL(req.url, "http://localhost");
        const response = await handleLead(
          new Request(url, {
            method: req.method,
            headers: req.headers as unknown as HeadersInit,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }),
          await readDevVars(),
        );

        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  plugins: [leadApi(), reactRouter()],
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
