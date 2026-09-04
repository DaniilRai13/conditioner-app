import { ArrowRight } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { solutions, areaLabel } from "~/data/solutions";
import { getSolutionPriceFrom } from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import styles from "./SolutionsPreview.module.scss";

export function SolutionsPreview() {
  return (
    <Section
      title="Готовые решения по площади"
      lead="Подобрал оптимальные комплекты под разные площади. В каждом — расчёт мощности и три модели на выбор."
    >
      <div className={styles.grid}>
        {solutions.map((s) => {
          // Цена считается по каталогу, а не задаётся руками: иначе после
          // импорта она молча разъезжается с тем, что показано в карточке.
          const priceFrom = getSolutionPriceFrom(s.areaTo, s.types);

          return (
            <Card key={s.slug} to={`/solutions/${s.slug}`} className={styles.card}>
              <span className={styles.room}>{s.room}</span>
              <span className={styles.area}>{areaLabel(s)}</span>
              {priceFrom && (
                <span className={styles.price}>
                  от {formatPrice(priceFrom)}
                  <span className={styles.priceNote}>за оборудование</span>
                </span>
              )}
              <span className={styles.short}>{s.short}</span>
              <span className={styles.more}>
                Подробнее <ArrowRight size={16} aria-hidden />
              </span>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
