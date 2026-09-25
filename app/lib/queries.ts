import raw from "../data/products.json";
import { categories } from "../data/categories";
import type { Product, ProductType } from "../types/product";
// Относительный путь, как и остальные здесь: модуль читает
// react-router.config.ts, а тот загружается вне Vite и алиасы не разрешает.
import { seoProductName } from "./format";

/**
 * Единственная точка доступа к каталогу.
 *
 * Сейчас читает локальный JSON, собранный `npm run import:catalog`.
 * Когда появится Supabase, меняется только этот файл — компоненты
 * ходят сюда и об источнике не знают (PLAN.md §5.2).
 *
 * Импорты здесь относительные, а не через алиас ~/: этот модуль читает
 * react-router.config.ts, который загружается вне Vite и алиасы не резолвит.
 *
 * Функции синхронные, потому что данные лежат рядом. С Supabase они станут
 * асинхронными — вызовы уже сидят в loader-ах роутов, где await допустим.
 */

const all = (raw as unknown as Product[]).filter((p) => p.isPublished);

/**
 * Заголовок карточки для поиска — с гарантией, что он никому не достался
 * дважды.
 *
 * `seoProductName` укладывает имя в бюджет заголовка и обрезает с конца,
 * то есть первым выбрасывает артикул — а именно он и различает соседние
 * исполнения одной серии. Две модели Ballu Universal DC 3 на 50 м²
 * получали дословно один заголовок; то же у двух Gree U-MATCH на 100 м².
 * Для поиска это две страницы, которые невозможно отличить друг от друга,
 * и он вправе оставить в выдаче одну.
 *
 * Различаем только там, где столкнулись, и только тем, чем модели
 * действительно отличаются: от артикулов отбрасывается общее начало
 * (`GUD100PHS1/B-S` и `GUD100ZD1/B-S` → `PHS1/B-S` и `ZD1/B-S`). Добавлять
 * артикул целиком всем подряд нельзя — он съест весь бюджет заголовка
 * у сорока восьми карточек, которым различаться не с кем.
 */
const seoTitles = new Map<string, string>();

{
  const groups = new Map<string, Product[]>();
  for (const p of all) {
    const base = seoProductName(p.brand, p.model, p.specs.areaM2, 42);
    groups.set(base, (groups.get(base) ?? []).concat(p));
  }

  for (const [base, group] of groups) {
    if (group.length === 1) {
      seoTitles.set(group[0].slug, base);
      continue;
    }

    // Артикул — первое слово модели, которого нет в укороченном имени.
    const articles = group.map((p) => {
      const kept = base.replace(`${p.brand} `, "").replace(/ до .*$/, "");
      const rest = p.model.split(/\s+/).filter((w) => !kept.includes(w) && w !== "/");
      return rest[0] ?? p.model;
    });

    // Общее начало артикулов не различает — отбрасываем его.
    let common = 0;
    while (
      articles.every((a) => a.length > common + 1 && a[common] === articles[0][common])
    ) {
      common++;
    }

    group.forEach((p, i) => {
      const mark = articles[i].slice(common);
      const [name, area] = base.split(" до ");
      seoTitles.set(p.slug, area ? `${name} ${mark} до ${area}` : `${name} ${mark}`);
    });
  }
}

/** Заголовок карточки товара для `<title>`. Уникален в пределах каталога. */
export function productSeoTitle(product: Product): string {
  return (
    seoTitles.get(product.slug) ??
    seoProductName(product.brand, product.model, product.specs.areaM2, 42)
  );
}

/**
 * Карточке не нужна полная таблица характеристик, а она тяжёлая:
 * 33 атрибута на товар × 44 товара уехали бы в бандл страницы каталога
 * без всякой пользы. Отдаём урезанный вид.
 */
export type CatalogProduct = {
  slug: string;
  name: string;
  brand: string;
  model: string;
  type: ProductType;
  price: number;
  inStock: boolean;
  image: string | null;
  tier: Product["tier"];
  featured: boolean;
  specs: {
    areaM2?: number;
    coolingKw?: number;
    isInverter?: boolean;
    hasWifi?: boolean;
    noiseDb?: number;
    /**
     * Умеет ли греть. Признак, а не мощность: карточке нужно ответить
     * «да или нет», а не показать киловатты — их негде и незачем читать
     * в списке из полусотни плиток.
     *
     * Заодно это отсекает дыры в выгрузке. Нижняя граница обогрева есть
     * не у всех греющих моделей, а у двух товаров она разобрана неверно
     * (−153 °C) — признак от этого не зависит вовсе.
     */
    heats?: boolean;
  };
};

