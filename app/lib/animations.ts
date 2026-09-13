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

/**
 * Всплывающее уведомление: выезжает из-за правого края и слегка
 * подпрыгивает. Пружина только на входе — на выходе она читалась бы
 * как «уведомление не хочет уходить».
 */
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", duration: 0.45, bounce: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

/**
 * Появление секции при прокрутке.
 *
 * Сдвиг маленький. Блок, выезжающий издалека, читается как реклама
 * и заставляет ждать; здесь движение должно быть замечено краем глаза,
 * а не разглядываться.
 *
 * Появление повторяется каждый раз, когда блок входит в экран, а не один
 * раз за жизнь страницы. Поэтому и амплитуда маленькая: движение, которое
 * человек увидит десять раз за чтение, должно быть незаметным по усилию,
 * иначе оно быстро начинает раздражать.
 */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  },
};

/**
 * Шаг в «Как я работаю»: текст выезжает со своей стороны.
 *
 * Направление приходит через `custom`: нечётные шаги стоят слева
 * и выезжают слева, чётные — справа. Одинаковое направление для всех
 * спорило бы с самой раскладкой — текст ехал бы поперёк колонки,
 * в которой стоит.
 */
export const stepTextVariants: Variants = {
  hidden: (fromLeft: boolean) => ({ opacity: 0, x: fromLeft ? -36 : 36 }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] },
  },
};

/** Лестница шагов: сама не двигается, только раздаёт задержки. */
export const stepsVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/**
 * Первый экран. Появляется сразу при загрузке, а не по прокрутке.
 *
 * Задержки короткие и общая длительность мала намеренно: это первое,
 * что видит человек, и «представление» здесь превращается в ожидание.
 */
export const heroVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/**
 * Часть первого экрана: вводка, кнопки, панель подбора.
 *
 * Заголовок сюда НЕ входит — у него свой вариант без прозрачности.
 * Причина в LCP: браузер считает страницу загруженной по появлению
 * самого крупного элемента, а элемент с нулевой прозрачностью он
 * не считает нарисованным. Затухание заголовка из нуля сдвинуло бы
 * измеряемую скорость загрузки ровно на свою длительность.
 */
export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] },
  },
};

/** Заголовок первого экрана: только сдвиг, без прозрачности — см. выше. */
export const heroTitleVariants: Variants = {
  hidden: { y: 10 },
  visible: { y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] } },
};
