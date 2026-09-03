import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { advantages } from "~/data/advantages";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            <p className={styles.kicker}>Комфорт в вашем доме и офисе</p>
            <h1 className={styles.title}>
              Продажа и установка кондиционеров в Минске и области
            </h1>
            <p className={styles.lead}>
              Подберу, поставлю и настрою кондиционер под ваши задачи. Работает
              один специалист — без посредников и лишних наценок.
            </p>
            <div className={styles.actions}>
              <Button to="/#quiz" size="lg">
                Подобрать кондиционер
              </Button>
              <Button to="/contacts" size="lg" variant="secondary">
                Получить консультацию
              </Button>
            </div>
          </div>

          {/* TODO: заглушка под фото сплит-системы из макета.
              Реальное изображение появится вместе с контентом от заказчика. */}
          <div className={styles.media} aria-hidden />
        </div>

        <ul className={styles.advantages}>
          {advantages.map((item) => (
            <li key={item.title} className={styles.advantage}>
              <IconBox name={item.icon} />
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
