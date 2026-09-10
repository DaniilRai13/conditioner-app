import { site } from "~/config/site";
import type { Product } from "~/types/product";
import type { Article } from "~/data/articles";
import type { FaqItem } from "~/data/faq";
import type { Crumb } from "~/components/layout/Breadcrumbs/Breadcrumbs";

/**
 * Разметка Schema.org — вся в одном файле.
 *
 * До этого она лежала кусками в четырёх местах: в карточке товара,
 * в статье, на контактах и в хлебных крошках. Так она и расходится:
 * в одном месте `site.name`, в другом захардкоженное название, а сверять
 * их некому — ошибку показывает не браузер, а валидатор поисковика,
 * куда никто не заглядывает по своей воле.
 *
 * Возвращаем объекты, а не готовые строки: разметку вставляет тот, кто
 * её показывает, и ему же решать, попадёт ли она в пререндер.
 */

export type JsonLd = Record<string, unknown>;

/** Тег со структурированными данными. Один способ вставки на весь сайт. */
export function jsonLdProps(data: JsonLd) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  } as const;
}

/**
 * Организация. Живёт на странице контактов, где собраны все данные
 * о бизнесе: поисковику незачем встречать её на каждой странице.
 *
 * HVACBusiness, а не общий LocalBusiness: тип точнее, и в выдаче
 * это влияет на то, к каким запросам сайт считают подходящим.
 */
export function businessJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: site.name,
    description: `Продажа, установка и обслуживание кондиционеров в ${site.region}`,
    telephone: site.phone,
    areaServed: site.region,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressCountry: "BY",
    },
    url: site.url,
  };
}

/**
 * Товар с ценой. `availability` берётся из данных поставщика: обещать
 * наличие, которого нет, — прямая дорога к пометке о недостоверных данных
 * в панели вебмастера.
 */
export function productJsonLd(product: Product): JsonLd {
  return {
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
}

export function articleJsonLd(article: Article): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.h1,
    description: article.lead,
    datePublished: article.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
  };
}

export function faqJsonLd(items: FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Хлебные крошки. «Главная» добавляется здесь же, чтобы разметка совпадала
 * с тем, что видит человек: у крошек на экране она тоже подставляется.
 */
export function breadcrumbsJsonLd(items: Crumb[]): JsonLd {
  const all: Crumb[] = [{ label: "Главная", to: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.to ? { item: `${site.url}${c.to === "/" ? "" : c.to}` } : {}),
    })),
  };
}
