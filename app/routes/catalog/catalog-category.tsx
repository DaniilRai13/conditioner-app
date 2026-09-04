import { Link } from "react-router";
import type { Route } from "./+types/catalog-category";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { SupplierNote } from "~/components/catalog/SupplierNote/SupplierNote";
import { CatalogView } from "~/components/catalog/CatalogView/CatalogView";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { getCatalogProducts, getCategoriesWithCount } from "~/lib/queries";
import { getCategory } from "~/data/categories";
import { site } from "~/config/site";
import styles from "./catalog-category.module.scss";

export function loader({ params }: Route.LoaderArgs) {
  const category = getCategory(params.category);
  if (!category) throw new Response("Not Found", { status: 404 });

  return {
    category,
    products: getCatalogProducts(category.slug),
    others: getCategoriesWithCount()
      .filter((c) => c.slug !== category.slug)
      .map(({ slug, title }) => ({ slug, title })),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Каталог — ${site.name}` }];
  const { category } = loaderData;
  return [
    { title: `${category.h1} в Минске — ${site.name}` },
    { name: "description", content: category.lead },
  ];
}

export default function CatalogCategory({ loaderData }: Route.ComponentProps) {
  const { category, products, others } = loaderData;

  return (
    <main>
      <PageHeader
        title={`${category.h1} в Минске`}
        lead={category.lead}
        crumbs={[
          { label: "Каталог", to: "/catalog" },
          { label: category.title },
        ]}
      />

      <Section className={styles.top}>
        {/* Свой текст, а не отфильтрованный дубль каталога: без него
            поисковику нечем отличить эту страницу от соседней. */}
        <div className={styles.intro}>
          {category.intro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <CatalogView products={products} />

        <SupplierNote />
      </Section>

      <Section title="Другие категории" className={styles.others}>
        <nav className={styles.links} aria-label="Другие категории">
          {others.map((c) => (
            <Link
              key={c.slug}
              to={`/catalog/${c.slug}`}
              className={styles.link}
            >
              {c.title}
            </Link>
          ))}
        </nav>
      </Section>

      <Section title="Подобрать под ваше помещение">
        <LeadForm
          source="footer"
          defaultMessage={`Интересует: ${category.title.toLowerCase()}`}
        />
      </Section>
    </main>
  );
}
