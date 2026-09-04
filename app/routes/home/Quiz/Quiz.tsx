import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import type { CatalogProduct } from "~/lib/queries";
import {
  QUIZ_QUESTIONS,
  isComplete,
  solveQuiz,
  type QuizAnswers,
} from "~/lib/quiz";
import styles from "./Quiz.module.scss";

type Props = {
  products: CatalogProduct[];
};

/**
 * Подбор кондиционера за четыре вопроса — главный конверсионный блок.
 *
 * Три решения, от которых зависит, будут им пользоваться или нет:
 *
 * 1. Ответы живут в URL. Ссылку на результат можно отправить, кнопка «назад»
 *    в браузере работает, а у результата появляется адрес для аналитики.
 * 2. Клик по варианту сразу листает дальше — без кнопки «Далее».
 * 3. Результат показывается сразу, без ввода телефона. Прятать выдачу
 *    за контактами — главная ошибка таких квизов: она убивает доверие
 *    и половину конверсии.
 */
export function Quiz({ products }: Props) {
  const [params, setParams] = useSearchParams();
  const optionsRef = useRef<HTMLDivElement>(null);

  const answers: QuizAnswers = {
    area: params.get("area") ?? undefined,
    place: params.get("place") ?? undefined,
    heat: params.get("heat") ?? undefined,
    windows: params.get("windows") ?? undefined,
  };

  const answered = QUIZ_QUESTIONS.filter((q) => answers[q.key]).length;
  const [step, setStep] = useState(answered);
  const done = isComplete(answers);

  // Заход по ссылке с готовыми ответами должен сразу открывать результат.
  useEffect(() => {
    if (answered > step) setStep(answered);
  }, [answered, step]);

  // Фокус на первый вариант нового шага: иначе с клавиатуры после ответа
  // приходится табать через всю шапку заново.
  useEffect(() => {
    if (done) return;
    optionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [step, done]);

  function choose(key: keyof QuizAnswers, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
    setStep((s) => Math.min(s + 1, QUIZ_QUESTIONS.length));
  }

  function back() {
    const previous = QUIZ_QUESTIONS[step - 1];
    if (!previous) return;
    const next = new URLSearchParams(params);
    next.delete(previous.key);
    setParams(next, { replace: true, preventScrollReset: true });
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    const next = new URLSearchParams(params);
    QUIZ_QUESTIONS.forEach((q) => next.delete(q.key));
    setParams(next, { replace: true, preventScrollReset: true });
    setStep(0);
  }

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

  const question = QUIZ_QUESTIONS[Math.min(step, QUIZ_QUESTIONS.length - 1)];
  const result = done ? solveQuiz(answers, products) : null;

  return (
    <section id="quiz" className={styles.section}>
      <Container>
        <div className={styles.box}>
          <div className={styles.content}>
            <p className={styles.badge}>Подбор за 4 вопроса</p>
            <h2 className={styles.title}>
              {done
                ? "Вот что подойдёт"
                : "Не знаете, какой кондиционер нужен?"}
            </h2>
            <p className={styles.lead}>
              {done
                ? result?.reason
                : "Ответьте на четыре вопроса — предложу конкретные модели под ваше помещение. Без звонка и без ввода телефона."}
            </p>

            {done ? (
              <div className={styles.actions}>
                <Button to="/#lead" size="lg">
                  Заказать консультацию
                </Button>
                <Button
                  to={`/catalog?area=${answers.area}`}
                  size="lg"
                  variant="secondary"
                >
                  Посмотреть весь каталог
                </Button>
              </div>
            ) : (
              <p className={styles.progress} aria-live="polite">
                Шаг {Math.min(step + 1, QUIZ_QUESTIONS.length)} из{" "}
                {QUIZ_QUESTIONS.length}
              </p>
            )}

            {done && (
              <button type="button" className={styles.restart} onClick={restart}>
                <RotateCcw size={14} aria-hidden />
                Пройти заново
              </button>
            )}
          </div>

          <div className={styles.panel}>
            {done ? null : (
              <>
                <div className={styles.bar} aria-hidden>
                  <span
                    className={styles.barFill}
                    style={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <h3 className={styles.question}>{question.title}</h3>

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
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.hint && (
                        <span className={styles.optionHint}>{option.hint}</span>
                      )}
                      <ArrowRight size={16} className={styles.optionArrow} aria-hidden />
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <button type="button" className={styles.back} onClick={back}>
                    <ArrowLeft size={14} aria-hidden />
                    Назад
                  </button>
                )}
              </>
            )}

            {done && result && (
              <div className={styles.result}>
                {result.picks.length > 0 ? (
                  <div className={styles.picks}>
                    {result.picks.map((pick) => (
                      <div key={pick.product.slug} className={styles.pick}>
                        <span className={styles.tier}>{pick.label}</span>
                        <ProductCard product={pick.product} layout="row" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Пустую выдачу не показываем никогда: под большие площади
                  // с панорамным остеклением в наличии может не быть ничего.
                  <div className={styles.fallback}>
                    <b>Подберу индивидуально</b>
                    <p>
                      Под такое помещение нужен блок мощнее, чем есть сейчас в
                      наличии. У поставщика больше 4000 моделей — привезу под
                      заказ.
                    </p>
                    <Link to="/#lead" className={styles.fallbackLink}>
                      Оставить заявку
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