function toCatalog(p: Product): CatalogProduct {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    model: p.model,
    type: p.type,
    price: p.price,
    inStock: p.inStock,
    image: p.image,
    tier: p.tier,
    featured: p.featured,
    specs: {
      areaM2: p.specs.areaM2,
      coolingKw: p.specs.coolingKw,
      isInverter: p.specs.isInverter,
      hasWifi: p.specs.hasWifi,
      noiseDb: p.specs.noiseDb,
      heats: Boolean(p.specs.heatingKw),
    },
  };
}

/** Порядок по умолчанию: сначала в наличии, потом по возрастанию цены. */
function defaultOrder(a: Product, b: Product): number {
  if (a.sortOrder !== b.sortOrder) return b.sortOrder - a.sortOrder;
  if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
  return a.price - b.price;
}

export function getCatalogProducts(type?: ProductType): CatalogProduct[] {
  return all
    .filter((p) => !type || p.type === type)
    .sort(defaultOrder)
    .map(toCatalog);
}

export function getProductBySlug(slug?: string): Product | undefined {
  return all.find((p) => p.slug === slug);
}

/** Похожие модели: тот же тип, ближайшие по площади. */
export function getSimilarProducts(product: Product, limit = 3): CatalogProduct[] {
  const area = product.specs.areaM2 ?? 0;
  return all
    .filter((p) => p.type === product.type && p.slug !== product.slug)
    .sort(
      (a, b) =>
        Math.abs((a.specs.areaM2 ?? 0) - area) -
        Math.abs((b.specs.areaM2 ?? 0) - area)
    )
    .slice(0, limit)
    .map(toCatalog);
}

export function getCategoriesWithCount() {
  return categories.map((c) => ({
    ...c,
    count: all.filter((p) => p.type === c.slug).length,
  }));
}

/** Для prerender: все слаги товаров. */
export function getProductSlugs(): string[] {
  return all.map((p) => p.slug);
}

export type SolutionPick = {
  tier: "budget" | "optimum" | "premium";
  label: string;
  product: CatalogProduct;
};

const TIER_LABELS = {
  budget: "Бюджетный",
  optimum: "Оптимальный",
  premium: "Премиум",
} as const;

/**
 * Три модели под решение: бюджет, оптимум, премиум.
 *
 * Подбираем из каталога по площади, а не прописываем слаги руками: иначе
 * при следующем импорте ссылки протухнут молча, и страница решения покажет
 * пустоту вместо моделей.
 *
 * Верхняя граница площади нужна, чтобы под комнату 20 м² не предложить
 * модель на 70: формально она подходит, но это переплата и постоянные
 * циклы запуска на минимальной нагрузке.
 */
export function getSolutionProducts(
  areaTo: number,
  types: ProductType[]
): SolutionPick[] {
  const fits = all
    .filter((p) => {
      if (!types.includes(p.type)) return false;
      const area = p.specs.areaM2;
      if (!area) return false;
      // Верхняя граница 1.25, а не 1.6: с широким допуском под комнату
      // 35 м² предлагались блоки на 50 — формально подходят, а на деле
      // это переплата и работа на минимальной нагрузке.
      return area >= areaTo && area <= areaTo * 1.25;
    })
    .sort((a, b) => a.price - b.price);

  if (fits.length === 0) return [];

  const indexes =
    fits.length === 1
      ? [0]
      : fits.length === 2
        ? [0, fits.length - 1]
        : [0, Math.floor(fits.length / 2), fits.length - 1];

  const tiers = ["budget", "optimum", "premium"] as const;

  return indexes.map((index, i) => ({
    tier: tiers[i],
    label: TIER_LABELS[tiers[i]],
    product: toCatalog(fits[index]),
  }));
}

/** Цена «от» для карточки решения — самое дешёвое подходящее оборудование. */
export function getSolutionPriceFrom(
  areaTo: number,
  types: ProductType[]
): number | null {
  const picks = getSolutionProducts(areaTo, types);
  return picks.length ? picks[0].product.price : null;
}

