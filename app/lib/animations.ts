import type { Variants } from "framer-motion";

/**
 * Варианты анимации. Держим в одном месте, а не рядом с компонентами:
 * иначе одинаковые по смыслу движения на разных экранах со временем
 * расходятся в длительностях и сайт начинает выглядеть собранным из кусков.
 *
 * Взято из alex-build, чтобы шторка вела себя так же.
 */

/** Затемнение под мобильным меню. */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Панель меню: пружина на входе, обычное затухание на выходе. */
export const menuVariants: Variants = {
  hidden: { opacity: 0, y: -40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", duration: 0.5, bounce: 0.35 },
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.97,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

/** Контейнер списка: сам не двигается, только раздаёт задержки детям. */
export const navVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

/** Пункт меню. Выхода нет намеренно — на закрытии всё уносит панель. */
export const navItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
