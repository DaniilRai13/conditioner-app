import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
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
