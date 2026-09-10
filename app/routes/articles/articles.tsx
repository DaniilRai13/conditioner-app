import type { MetaFunction } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { articles, formatDate } from "~/data/articles";
import { seo } from "~/lib/seo";
import styles from "./articles.module.scss";

export const meta: MetaFunction = () =>
  seo({
    title: "Полезное",
    description:
      "Как выбрать кондиционер по площади, чем инвертор отличается от обычного и когда нужна чистка. Разбираю без маркетинга.",
    path: "/articles",
  });

export default function Articles() {
  return (
    <main>
      <PageHeader
        title="Полезное"
        lead="Разбираю вопросы, которые чаще всего задают перед покупкой. Без маркетинга и без попыток продать подороже."
        crumbs={[{ label: "Полезное" }]}
      />

      <Section>
        <div className={styles.grid}>
          {articles.map((a) => (
            <Card
              key={a.slug}
              to={`/articles/${a.slug}`}
              className={styles.card}
            >
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
