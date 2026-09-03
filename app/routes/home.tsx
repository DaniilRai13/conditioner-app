import type { MetaFunction } from "react-router";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import { site } from "~/config/site";
import styles from "./home.module.scss";

export const meta: MetaFunction = () => [
  { title: `${site.name} — установка кондиционеров в Минске и области` },
  {
    name: "description",
    content:
      "Подберу, поставлю и настрою кондиционер под ваши задачи. Работает один специалист — без посредников и лишних наценок.",
  },
];

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <Container>
          <p className={styles.kicker}>Комфорт в вашем доме и офисе</p>
          <h1 className={styles.title}>
            Продажа и установка кондиционеров в Минске и области
          </h1>
          <p className={styles.lead}>
            Подберу, поставлю и настрою кондиционер под ваши задачи. Работает
            один специалист — без посредников и лишних наценок.
          </p>
          <div className={styles.actions}>
            <Button to="/catalog" size="lg">
              Подобрать кондиционер
            </Button>
            <Button to="/contacts" size="lg" variant="secondary">
              Получить консультацию
            </Button>
          </div>
        </Container>
      </section>

      <section className={styles.advantages}>
        <Container>
          <ul className={styles.list}>
            {ADVANTAGES.map((item) => (
              <li key={item.title} className={styles.item}>
                <b className={styles.itemTitle}>{item.title}</b>
                <span className={styles.itemText}>{item.text}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}

const ADVANTAGES = [
  { title: "Один специалист", text: "от подбора до установки" },
  { title: "Честные цены", text: "без скрытых наценок" },
  { title: "Качественный монтаж", text: "с гарантией" },
  { title: "Поддержка и сервис", text: "после установки" },
];
