import raw from "../data/products.json";
import { categories } from "../data/categories";
import type { Product, ProductType } from "../types/product";

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

/** Границы фильтров считаем по данным, а не задаём руками. */
export function getCatalogBounds(products: CatalogProduct[]) {
  const prices = products.map((p) => p.price);
  const areas = products
    .map((p) => p.specs.areaM2)
    .filter((a): a is number => typeof a === "number");

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    minArea: areas.length ? Math.min(...areas) : 0,
    maxArea: areas.length ? Math.max(...areas) : 0,
  };
}
