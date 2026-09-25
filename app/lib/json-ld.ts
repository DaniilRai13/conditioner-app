import { site } from "~/config/site";
import { coverage } from "~/data/about";
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
 * Организация. Стоит на двух страницах: на главной и на контактах.
 *
 * На контактах — потому что там собраны все данные о бизнесе. На главной —
 * потому что именно её поисковик связывает с названием компании и именно
 * она претендует на попадание в блок организаций над выдачей. Рекомендация
 * Google прямая: разметку бизнеса держать на странице, которая этот бизнес
 * описывает, а при одном адресе это главная.
 *
 * Чтобы две копии не превратились в две разные организации, у обеих один
 * `@id`. Без него поисковик вправе счесть, что на сайте два предприятия
 * с одинаковым названием и одним телефоном.
 *
 * HVACBusiness, а не общий LocalBusiness: тип точнее, и в выдаче
 * это влияет на то, к каким запросам сайт считают подходящим.
 *
 * Часов работы здесь намеренно нет. В базе они лежат строкой, которую
 * пишет заказчик («Пн–Вс, 8:00–21:00»), а schema.org ждёт вид
 * `Mo-Su 08:00-21:00`. Разбирать русские сокращения значит однажды молча
 * отдать поисковику неверные часы — а неверные часы хуже, чем никаких:
 * по ним приходят к закрытой двери.
 */
export function businessJsonLd(): JsonLd {
  const root = site.url.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "@id": `${root}/#business`,
    name: site.name,
    description: `Продажа, установка и обслуживание кондиционеров в ${site.regionIn}`,
    telephone: site.phone,
    email: site.email,
    // Зона обслуживания списком, а не одной строкой. Поисковик разбирает
    // areaServed как перечень мест и по нему решает, к каким городам
    // предприятие относится, — «Пинск и Пинский район» одной фразой
    // соседние райцентры в этот перечень не заводит. Список тот же, что
    // виден человеку на контактах: два источника правды разошлись бы
    // на первом же изменении.
    areaServed: [site.region, ...coverage.filter((p) => !p.startsWith("Пинск"))],
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressCountry: "BY",
    },
    // Знак и картинка ссылки — те же файлы, что отдаёт сайт. Карточке
    // организации в выдаче они нужны, и взять их больше неоткуда.
    logo: `${root}/logo/full-480.webp`,
    image: `${root}/og/default.png`,
    url: site.url,
  };
}

/**
 * Товар с ценой.
 *
 * `BackOrder` у всех позиций, а не `InStock`: своего склада нет, техника
 * заказывается у поставщика после обращения. Флаг `inStock` из выгрузки
 * означает наличие у него, и выдавать его за своё нельзя — недостоверные
 * данные о наличии поисковик отмечает в панели вебмастера, а человек
 * узнаёт правду по телефону и перестаёт верить остальному, включая цены.
 *
 * `price` при этом — минимальная: на странице она подписана «от».
 * Для этого в разметке и существует `priceSpecification` с `minPrice`.
 */
export function productJsonLd(product: Product): JsonLd {
  const root = site.url.replace(/\/$/, "");
  const url = `${root}/product/${product.slug}`;

  // Цена от поставщика меняется, и обещать её бессрочно нельзя. Месяц
  // от сборки — срок, который сайт способен сдержать: каталог обновляется
  // ночной пересборкой, и на каждой разметка пересчитывается заново.
  // Совсем без поля поисковик считает предложение неполным.
  const validUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    // Без картинки расширенный сниппет товара не показывают вовсе —
    // это единственное обязательное поле сверх названия и цены.
    ...(product.image ? { image: `${root}${product.image}` } : {}),
    // Наш собственный идентификатор и модель производителя. По ним
    // поисковик сопоставляет одну и ту же модель у разных продавцов.
    sku: product.slug,
    ...(product.model ? { mpn: product.model } : {}),
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BYN",
      price: product.price,
      priceValidUntil: validUntil,
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: product.price,
        priceCurrency: "BYN",
      },
      availability: "https://schema.org/BackOrder",
      // Ссылка на ту же организацию, что размечена на главной и контактах.
      // Так предложение принадлежит предприятию, а не висит ничьим.
      seller: { "@id": `${root}/#business` },
    },
  };
}

export function articleJsonLd(article: Article): JsonLd {
  const root = site.url.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.h1,
    description: article.lead,
    datePublished: article.date,
    // Равна дате публикации, и это правда: статьи с тех пор не правились.
    // Когда появится своя дата изменения — брать её, а не подставлять
    // время сборки: иначе каждая пересборка выдаст все статьи за свежие,
    // и поисковик перестанет верить полю вообще.
    dateModified: article.date,
    mainEntityOfPage: `${root}/articles/${article.slug}`,
    // Картинки у статей своей нет, поэтому общая для сайта. Не пустое
    // поле: без него статью не покажут в блоках с иллюстрацией.
    image: `${root}/og/default.png`,
    author: { "@type": "Organization", name: site.name },
    publisher: {
      "@type": "Organization",
      name: site.name,
      // Знак издателя поисковик показывает рядом со статьёй; без него
      // разметка считается неполной.
      logo: {
        "@type": "ImageObject",
        url: `${root}/logo/full-480.webp`,
      },
    },
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
