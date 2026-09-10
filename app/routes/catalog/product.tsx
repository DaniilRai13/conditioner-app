import { Link } from "react-router";
import {
  Check,
  Snowflake,
  Flame,
  Volume2,
  Wifi,
  Wind,
  Thermometer,
} from "lucide-react";
import type { Route } from "./+types/product";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { ProductCard } from "~/components/catalog/ProductCard/ProductCard";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import { getProductBySlug, getSimilarProducts } from "~/lib/queries";
import { productJsonLd, jsonLdProps } from "~/lib/json-ld";
import { getHighlights } from "~/lib/product-view";
import { getCategory } from "~/data/categories";
import {
  formatPrice,
  formatArea,
  formatKw,
  seoProductName,
} from "~/lib/format";
import {
  installPriceFor,
  PRICES_CONFIRMED,
  STANDARD_INSTALL_INCLUDES,
} from "~/config/pricing";
import { seo } from "~/lib/seo";
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
  if (!loaderData) return seo({ title: "Кондиционер", path: "/catalog" });
  const { product } = loaderData;
  // Бюджет поиска — около 60 символов. Хвост «— купить в Минске» занимает
  // 18, остальное отдаём имени модели; названия сайта здесь нет.
  return seo({
    title: `${seoProductName(
      product.brand,
      product.model,
      product.specs.areaM2,
      42,
    )} — купить в Минске`,
    brandSuffix: false,
    description:
      product.description ||
      `${product.brand} ${product.model} — ${formatArea(product.specs.areaM2) ?? "сплит-система"}. Продажа и установка в Минске и области.`,
    path: `/product/${product.slug}`,
  });
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  const { product, similar, category } = loaderData;
  const { specs } = product;

  const install = specs.areaM2 ? installPriceFor(specs.areaM2) : null;

  const highlights = getHighlights(specs);

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

      <Section>
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
        <Section title="Все характеристики">
          <details className={styles.specsDetails}>
            <summary className={styles.specsSummary}>
              Показать полную таблицу ({Object.keys(specs.extra).length}{" "}
              параметров)
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
      {similar.length > 0 && (
        <Section title="Похожие модели">
          <div className={styles.similar}>
            {similar.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      )}

      <LeadBlock
        title="Оставить заявку на эту модель"
        lead="Проверю наличие, посчитаю монтаж и назову итоговую цену."
        source="product"
        productSlug={product.slug}
        defaultMessage={`Интересует ${product.name}`}
        points={[
          "Проверю наличие у поставщика и срок поставки",
          "Посчитаю монтаж для вашего помещения",
          "Подскажу, если под вашу площадь есть вариант выгоднее",
          "Гарантия производителя плюс моя на работы",
        ]}
      />

      <script {...jsonLdProps(productJsonLd(product))} />
    </main>
  );
}
