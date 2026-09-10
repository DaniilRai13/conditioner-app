import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

/**
 * Плавная прокрутка к якорям — и только к ним.
 *
 * `scroll-behavior: smooth` на html целиком нельзя: ScrollRestoration
 * той же прокруткой возвращает позицию при «назад» и перезагрузке,
 * и страница ехала бы от верха до сохранённого места на глазах. Поэтому
 * плавность включается на один переход: по клику (PUSH/REPLACE) и только
 * когда в адресе есть хеш. На POP и на обычных переходах — как было.
 *
 * Именно layout-эффект и именно раньше ScrollRestoration в дереве: тот
 * зовёт scrollIntoView в своём layout-эффекте, а эффекты соседей идут
 * по порядку — наш успевает выставить поведение до прокрутки.
 *
 * Системное «меньше движения» уважается в _reset.scss через !important,
 * оно перебивает инлайновый стиль.
 */
export function AnchorScroll() {
  const location = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    const smooth = navType !== "POP" && location.hash !== "";
    document.documentElement.style.scrollBehavior = smooth ? "smooth" : "";
  }, [location, navType]);

  return null;
}
