import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import styles from "./QuizTeaser.module.scss";

const QUESTIONS = [
  "Какая площадь помещения?",
  "Что охлаждаем?",
  "Нужно ли греться зимой?",
  "Ориентир по бюджету?",
];

/**
 * Место под квиз — секция 2 главной (PLAN.md §5.1).
 * Сам квиз собирается на этапе 3.1: он зависит от каталога в Supabase,
 * без товаров показывать в результате нечего. Пока — анонс с вопросами,
 * чтобы блок занимал своё место в вёрстке и ритме страницы.
 */
export function QuizTeaser() {
  return (
    <section id="quiz" className={styles.section}>
      <Container>
        <div className={styles.box}>
          <div className={styles.content}>
            <p className={styles.badge}>Подбор за 4 вопроса</p>
            <h2 className={styles.title}>
              Не знаете, какой кондиционер нужен?
            </h2>
            <p className={styles.lead}>
              Ответьте на четыре вопроса — предложу три модели под ваше
              помещение и бюджет. Без звонка и без ввода телефона.
            </p>
            <Button to="/solutions" size="lg" variant="secondary">
              Пока посмотреть готовые решения
            </Button>
          </div>

          <ol className={styles.questions}>
            {QUESTIONS.map((q, i) => (
              <li key={q} className={styles.question}>
                <span className={styles.number}>{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
