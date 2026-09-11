import { Link } from "react-router";
import { site } from "~/config/site";
import styles from "./Logo.module.scss";

/**
 * Знак и название.
 *
 * Заказчик прислал логотип растром — стопкой: эмблема, под ней «КЛИМАТ
 * ЛАЙН» и подпись «Комфорт в каждой детали». Целиком он сюда не встаёт.
 * В шапке высотой 72 точки такая стопка даёт надпись высотой 18 точек
 * с буквами по девять — не читается ни на одном экране.
 *
 * Поэтому берём из логотипа эмблему, а название набираем живым текстом.
 * Так оно остаётся чётким на любом экране, переносится и масштабируется
 * вместе с остальной типографикой, а поиск видит название текстом,
 * а не картинкой. Логотип целиком стоит там, где для него есть место, —
 * в подвале (`LogoFull`).
 *
 * Форматы через <picture>: avif весит вдвое меньше webp, но понимают его
 * не все браузеры. Размеры проставлены жёстко — без них картинка
 * появляется рывком и сдвигает шапку.
 */

/** Эмблема без надписи. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <picture>
      <source
        srcSet="/logo/mark-96.avif 1x, /logo/mark-192.avif 2x"
        type="image/avif"
      />
      <source
        srcSet="/logo/mark-96.webp 1x, /logo/mark-192.webp 2x"
        type="image/webp"
      />
      <img
        className={className}
        src="/logo/mark-96.webp"
        alt=""
        width={96}
        height={84}
        // Знак в шапке — первое, что видно: ждать его в очереди с картинками
        // ниже сгиба нельзя.
        loading="eager"
        decoding="async"
      />
    </picture>
  );
}

export function Logo() {
  return (
    <Link to="/" className={styles.logo} aria-label={`${site.name} — на главную`}>
      <LogoMark className={styles.mark} />
      <span className={styles.text}>
        <b className={styles.name}>{site.name}</b>
        <span className={styles.tagline}>{site.tagline}</span>
      </span>
    </Link>
  );
}

/**
 * Логотип целиком, с надписью из самого файла. Для мест, где есть
 * вертикальное место и незачем пересобирать знак из частей.
 */
export function LogoFull({ className }: { className?: string }) {
  return (
    <picture>
      <source
        srcSet="/logo/full-240.avif 1x, /logo/full-480.avif 2x"
        type="image/avif"
      />
      <source
        srcSet="/logo/full-240.webp 1x, /logo/full-480.webp 2x"
        type="image/webp"
      />
      <img
        className={className}
        src="/logo/full-240.webp"
        alt={site.name}
        width={240}
        height={176}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
