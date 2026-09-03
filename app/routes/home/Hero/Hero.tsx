import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { advantages } from "~/data/advantages";
import heroLarge from "~/assets/hero-unit-1440.webp";
import heroSmall from "~/assets/hero-unit-720.webp";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            {/* Ключевая фраза ушла из H1 в надзаголовок по макету.
                Компенсируем её присутствием в <title> и description роута. */}
            <p className={styles.kicker}>
              Продажа и установка кондиционеров в Минске и области
            </p>
            <h1 className={styles.title}>Кондиционеры для вашего комфорта</h1>
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
            не прыгала при подгрузке.
          */}
          <img
            className={styles.image}
            src={heroLarge}
            srcSet={`${heroSmall} 720w, ${heroLarge} 1440w`}
            sizes="(max-width: 1024px) 92vw, 50vw"
            width={1440}
            height={810}
            alt="Настенная сплит-система с потоком холодного воздуха"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </Container>

      <div className={styles.advantages}>
        <Container>
          <ul className={styles.list}>
            {advantages.map((item) => (
              <li key={item.title} className={styles.advantage}>
                <IconBox name={item.icon} shape="circle" />
                <span className={styles.advantageText}>
                  <b className={styles.advantageTitle}>{item.title}</b>
                  <span className={styles.advantageNote}>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
