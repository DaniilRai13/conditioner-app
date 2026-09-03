import type { MetaFunction } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { WhyMe } from "~/components/sections/WhyMe/WhyMe";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { services } from "~/data/services";
import { site } from "~/config/site";
import styles from "./services.module.scss";

export const meta: MetaFunction = () => [
  { title: `Услуги — ${site.name}` },
  {
    name: "description",
    content:
      "Продажа, установка, обслуживание и ремонт кондиционеров в Минске и области. Работает один специалист — от подбора до сервиса.",
  },
];

export default function Services() {
  return (
    <main>
      <PageHeader
        title="Услуги"
        lead="Полный спектр работ по продаже, установке и обслуживанию кондиционеров для квартир, домов и офисов."
        crumbs={[{ label: "Услуги" }]}
      />

      <Section className={styles.top}>
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

      <WhyMe />

      <Section title="Оставьте заявку" lead="Перезвоню, уточню детали и назову точную стоимость.">
        <LeadForm source="footer" />
      </Section>
    </main>
  );
}
