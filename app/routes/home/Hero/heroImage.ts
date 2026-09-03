import avif480 from "~/assets/hero-unit-480.avif";
import avif720 from "~/assets/hero-unit-720.avif";
import avif1080 from "~/assets/hero-unit-1080.avif";
import avif1440 from "~/assets/hero-unit-1440.avif";
import webp480 from "~/assets/hero-unit-480.webp";
import webp720 from "~/assets/hero-unit-720.webp";
import webp1080 from "~/assets/hero-unit-1080.webp";
import webp1440 from "~/assets/hero-unit-1440.webp";

/**
 * Источники hero-картинки в одном месте: их использует и сам <picture>,
 * и preload в `links` роута. Если развести — рано или поздно предзагрузка
 * будет тянуть один файл, а вёрстка показывать другой.
 *
 * `sizes` обязан совпадать с фактической шириной отрисовки из Hero.module.scss.
 * Ошибка здесь не ломает вёрстку, но заставляет браузер скачивать не тот
 * размер — и незаметно съедает весь выигрыш от srcset.
 */
export const HERO_SIZES =
  "(max-width: 640px) 130vw, (max-width: 1024px) 70vw, 48vw";

export const HERO_AVIF = [
  `${avif480} 480w`,
  `${avif720} 720w`,
  `${avif1080} 1080w`,
  `${avif1440} 1440w`,
].join(", ");

export const HERO_WEBP = [
  `${webp480} 480w`,
  `${webp720} 720w`,
  `${webp1080} 1080w`,
  `${webp1440} 1440w`,
].join(", ");

/** Для браузеров без srcset — середина диапазона, а не самый тяжёлый файл. */
export const HERO_FALLBACK = webp1080;

export const HERO_WIDTH = 1440;
export const HERO_HEIGHT = 810;
export const HERO_ALT = "Настенная сплит-система с потоком холодного воздуха";
