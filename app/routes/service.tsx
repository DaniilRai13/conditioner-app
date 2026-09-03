import { Link } from "react-router";
import { Check, Plus, Clock, ShieldCheck } from "lucide-react";
import type { Route } from "./+types/service";
import { PageHeader } from "~/components/layout/PageHeader";
import { Section } from "~/components/ui/Section";
import { Card } from "~/components/ui/Card";
import { LeadForm } from "~/components/forms/LeadForm";
import { services, getService } from "~/data/services";
import { site } from "~/config/site";
import styles from "./service.module.scss";

export function loader({ params }: Route.LoaderArgs) {
  const service = getService(params.slug);
  if (!service) throw new Response("Not Found", { status: 404 });
  return { service };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Услуга — ${site.name}` }];
  return [
    { title: `${loaderData.service.h1} — ${site.name}` },
    { name: "description", content: loaderData.service.lead },
  ];
}

export default function ServicePage({ loaderData }: Route.ComponentProps) {
  const { service } = loaderData;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main>
      <PageHeader
        title={service.h1}
        lead={service.lead}
        crumbs={[{ label: "Услуги", to: "/services" }, { label: service.title }]}
      />

      <Section className={styles.top}>
        <div className={styles.columns}>
          <div className={styles.main}>
            <h2 className={styles.blockTitle}>Что входит</h2>
            <ul className={styles.checks}>
              {service.includes.map((item) => (
                <li key={item} className={styles.check}>
                  <Check size={18} className={styles.checkIcon} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            {service.extra && (
              <>
                <h2 className={styles.blockTitle}>Оплачивается отдельно</h2>
                <p className={styles.note}>
                  Называю это до начала работ, а не после — сюрпризов в счёте не будет.
                </p>
                <ul className={styles.checks}>
                  {service.extra.map((item) => (
                    <li key={item} className={styles.check}>
                      <Plus size={18} className={styles.plusIcon} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h2 className={styles.blockTitle}>Как проходит работа</h2>
            <ol className={styles.steps}>
              {service.steps.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <b className={styles.stepName}>{step.title}</b>
                  <span className={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className={styles.aside}>
            <Card className={styles.factCard}>
              <span className={styles.fact}>
                <Clock size={18} aria-hidden />
                <span>
                  <b>Сроки</b>
                  <span className={styles.factText}>{service.terms}</span>
                </span>
              </span>
              <span className={styles.fact}>
                <ShieldCheck size={18} aria-hidden />
                <span>
                  <b>Гарантия</b>
                  <span className={styles.factText}>{service.guarantee}</span>
                </span>
              </span>
              <Link to="/price" className={styles.priceLink}>
                Посмотреть цены на монтаж
              </Link>
            </Card>
          </aside>
        </div>
      </Section>

      <Section title="Вопросы по услуге">
        <div className={styles.faq}>
          {service.faq.map((f) => (
            <details key={f.q} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{f.q}</summary>
              <p className={styles.faqAnswer}>{f.a}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </Section>

      <Section title="Оставьте заявку" lead="Перезвоню и назову точную стоимость по вашей задаче.">
        <LeadForm source="footer" defaultMessage={`Интересует: ${service.title.toLowerCase()}`} />
      </Section>

      <Section title="Другие услуги" className={styles.other}>
        <div className={styles.otherGrid}>
          {services
            .filter((s) => s.slug !== service.slug)
            .map((s) => (
              <Card key={s.slug} to={`/services/${s.slug}`} className={styles.otherCard}>
                <b>{s.title}</b>
                <span className={styles.otherText}>{s.short}</span>
              </Card>
            ))}
        </div>
      </Section>
    </main>
  );
}
