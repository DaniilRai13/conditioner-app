import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { advantages } from "~/data/advantages";
import {
  HERO_ALT,
  HERO_AVIF,
  HERO_FALLBACK,
  HERO_HEIGHT,
  HERO_SIZES,
  HERO_WEBP,
  HERO_WIDTH,
} from "./heroImage";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            {/* Ключевая фраза остаётся в H1: это второй по весу сигнал после
                <title>, а сайт живёт с локального поиска. Слоган из макета
                вынесен в надзаголовок — он ничего не теряет от того,
                что стоит обычным абзацем. */}
            <p className={styles.kicker}>Кондиционеры для вашего комфорта</p>
            <h1 className={styles.title}>
              Продажа и установка кондиционеров в Минске и области
            </h1>
            <p className={styles.lead}>
              Подберу, привезу и профессионально установлю кондиционер в ваш дом
              или офис.
            </p>
            <div className={styles.actions}>
              <Button to="/#quiz" size="lg">
                Подобрать кондиционер
              </Button>
              <Button to="/#lead" size="lg" variant="secondary">
                Оставить заявку
              </Button>
            </div>
          </div>

          {/*
            Это LCP-элемент страницы, поэтому:
            fetchPriority="high" и никакого lazy — иначе браузер отложит
            загрузку и метрика просядет; width/height заданы, чтобы вёрстка
            не прыгала при подгрузке. Предзагрузка — в `links` роута.
          */}
          <picture>
            <source type="image/avif" srcSet={HERO_AVIF} sizes={HERO_SIZES} />
            <source type="image/webp" srcSet={HERO_WEBP} sizes={HERO_SIZES} />
            <img
              className={styles.image}
              src={HERO_FALLBACK}
              width={HERO_WIDTH}
              height={HERO_HEIGHT}
              alt={HERO_ALT}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>

        <ul className={styles.list}>
          {advantages.map((item) => (
            <li key={item.title} className={styles.advantage}>
              <IconBox name={item.icon} size="sm" />
              <span className={styles.advantageText}>
                <b className={styles.advantageTitle}>{item.title}</b>
                <span className={styles.advantageNote}>{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
