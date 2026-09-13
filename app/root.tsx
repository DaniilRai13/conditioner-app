import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AnchorScroll } from "~/components/layout/AnchorScroll/AnchorScroll";
import { site } from "./config/site";

// Шрифт ставится локально, без запроса к Google Fonts — иначе теряем LCP.
// index.css подключает все сабсеты с unicode-range: браузер скачает
// только кириллицу и латиницу, остальные шесть файлов не тронет.
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import "./styles/index.scss";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/*
          Значок вкладки — вектором. Он один на все размеры: и на 16 точек
          в списке вкладок, и на 32 на плотном экране, и в закладках.
          Растровые копии для этого пришлось бы держать в четырёх размерах
          и пересобирать все четыре при каждой правке знака.

          Растр остаётся для домашнего экрана: iOS и Android требуют PNG
          и рисуют его поверх собственного фона — сюда SVG не годится.
        */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Цвет адресной строки на телефоне: фирменный синий вместо
            системного серого. Мелочь, которую замечают только когда её нет. */}
        <meta name="theme-color" content="#0b40d8" />

        <Meta />
        <Links />

        {/*
          Метка «скрипт жив, начальное состояние анимаций можно оставить».

          Появлением блоков занимается framer-motion, и он пишет начальное
          состояние прямо в разметку: `style="opacity:0"`. Пока скрипт
          работает, это нормально — он тут же доигрывает появление. Если
          не работает, человек получает документ, в котором текст есть,
          но невидим. Для сайта, который весь смысл строит на готовой
          разметке, это недопустимо.

          Поэтому CSS отменяет начальное состояние, пока метки нет,
          а ставит её этот скрипт. Отключён, заблокирован расширением,
          не догрузился — страница остаётся со всем текстом.

          Здесь и обычным скриптом, а не в компоненте: он обязан выполниться
          ДО первой отрисовки. React подключается уже после того, как
          разметка показана, и метка из него дала бы моргание — содержимое
          появилось бы и тут же спряталось.

          Таймер — на случай, когда инлайновый скрипт выполнился,
          а основной бандл не догрузился: сам по себе он всегда срабатывает,
          и без этой проверки как раз при упавшей загрузке страница
          осталась бы пустой. Приложение отмечается живым в App().
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'var d=document.documentElement;d.classList.add("reveal-ready");' +
              'setTimeout(function(){if(!window.__appAlive)d.classList.remove("reveal-ready")},4000)',
          }}
        />
      </head>
      <body>
        {children}
        {/* Строго перед ScrollRestoration, см. комментарий в компоненте. */}
        <AnchorScroll />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Корень — только оболочка документа. Шапка и подвал переехали
 * в routes/public.tsx: раньше они приходили всему подряд, и админка
 * открывалась с меню «Каталог, Решения, Услуги» над формой входа.
 */
export default function App() {
  // Отметка для страховочного таймера из <head>: приложение поднялось,
  // начальное состояние анимаций отменять не нужно.
  useEffect(() => {
    window.__appAlive = true;
  }, []);

  return (
    // reducedMotion="user" — движения выключаются, если человек попросил
    // об этом в системе. Так же настроены шторка меню и уведомления:
    // настройка на каждый компонент отдельно рано или поздно где-нибудь
    // забылась бы.
    <MotionConfig reducedMotion="user">
      <Outlet />
    </MotionConfig>
  );
}

declare global {
  interface Window {
    /** Ставится в App(). Читает только скрипт-страховка из <head>. */
    __appAlive?: boolean;
  }
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
