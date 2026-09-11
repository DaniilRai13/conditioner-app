/**
 * Правила отбора товаров: границы шкал, фильтр и сортировка.
 *
 * Общие для витрины и для админки. Условия там и там одни и те же —
 * площадь, цена, шум, компрессор, Wi-Fi, — и разойтись они не должны:
 * заказчик отбирает в админке то же, что покупатель на сайте, и «нашлось
 * три модели» в одном месте обязано означать те же три в другом.
 *
 * Держать копию на каждой стороне — ровно та ошибка, из-за которой админку
 * и перенесли внутрь сайта: копии совпадают до первой правки, а расходятся
 * молча, потому что оба места собираются успешно.
 *
 * Функции чистые и ничего не знают ни про адрес страницы, ни про React:
 * состояние фильтров ведёт вызывающая сторона, у витрины и админки оно
 * разное (у первой в адресе и с показом по частям, у второй свои условия
 * вроде скрытых товаров).
 */

/**
 * Минимум, который нужен фильтру. Структурный тип, а не общий предок:
 * под него подходит и `CatalogProduct` витрины, и `ProductRow` админки,
 * при том что полей у них разное количество и называются они по-разному.
 */
export type Filterable = {
  price: number;
  specs: {
    areaM2?: number;
    isInverter?: boolean;
    hasWifi?: boolean;
    noiseDb?: number;
  };
};

export type ProductBounds = {
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
};

export type ProductFilters = {
  area: number;
  priceFrom: number;
  priceTo: number;
  noise: number | null;
  comp: string | null;
  wifi: boolean;
};

/** Пороги шума. Числа не выдуманы: у нас разброс 19–54.8 дБ, и 25 дБ —
 * граница, ниже которой блок тише шёпота. */
export const NOISE_STEPS = [25, 30, 40];

export const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "area-desc", label: "Сначала мощнее" },
  { value: "noise-asc", label: "Сначала тише" },
] as const;

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

/**
 * Границы ползунков по самой выборке, а не заданные числами: на странице
 * категории диапазоны другие — у мобильных цена до 2 640, у мульти-сплитов
 * от 4 640. Округляем наружу, чтобы крайние товары не отсекались шагом.
 */
export function getBounds(products: Filterable[]): ProductBounds {
  if (products.length === 0) {
    return { areaMin: 0, areaMax: 0, priceMin: 0, priceMax: 0 };
  }

  const areas = products.map((p) => p.specs.areaM2 ?? 0).filter(Boolean);
  const prices = products.map((p) => p.price);

  return {
    // Площадь может быть не указана ни у одной модели выборки — тогда
    // Math.min от пустого массива вернул бы Infinity и сломал шкалу.
    areaMin: areas.length ? floorTo(Math.min(...areas), 5) : 0,
    areaMax: areas.length ? ceilTo(Math.max(...areas), 5) : 0,
    priceMin: floorTo(Math.min(...prices), 100),
    priceMax: ceilTo(Math.max(...prices), 100),
  };
}

/**
 * Отбор. Каждое условие применяется, только если человек его тронул:
 * иначе фильтр по площади с нижней границей отсекал бы модели без
 * указанной площади ещё до того, как к нему прикоснулись.
 */
export function applyFilters<T extends Filterable>(
  products: T[],
  f: ProductFilters,
  bounds: ProductBounds
): T[] {
  let list = products;

  if (f.area > bounds.areaMin) {
    list = list.filter((p) => {
      // Модель без указанной площади пропускаем всегда: спрятать товар
      // из-за дырки в данных хуже, чем показать его лишний раз.
      if (p.specs.areaM2 == null) return true;
      return p.specs.areaM2 >= f.area;
    });
  }

  if (f.priceFrom > bounds.priceMin) {
    list = list.filter((p) => p.price >= f.priceFrom);
  }

  if (f.priceTo < bounds.priceMax) {
    list = list.filter((p) => p.price <= f.priceTo);
  }

  if (f.noise) {
    const limit = f.noise;
    list = list.filter((p) => p.specs.noiseDb != null && p.specs.noiseDb <= limit);
  }

  if (f.comp === "inverter") list = list.filter((p) => p.specs.isInverter);
  if (f.comp === "on-off") list = list.filter((p) => !p.specs.isInverter);
  if (f.wifi) list = list.filter((p) => p.specs.hasWifi);

  return list;
}

/** Сортировка. Новый массив, а не мутация: `list` может быть исходным. */
export function applySort<T extends Filterable>(list: T[], sort: string): T[] {
  switch (sort) {
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "area-desc":
      return [...list].sort((a, b) => (b.specs.areaM2 ?? 0) - (a.specs.areaM2 ?? 0));
    case "noise-asc":
      // Модели без указанного шума уводим в конец, а не считаем самыми тихими.
      return [...list].sort(
        (a, b) => (a.specs.noiseDb ?? 999) - (b.specs.noiseDb ?? 999)
      );
    default:
      return list;
  }
}

/** Сколько условий человек тронул — для счётчика на кнопке «Фильтры». */
export function countActive(f: ProductFilters, bounds: ProductBounds): number {
  return (
    (f.area > bounds.areaMin ? 1 : 0) +
    (f.priceFrom > bounds.priceMin || f.priceTo < bounds.priceMax ? 1 : 0) +
    (f.noise ? 1 : 0) +
    (f.comp ? 1 : 0) +
    (f.wifi ? 1 : 0)
  );
}
