import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { advantages } from "~/data/advantages";
import { useQuiz } from "../useQuiz";
import { QuizPanel } from "./QuizPanel";
import { hero } from "~/config/site";
import styles from "./Hero.module.scss";

/**
 * Первый экран: текст слева, подбор справа.
 *
 * Подбор идёт здесь целиком, все четыре шага. Раньше в первом экране стоял
 * только первый вопрос, а ответ уводил по якорю к секции квиза — человек
 * оказывался посреди страницы, не понимая, что произошло. Теперь вопросы
 * сменяются на месте, страница не двигается, а прокрутка случается ровно
 * один раз: к готовому ответу, когда собраны все четыре.
 *
 * Ответ живёт ниже отдельной секцией (QuizResult) — три карточки товара
 * в панель не помещаются, а в них весь смысл результата.
 *
 * Над панелью — кондиционер, нарисованный фигурами (AcUnit): поток воздуха
 * упирается в её стекло и обрезается им, поэтому предмет и действие
 * связаны, а не просто соседствуют.
 */
export function Hero() {
  const { answers, step, done, choose, back, restart } = useQuiz();

  return (
    <section className={styles.hero}>
      <Container>
        {/*
          Четыре элемента сетки, а не две колонки: текст, правая часть,
          кнопки и полоса преимуществ раскладываются по-разному на широком
          и узком экране, а разметка остаётся одна. На десктопе кнопки
          и преимущества уходят под текст в левую колонку — они закрывают
          пустоту от разницы высот; в одной колонке кнопки опускаются
          под панель, чтобы кондиционер не разрывал связку с ней.
        */}
        <div className={styles.grid}>
          <div className={styles.content}>
            {/* Ключевая фраза остаётся в H1: это второй по весу сигнал после
                <title>, а сайт живёт с локального поиска. */}
            <p className={styles.kicker}>Подбор за 4 вопроса</p>
            {/* Заголовок и вводка правятся в админке. Значения по умолчанию
                лежат в HERO_DEFAULTS: пустое поле в базе не должно оставлять
                первый экран без H1 — это главный текст страницы для поиска. */}
            <h1 className={styles.title}>{hero.title}</h1>
            <p className={styles.lead}>{hero.subtitle}</p>
          </div>

          <div className={styles.side}>
            <AcUnit className={styles.ac} />
            <QuizPanel
              answers={answers}
              step={step}
              done={done}
              onChoose={choose}
              onBack={back}
              onRestart={restart}
            />
          </div>

          {/* Кнопки «подобрать» здесь больше нет: она вела к подбору,
              который теперь стоит рядом с ней же. */}
          <div className={styles.actions}>
            <Button to="/#lead" size="lg">
              Оставить заявку
            </Button>
            <Button
              to="/catalog"
              size="lg"
              variant="secondary"
              className={styles.glass}
            >
              Смотреть каталог
            </Button>
          </div>

          <ul className={styles.list}>
            {advantages.map((item) => (
              <li key={item.title} className={styles.advantage}>
                <IconBox name={item.icon} size="sm" tone="onBrand" />
                <span className={styles.advantageText}>
                  <b className={styles.advantageTitle}>{item.title}</b>
                  <span className={styles.advantageNote}>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
