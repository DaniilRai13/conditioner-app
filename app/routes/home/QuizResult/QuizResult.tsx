import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { RotateCcw } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import type { CatalogProduct } from "~/lib/queries";
import { solveQuiz } from "~/lib/quiz";
import { useQuiz } from "../useQuiz";
import styles from "./QuizResult.module.scss";

type Props = {
  products: CatalogProduct[];
};

/**
 * Ответ подбора. Сами вопросы стоят в первом экране (Hero), сюда попадает
 * только результат — три карточки товара, которые в панель не помещаются.
 *
 * Блока нет, пока подбор не закончен: пустая секция «здесь будет результат»
 * ничего не добавляет, а место занимает. Разметка появляется вместе
 * с ответами, поэтому в пререндеренном HTML её нет — и не должно быть,
 * это состояние конкретного посетителя.
 *
 * Прокрутка сюда — единственная на весь подбор, и случается ровно в момент,
 * когда собран последний ответ. Приход по готовой ссылке (все четыре ответа
 * уже в адресе) прокрутку не запускает: человек не проходил подбор
 * и не ждёт прыжка — ему показывают страницу с начала.
 */
export function QuizResult({ products }: Props) {
  const { answers, done, restart } = useQuiz();
  const ref = useRef<HTMLElement>(null);
  // null — эффект ещё не отработал ни разу. Первый проход только
  // запоминает состояние, чтобы готовая ссылка не считалась «переходом».
  const wasDone = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasDone.current === null) {
      wasDone.current = done;
      return;
    }
    if (done && !wasDone.current) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      ref.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    }
    wasDone.current = done;
  }, [done]);

  if (!done) return null;

  const result = solveQuiz(answers, products);

  return (
    <section id="quiz" ref={ref} className={styles.section}>
      <Container>
        <div className={styles.box}>
          <div className={styles.head}>
            <div>
              <p className={styles.badge}>Подбор завершён</p>
              <h2 className={styles.title}>Вот что подойдёт</h2>
              <p className={styles.lead}>{result.reason}</p>
            </div>

            <button type="button" className={styles.restart} onClick={restart}>
              <RotateCcw size={14} aria-hidden />
              Пройти заново
            </button>
          </div>

          {result.picks.length > 0 ? (
            <div className={styles.picks}>
              {result.picks.map((pick) => (
                <div key={pick.product.slug} className={styles.pick}>
                  <span className={styles.tier}>{pick.label}</span>
                  <ProductCard product={pick.product} media="short" />
                </div>
              ))}
            </div>
          ) : (
            // Пустую выдачу не показываем никогда: под большие площади
            // с панорамным остеклением в наличии может не быть ничего.
            <div className={styles.fallback}>
              <b>Подберу индивидуально</b>
              <p>
                Под такое помещение нужен блок мощнее, чем есть сейчас
                в наличии. У поставщика больше 4000 моделей — привезу
                под заказ.
              </p>
              <Link to="/#lead" className={styles.fallbackLink}>
                Оставить заявку
              </Link>
            </div>
          )}

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
        </div>
      </Container>
    </section>
  );
}
