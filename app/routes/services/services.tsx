import type { MetaFunction } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { WhyMe } from "~/components/sections/WhyMe/WhyMe";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import { services } from "~/data/services";
import { seo } from "~/lib/seo";
import styles from "./services.module.scss";

export const meta: MetaFunction = () =>
  seo({
    title: "Услуги",
    description:
      "Продажа, установка, обслуживание и ремонт кондиционеров в Минске и области. Работает один специалист — от подбора до сервиса.",
    path: "/services",
  });

export default function Services() {
  return (
    <main>
      <PageHeader
        title="Услуги"
        lead="Полный спектр работ по продаже, установке и обслуживанию кондиционеров для квартир, домов и офисов."
        crumbs={[{ label: "Услуги" }]}
      />

      <Section>
        <div className={styles.grid}>
          {services.map((s) => (
            <Card
              key={s.slug}
              to={`/services/${s.slug}`}
              className={styles.card}
            >
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

      <LeadBlock
        title="Оставьте заявку"
        lead="Перезвоню, уточню детали и назову точную стоимость."
        source="footer"
        points={[
          "Отвечу, берусь ли за вашу задачу",
          "Назову срок и стоимость до начала работ",
          "Работаю сам, без бригад и субподряда",
          "Даю гарантию на работы",
        ]}
      />
    </main>
  );
}
