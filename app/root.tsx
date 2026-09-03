import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { site } from "./config/site";

// Шрифт ставится локально, без запроса к Google Fonts — иначе теряем LCP.
// index.css подключает все сабсеты с unicode-range: браузер скачает
// только кириллицу и латиницу, остальные шесть файлов не тронет.
import "@fontsource-variable/manrope";
import "./styles/index.scss";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Что-то пошло не так";
  let details = "Непредвиденная ошибка. Попробуйте обновить страницу.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Страница не найдена" : "Ошибка";
    details =
      error.status === 404
        ? "Такой страницы нет. Возможно, она переехала."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px" }}>
      <h1>{title}</h1>
      <p>{details}</p>
      <p>
        <a href="/">На главную</a> · <a href={site.phoneHref}>{site.phone}</a>
      </p>
      {stack && (
        <pre style={{ overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
