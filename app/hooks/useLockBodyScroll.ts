import { useEffect } from "react";

/**
 * Блокирует прокрутку страницы, пока `active`.
 *
 * Для всего, что накрывает экран: мобильной шторки, модалок. Без этого
 * страница едет под открытым слоем, и человек теряет место, куда вернётся
 * после закрытия.
 *
 * Прежнее значение запоминается и возвращается на выходе, а не сбрасывается
 * в пустое: если два таких слоя откроются друг за другом, закрытие верхнего
 * не должно разблокировать страницу под нижним.
 */
export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
