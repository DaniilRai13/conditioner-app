import { ArrowRight } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { solutions, areaLabel } from "~/data/solutions";
import { PRICE_MODE } from "~/config/pricing";
import styles from "./SolutionsPreview.module.scss";

export function SolutionsPreview() {
  return (
    <Section
      title="Готовые решения по площади"
      lead="Подобрал типовые варианты под самые частые задачи. В каждом — три модели: бюджетная, оптимальная и премиум."
    >
      <div className={styles.grid}>
        {solutions.map((s) => (
          <Card key={s.slug} to={`/solutions/${s.slug}`} className={styles.card}>
            <span className={styles.room}>{s.room}</span>
            <span className={styles.area}>{areaLabel(s)}</span>
            <span className={styles.price}>
              от {s.priceFrom.toLocaleString("ru-RU")} р.
              <span className={styles.priceNote}>
                {PRICE_MODE === "turnkey" ? "под ключ" : "с монтажом"}
              </span>
            </span>
            <span className={styles.more}>
              Подробнее <ArrowRight size={16} aria-hidden />
            </span>
          </Card>
        ))}
      </div>
    </Section>
  );
}
