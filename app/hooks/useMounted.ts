import { useEffect, useState } from "react";

/**
 * Отрисован ли компонент в браузере.
 *
 * Нужен всему, что уходит в портал: `createPortal` бьёт в `document.body`,
 * а во время пререндера документа нет вовсе. Без этой проверки сборка
 * падает на этапе генерации страниц.
 *
 * Возвращает `false` на первом рендере и `true` после — то есть ровно
 * то, чем отличается сервер от браузера.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
