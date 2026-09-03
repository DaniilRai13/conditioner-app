import type { MetaFunction } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader";
import { Section } from "~/components/ui/Section";
import { Card } from "~/components/ui/Card";
import { articles, formatDate } from "~/data/articles";
import { site } from "~/config/site";
import styles from "./articles.module.scss";

export const meta: MetaFunction = () => [
  { title: `Полезное — ${site.name}` },
  {
    name: "description",
    content:
      "Как выбрать кондиционер по площади, чем инвертор отличается от обычного и когда нужна чистка. Разбираю без маркетинга.",
  },
];

export default function Articles() {
  return (
    <main>
      <PageHeader
        title="Полезное"
        lead="Разбираю вопросы, которые чаще всего задают перед покупкой. Без маркетинга и без попыток продать подороже."
        crumbs={[{ label: "Полезное" }]}
      />

      <Section className={styles.top}>
        <div className={styles.grid}>
          {articles.map((a) => (
            <Card key={a.slug} to={`/articles/${a.slug}`} className={styles.card}>
              <span className={styles.meta}>
                <time dateTime={a.date}>{formatDate(a.date)}</time>
                <span>·</span>
                <span>{a.readMinutes} мин</span>
              </span>
              <b className={styles.title}>{a.title}</b>
              <span className={styles.lead}>{a.lead}</span>
              <span className={styles.more}>
                Читать <ArrowRight size={16} aria-hidden />
              </span>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
