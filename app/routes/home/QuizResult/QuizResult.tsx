import { useRef } from "react";
import { Link } from "react-router";
import { RotateCcw } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import type { CatalogProduct } from "~/lib/queries";
import { solveQuiz } from "~/lib/quiz";
import { scrollToElement } from "~/lib/scroll";
import { useScrollIntoViewOnce } from "~/hooks/useScrollIntoViewOnce";
import { QUIZ_PANEL_ID } from "../Hero/QuizPanel";
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
 * Прокрутка сюда случается ровно в момент, когда собран последний ответ;
 * за это отвечает useScrollIntoViewOnce. Обратная — только по нажатию
 * «пройти заново». Сами вопросы страницу не двигают: сменяются на месте.
 */
export function QuizResult({ products }: Props) {
  const { answers, done, restart } = useQuiz();
  const ref = useRef<HTMLElement>(null);
  useScrollIntoViewOnce(done, ref);

  /**
   * «Пройти заново» уводит ответы и возвращает к вопросам.
   *
   * Одного сброса мало: вопросы стоят в первом экране, а эта кнопка — внизу
   * страницы, и после сброса человек оставался там же, глядя на пустое место
   * от исчезнувшего результата. Найти, куда делся подбор, он мог только сам.
   *
   * Прокрутка до сброса, а не после: пока состояние не обновилось, панель
   * ещё на месте и её видно в разметке. Позиция от сброса не меняется —
   * исчезает то, что ниже панели, а не выше.
   */
  function restartAndReturn() {
    scrollToElement(document.getElementById(QUIZ_PANEL_ID));
    restart();
  }

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

            <button
              type="button"
              className={styles.restart}
              onClick={restartAndReturn}
            >
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
                Под такое помещение нужен блок мощнее, чем есть сейчас в
                наличии. У поставщика больше 4000 моделей — привезу под заказ.
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
