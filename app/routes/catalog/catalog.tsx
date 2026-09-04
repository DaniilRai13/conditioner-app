import { Link } from "react-router";
import type { Route } from "./+types/catalog";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { SupplierNote } from "~/components/catalog/SupplierNote/SupplierNote";
import { CatalogView } from "~/components/catalog/CatalogView/CatalogView";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { getCatalogProducts, getCategoriesWithCount } from "~/lib/queries";
import { site } from "~/config/site";
import styles from "./catalog.module.scss";

export function loader() {
  return {
    products: getCatalogProducts(),
    categories: getCategoriesWithCount().map(({ slug, title, count }) => ({
      slug,
      title,
      count,
    })),
  };
}

export function meta() {
  return [
    { title: `Каталог кондиционеров — ${site.name}` },
    {
      name: "description",
      content:
        "Отобранные модели кондиционеров для квартиры, дома и офиса. Сплит-системы, мульти-сплит, мобильные и полупромышленные с установкой в Минске.",
    },
  ];
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  const { products, categories } = loaderData;

  return (
    <main>
      <PageHeader
        title="Каталог кондиционеров"
        lead="Отобрал модели, с которыми работаю сам: проверенные бренды, понятные характеристики и честные цены."
        crumbs={[{ label: "Каталог" }]}
      />

      <Section className={styles.top}>
        <nav className={styles.categories} aria-label="Категории каталога">
          {categories.map((c) => (
            <Link key={c.slug} to={`/catalog/${c.slug}`} className={styles.category}>
              <b>{c.title}</b>
              <span>{c.count} моделей</span>
            </Link>
          ))}
        </nav>

        <CatalogView products={products} />

        <SupplierNote />
      </Section>

      <Section
        title="Не уверены в выборе?"
        lead="Назовите площадь и этаж — подберу модель с нужным запасом и скажу стоимость под ключ."
      >
        <LeadForm source="footer" />
      </Section>
    </main>
  );
}
