import { useEffect, useState } from "react";
import { heroSlides, SLIDE_INTERVAL } from "./heroSlides";
import styles from "./HeroGallery.module.scss";

/**
 * Фоновая галерея hero.
 *
 * Три вещи, без которых такой блок делать нельзя:
 *
 * 1. **LCP.** Первый слайд грузится сразу, остальные — только после того,
 *    как браузер освободится. Иначе три фоновые фотографии соревнуются
 *    за канал с главной картинкой и метрика проседает.
 *
 * 2. **Доступность.** WCAG 2.2.2 требует механизм остановки для контента,
 *    который меняется сам дольше 5 секунд. Пауза по наведению и по фокусу.
 *
 * 3. **prefers-reduced-motion.** У части людей анимация вызывает тошноту —
 *    для них смена не запускается вовсе, остаётся первый кадр.
 */
export function HeroGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [deferredReady, setDeferredReady] = useState(false);

  const many = heroSlides.length > 1;

  // Остальные слайды подключаем, когда основная загрузка уже позади.
  useEffect(() => {
    if (!many) return;
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
    const id = idle(() => setDeferredReady(true));
    return () => window.cancelIdleCallback?.(id as number);
  }, [many]);

  useEffect(() => {
    if (!many || paused || !deferredReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setIndex((i) => (i + 1) % heroSlides.length),
      SLIDE_INTERVAL
    );
    return () => clearInterval(timer);
  }, [many, paused, deferredReady]);

  if (heroSlides.length === 0) return null;

  return (
    <div
      className={styles.gallery}
      aria-hidden
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {heroSlides.map((slide, i) => {
        // Кроме первого, слайды появляются в разметке только после простоя.
        if (i > 0 && !deferredReady) return null;

        return (
          <picture key={slide.avif}>
            <source type="image/avif" srcSet={slide.avif} />
            <source type="image/webp" srcSet={slide.webp} />
            <img
              className={i === index ? `${styles.slide} ${styles.active}` : styles.slide}
              src={slide.webp}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </picture>
        );
      })}

      {/* Скрим: без него тёмный заголовок на фотографии не читается.
          Слева плотнее — там текст, справа почти прозрачный. */}
      <div className={styles.scrim} />
    </div>
  );
}
