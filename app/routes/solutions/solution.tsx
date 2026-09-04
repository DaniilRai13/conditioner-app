import { Link } from "react-router";
import { Check, Plus } from "lucide-react";
import type { Route } from "./+types/solution";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { Faq } from "~/components/sections/Faq/Faq";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { solutions, getSolution, areaLabel } from "~/data/solutions";
import { getSolutionProducts } from "~/lib/queries";
import { STANDARD_INSTALL_INCLUDES, EXTRA_CHARGES } from "~/config/pricing";
import { site } from "~/config/site";
import styles from "./solution.module.scss";

export function loader({ params }: Route.LoaderArgs) {
  const solution = getSolution(params.slug);
  if (!solution) throw new Response("Not Found", { status: 404 });

  return {
    solution,
    picks: getSolutionProducts(solution.areaTo, solution.types),
    others: solutions
      .filter((s) => s.slug !== solution.slug)
      .map((s) => ({ slug: s.slug, room: s.room, area: areaLabel(s) })),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Решение — ${site.name}` }];
  const { solution } = loaderData;
  return [
    { title: `${solution.h1} — подбор и установка | ${site.name}` },
    { name: "description", content: solution.intro[0] },
  ];
}

export default function SolutionPage({ loaderData }: Route.ComponentProps) {
  const { solution, picks, others } = loaderData;

  return (
    <main>
      <PageHeader
        title={solution.h1}
        crumbs={[
          { label: "Решения", to: "/solutions" },
          { label: solution.room },
        ]}
      >
        <div className={styles.intro}>
          {solution.intro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </PageHeader>

      <Section className={styles.top} title="Какая нужна мощность">
        <div className={styles.text}>
          {solution.powerHint.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </Section>

      <Section title={solution.specifics.title}>
        <div className={styles.text}>
          {solution.specifics.text.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </Section>

      <Section
        title="Три варианта под эту площадь"
        lead="Подобраны из каталога по площади и цене. Любую модель можно заменить — скажите, что важно, и предложу альтернативу."
      >
        {picks.length > 0 ? (
          <div className={styles.picks}>
            {picks.map((pick) => (
              <div key={pick.product.slug} className={styles.pick}>
                <span className={styles.tier}>{pick.label}</span>
                <ProductCard product={pick.product} media="short" />
              </div>
            ))}
          </div>
        ) : (
          // Пустую выдачу не показываем никогда — это правило из §5.1.
          <Card className={styles.fallback}>
            <b>Подберу индивидуально</b>
            <p>
              Под эту площадь в наличии сейчас ничего подходящего нет, но у
              поставщика больше 4000 моделей. Опишите помещение — привезу под
              заказ.
            </p>
          </Card>
        )}
      </Section>

      <Section title="Что входит в цену" className={styles.priceSection}>
        <div className={styles.columns}>
          <div>
            <h3 className={styles.subTitle}>Стандартный монтаж</h3>
            <ul className={styles.list}>
              {STANDARD_INSTALL_INCLUDES.map((item) => (
                <li key={item}>
                  <Check size={18} className={styles.check} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={styles.subTitle}>Оплачивается отдельно</h3>
            <p className={styles.note}>
              Называю до начала работ, а не после — сюрпризов в счёте не будет.
            </p>
            <ul className={styles.list}>
              {EXTRA_CHARGES.map((item) => (
                <li key={item}>
                  <Plus size={18} className={styles.plus} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Частые вопросы">
        <Faq items={solution.faq} />
      </Section>

      <Section
        title="Рассчитать точную стоимость"
        lead="Замер и консультация бесплатны. Перезвоню и уточню детали."
      >
        <LeadForm
          source="solution"
          defaultMessage={`Помещение: ${solution.room.toLowerCase()}, ${areaLabel(solution)}`}
        />
      </Section>

      <Section title="Другие решения" className={styles.others}>
        <nav className={styles.links} aria-label="Другие решения">
          {others.map((s) => (
            <Link key={s.slug} to={`/solutions/${s.slug}`} className={styles.link}>
              {s.room} · {s.area}
            </Link>
          ))}
        </nav>
      </Section>
    </main>
  );
}
