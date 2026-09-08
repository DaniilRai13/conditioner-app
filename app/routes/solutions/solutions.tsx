import { ArrowRight } from "lucide-react";
import type { Route } from "./+types/solutions";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { SolutionCard } from "~/components/solutions/SolutionCard/SolutionCard";
import { Button } from "~/components/ui/Button/Button";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { solutions, areaLabel } from "~/data/solutions";
import { getSolutionPriceFrom } from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import { site } from "~/config/site";
import styles from "./solutions.module.scss";

export function loader() {
  return {
    items: solutions.map((s) => ({
      slug: s.slug,
      room: s.room,
      short: s.short,
      area: areaLabel(s),
      areaTo: s.areaTo,
      priceFrom: getSolutionPriceFrom(s.areaTo, s.types),
    })),
  };
}

export function meta() {
  return [
    { title: `Готовые решения по площади — ${site.name}` },
    {
      name: "description",
      content:
        "Подобранные комплекты кондиционеров под спальню, гостиную, студию и офис. С расчётом мощности и составом монтажа.",
    },
  ];
}

export default function Solutions({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <PageHeader
        title="Готовые решения по площади"
        lead="Собрал типовые варианты под самые частые задачи. В каждом — расчёт мощности, три модели на выбор и понятный состав работ."
        crumbs={[{ label: "Решения" }]}
      />

      <Section>
        <div className={styles.grid}>
          {loaderData.items.map((s) => (
            <SolutionCard
              key={s.slug}
              layout="split"
              slug={s.slug}
              room={s.room}
              area={s.area}
              areaTo={s.areaTo}
              priceFrom={s.priceFrom}
              short={s.short}
            />
          ))}
        </div>

        <div className={styles.quiz}>
          <b>Не знаете площадь или сомневаетесь в выборе?</b>
          <p>
            Ответьте на четыре вопроса — предложу конкретные модели под ваше
            помещение.
          </p>
          <Button to="/#quiz" variant="secondary">
            Пройти подбор
          </Button>
        </div>
      </Section>

      <Section title="Рассчитать под ваше помещение">
        <LeadForm source="footer" />
      </Section>
    </main>
  );
}
