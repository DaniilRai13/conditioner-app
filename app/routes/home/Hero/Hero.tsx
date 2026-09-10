import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { advantages } from "~/data/advantages";
import { QUIZ_QUESTIONS } from "~/lib/quiz";
import { useQuiz } from "../useQuiz";
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
  const question = QUIZ_QUESTIONS[Math.min(step, QUIZ_QUESTIONS.length - 1)];

  const optionsRef = useRef<HTMLDivElement>(null);
  // Первый рендер фокус не забирает: иначе страница, открытая с нуля,
  // сама уводила бы экран к панели, мимо заголовка.
  const started = useRef(false);

  useEffect(() => {
    if (done) return;
    if (!started.current) {
      started.current = true;
      return;
    }
    // Фокус на первый вариант нового шага: без этого с клавиатуры после
    // ответа приходится табать через всю панель заново.
    optionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [step, done]);

  /** Стрелки внутри группы вариантов — как в нативном radiogroup. */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(e.key)) return;

    const items = Array.from(
      optionsRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    e.preventDefault();
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    const nextIndex = (index + (forward ? 1 : -1) + items.length) % items.length;
    items[nextIndex]?.focus();
  }

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
            <h1 className={styles.title}>
              Продажа и установка кондиционеров в Минске и области
            </h1>
            <p className={styles.lead}>
              Не знаете, какой нужен? Ответьте на четыре вопроса — покажу три
              модели под ваше помещение. Без звонка и без телефона.
            </p>
          </div>

          <div className={styles.side}>
            <AcUnit className={styles.ac} />

            <div
              className={styles.panel}
              role="group"
              aria-labelledby="hero-question"
            >
              {done ? (
                <>
                  <span className={styles.panelLabel}>Готово</span>
                  <b id="hero-question" className={styles.question}>
                    Подобрал три модели
                  </b>
                  <p className={styles.panelText}>
                    Под помещение до {answers.area} м². Смотрите ниже — они
                    с ценами и характеристиками.
                  </p>
                  <div className={styles.resultActions}>
                    <Button to="/#quiz" size="lg" className={styles.wide}>
                      Показать модели
                    </Button>
                    <button
                      type="button"
                      className={styles.restart}
                      onClick={restart}
                    >
                      <RotateCcw size={14} aria-hidden />
                      Пройти заново
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.bar} aria-hidden>
                    <span
                      className={styles.barFill}
                      style={{
                        width: `${(step / QUIZ_QUESTIONS.length) * 100}%`,
                      }}
                    />
                  </div>

                  <span className={styles.panelLabel} aria-live="polite">
                    Шаг {step + 1} из {QUIZ_QUESTIONS.length}
                  </span>
                  <b id="hero-question" className={styles.question}>
                    {question.title}
                  </b>

                  <div
                    ref={optionsRef}
                    className={styles.options}
                    role="radiogroup"
                    aria-label={question.title}
                    onKeyDown={onKeyDown}
                  >
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={answers[question.key] === option.value}
                        className={styles.option}
                        onClick={() => choose(question.key, option.value)}
                      >
                        <span className={styles.optionLabel}>
                          {option.label}
                        </span>
                        {option.hint && (
                          <span className={styles.optionHint}>
                            {option.hint}
                          </span>
                        )}
                        <ArrowRight
                          size={16}
                          className={styles.optionArrow}
                          aria-hidden
                        />
                      </button>
                    ))}
                  </div>

                  {step > 0 ? (
                    <button type="button" className={styles.back} onClick={back}>
                      <ArrowLeft size={14} aria-hidden />
                      Назад
                    </button>
                  ) : (
                    <p className={styles.panelNote}>
                      В конце — три модели с ценами. Телефон не спрашиваю.
                    </p>
                  )}
                </>
              )}
            </div>
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
