import { Link } from "react-router";
import { Check, Snowflake, Flame, Volume2, Wifi, Wind, Thermometer } from "lucide-react";
import type { Route } from "./+types/product";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { getProductBySlug, getSimilarProducts } from "~/lib/queries";
import { getCategory } from "~/data/categories";
import { formatPrice, formatArea, formatKw } from "~/lib/format";
import {
  installPriceFor,
  PRICES_CONFIRMED,
  STANDARD_INSTALL_INCLUDES,
} from "~/config/pricing";
import { site } from "~/config/site";
import styles from "./product.module.scss";

export function loader({ params }: Route.LoaderArgs) {
  const product = getProductBySlug(params.slug);
  if (!product) throw new Response("Not Found", { status: 404 });

  return {
    product,
    similar: getSimilarProducts(product),
    category: getCategory(product.type) ?? null,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Кондиционер — ${site.name}` }];
  const { product } = loaderData;
  return [
    { title: `${product.name} — купить в Минске | ${site.name}` },
    {
      name: "description",
      content:
        product.description ||
        `${product.name}: ${formatArea(product.specs.areaM2) ?? ""}. Продажа и установка в Минске и области.`,
    },
  ];
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  const { product, similar, category } = loaderData;
  const { specs } = product;

  const install = specs.areaM2 ? installPriceFor(specs.areaM2) : null;

  const highlights = [
    specs.areaM2 && {
      icon: Snowflake,
      label: "Площадь",
      value: formatArea(specs.areaM2),
    },
    specs.coolingKw && {
      icon: Wind,
      label: "Охлаждение",
      value: formatKw(specs.coolingKw),
    },
    specs.heatingKw && {
      icon: Flame,
      label: "Обогрев",
      value: formatKw(specs.heatingKw),
    },
    specs.noiseDb && {
      icon: Volume2,
      label: "Шум",
      value: `от ${specs.noiseDb} дБ`,
    },
    specs.minHeatTemp !== undefined && {
      icon: Thermometer,
      label: "Обогрев до",
      value: `${specs.minHeatTemp} °C`,
    },
    specs.hasWifi && { icon: Wifi, label: "Wi-Fi", value: "есть" },
  ].filter(Boolean) as { icon: typeof Snowflake; label: string; value: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BYN",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    },
  };

  return (
    <main>
      <PageHeader
        title={product.name}
        crumbs={[
          { label: "Каталог", to: "/catalog" },
          ...(category
            ? [{ label: category.title, to: `/catalog/${category.slug}` }]
            : []),
          { label: product.model || product.name },
        ]}
      />

      <Section className={styles.top}>
        <div className={styles.columns}>
          <div className={styles.gallery}>
            {product.image ? (
              <img
                className={styles.image}
                src={product.image}
                alt={product.name}
                width={800}
                height={800}
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <div className={styles.noImage} aria-hidden />
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.brand}>{product.brand}</span>
            <p className={styles.stock}>
              {product.inStock ? "В наличии" : "Под заказ, 1–2 недели"}
            </p>

            <div className={styles.priceBox}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              <span className={styles.priceNote}>
                цена оборудования
                {install && PRICES_CONFIRMED
                  ? ` · монтаж от ${formatPrice(install)}`
                  : " · монтаж рассчитаю по вашим условиям"}
              </span>
            </div>

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            <ul className={styles.highlights}>
              {highlights.map((h) => (
                <li key={h.label}>
                  <h.icon size={18} aria-hidden />
                  <span>
                    <b>{h.value}</b>
                    <span className={styles.highlightLabel}>{h.label}</span>
                  </span>
                </li>
              ))}
            </ul>

            <Card className={styles.installCard}>
              <b className={styles.installTitle}>Что входит в монтаж</b>
              <ul className={styles.installList}>
                {STANDARD_INSTALL_INCLUDES.map((item) => (
                  <li key={item}>
                    <Check size={16} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/price" className={styles.priceLink}>
                Подробнее о ценах на монтаж
              </Link>
            </Card>
          </div>
        </div>
      </Section>

        {Object.keys(specs.extra).length > 0 && (
          <Section title="Все характеристики" className={styles.specsSection}>
            <details className={styles.specsDetails}>
              <summary className={styles.specsSummary}>
                Показать полную таблицу ({Object.keys(specs.extra).length} параметров)
              </summary>
              <dl className={styles.specsTable}>
                {Object.entries(specs.extra).map(([name, value]) => (
                  <div key={name} className={styles.specsRow}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </Section>
        )}
      <Section title="Оставить заявку на эту модель">
        <LeadForm
          source="product"
          productSlug={product.slug}
          defaultMessage={`Интересует ${product.name}`}
        />
      </Section>


      {similar.length > 0 && (
        <Section title="Похожие модели">
          <div className={styles.similar}>
            {similar.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
