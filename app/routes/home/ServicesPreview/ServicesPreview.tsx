import { ArrowRight } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { services } from "~/data/services";
import styles from "./ServicesPreview.module.scss";

export function ServicesPreview() {
  return (
    <Section
      title="Услуги"
      lead="Полный спектр работ по продаже, установке и обслуживанию кондиционеров для квартир, домов и офисов."
    >
      <div className={styles.grid}>
        {services.map((s) => (
          <Card key={s.slug} to={`/services/${s.slug}`} className={styles.card}>
            <IconBox name={s.icon} />
            <b className={styles.title}>{s.title}</b>
            <span className={styles.text}>{s.short}</span>
            <span className={styles.more}>
              Подробнее <ArrowRight size={16} aria-hidden />
            </span>
          </Card>
        ))}
      </div>
    </Section>
  );
}
