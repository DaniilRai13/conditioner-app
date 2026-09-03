import { Link } from "react-router";
import type { Route } from "./+types/article";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { articles, getArticle, formatDate } from "~/data/articles";
import { site } from "~/config/site";
import styles from "./article.module.scss";

export function loader({ params }: Route.LoaderArgs) {
  const article = getArticle(params.slug);
  if (!article) throw new Response("Not Found", { status: 404 });
  return { article };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Статья — ${site.name}` }];
  return [
    { title: `${loaderData.article.h1} — ${site.name}` },
    { name: "description", content: loaderData.article.lead },
  ];
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData;
  const others = articles.filter((a) => a.slug !== article.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.h1,
    description: article.lead,
    datePublished: article.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
  };

  return (
    <main>
      <PageHeader
        title={article.h1}
        crumbs={[{ label: "Полезное", to: "/articles" }, { label: article.title }]}
      >
        <p className={styles.meta}>
          <time dateTime={article.date}>{formatDate(article.date)}</time> ·{" "}
          {article.readMinutes} мин чтения
        </p>
      </PageHeader>

      <Section className={styles.top}>
        <article className={styles.body}>
          <p className={styles.lead}>{article.lead}</p>

          {article.blocks.map((block, i) => (
            <section key={block.heading ?? i}>
              {block.heading && <h2>{block.heading}</h2>}
              {block.paragraphs?.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
              {block.list && (
                <ul>
                  {block.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <div className={styles.cta}>
          <b className={styles.ctaTitle}>Нужна помощь с выбором?</b>
          <p className={styles.ctaText}>
            Назовите площадь и этаж — подберу модель с нужным запасом и скажу
            стоимость под ключ.
          </p>
          <Button to="/#quiz">Подобрать кондиционер</Button>
        </div>
      </Section>

      {others.length > 0 && (
        <Section title="Ещё по теме" className={styles.others}>
          <ul className={styles.otherList}>
            {others.map((a) => (
              <li key={a.slug}>
                <Link to={`/articles/${a.slug}`} className={styles.otherLink}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Остались вопросы?">
        <LeadForm source="footer" />
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
