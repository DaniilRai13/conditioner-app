import { Plus, ArrowRight } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import styles from "./QuizTeaser.module.scss";

const QUESTIONS = [
  "Какая площадь помещения?",
  "Что охлаждаем?",
  "Нужен ли обогрев зимой?",
  "Сколько окон в комнате?",
  "Остались вопросы?",
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
            <p className={styles.badge}>
              <IconBox name="sparkles" size="sm" />
              Поможем с выбором
            </p>
            <h2 className={styles.title}>
              Не знаете, какой кондиционер нужен?
            </h2>
            <p className={styles.lead}>
              Ответьте на несколько вопросов, и мы подберём для вас оптимальное
              решение за 1 минуту
            </p>
            <Button to="/solutions" variant="secondary" className={styles.cta}>
              Подобрать за 1 минуту
              <ArrowRight size={16} aria-hidden />
            </Button>
          </div>

          <ul className={styles.questions}>
            {QUESTIONS.map((q) => (
              <li key={q} className={styles.question}>
                <span className={styles.marker}>
                  <Plus size={14} strokeWidth={2.5} aria-hidden />
                </span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
