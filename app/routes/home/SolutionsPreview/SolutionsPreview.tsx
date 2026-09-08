import { Section } from "~/components/ui/Section/Section";
import { SolutionCard } from "~/components/solutions/SolutionCard/SolutionCard";
import { solutions, areaLabel } from "~/data/solutions";
import { getSolutionPriceFrom } from "~/lib/queries";
import styles from "./SolutionsPreview.module.scss";

/**
 * Какое решение выделяем цветом.
 *
 * Пока индексом: в данных нет признака «рекомендуем», и придумывать его
 * до разговора с заказчиком не стоит — это его знание о том, что чаще
 * всего заказывают, а не наша догадка. Когда ответит, признак переедет
 * в `Solution` полем, а отсюда уйдёт.
 */
const FEATURED = 1;

export function SolutionsPreview() {
  return (
    <Section
      title="Готовые решения по площади"
      lead="Подобрал оптимальные комплекты под разные площади. В каждом — расчёт мощности и три модели на выбор."
    >
      <div className={styles.grid}>
        {solutions.map((s, i) => (
          <SolutionCard
            key={s.slug}
            slug={s.slug}
            room={s.room}
            area={areaLabel(s)}
            areaTo={s.areaTo}
            // Цена считается по каталогу, а не задаётся руками: иначе после
            // импорта она молча разъезжается с тем, что показано в карточке.
            priceFrom={getSolutionPriceFrom(s.areaTo, s.types)}
            short={s.short}
            featured={i === FEATURED}
          />
        ))}
      </div>
    </Section>
  );
}
