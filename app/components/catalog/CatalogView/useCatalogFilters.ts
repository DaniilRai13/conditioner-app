import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CatalogProduct } from "~/lib/queries";

/**
 * Отбор, сортировка и постраничный показ каталога.
 *
 * Вынесено из `CatalogView`, потому что там это занимало сто с лишним строк
 * перед первым тегом: чтобы поправить отступ у кнопки «показать ещё»,
 * приходилось пролистывать всю логику фильтрации. Теперь компонент
 * занимается только разметкой, а правила отбора лежат отдельно и читаются
 * сами по себе.
 *
 * Состояние живёт в адресе страницы: ссылку на отфильтрованную выдачу можно
 * отправить, кнопка «назад» работает как ожидается, а у выдачи появляется
 * адрес для аналитики.
 */

/** Сколько карточек показываем сразу. Остальные лежат в разметке скрытыми:
 * поисковик их видит, человек разворачивает кнопкой. */
export const PAGE = 12;

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

export type CatalogBounds = {
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
};

/**
 * Границы ползунков по самой выборке, а не заданные числами: на странице
 * категории диапазоны другие — у мобильных цена до 2 640, у мульти-сплитов
 * от 4 640. Округляем наружу, чтобы крайние товары не отсекались шагом.
 */
function getBounds(products: CatalogProduct[]): CatalogBounds {
  if (products.length === 0) {
    return { areaMin: 0, areaMax: 0, priceMin: 0, priceMax: 0 };
  }
  const areas = products.map((p) => p.specs.areaM2 ?? 0).filter(Boolean);
  const prices = products.map((p) => p.price);
  return {
    areaMin: floorTo(Math.min(...areas), 5),
    areaMax: ceilTo(Math.max(...areas), 5),
    priceMin: floorTo(Math.min(...prices), 100),
    priceMax: ceilTo(Math.max(...prices), 100),
  };
}

type Filters = {
  area: number;
  priceFrom: number;
  priceTo: number;
  noise: number | null;
  comp: string | null;
  wifi: boolean;
  sort: string;
};

/**
 * Отбор. Каждое условие применяется, только если человек его тронул:
 * иначе фильтр по площади с нижней границей отсекал бы модели без
 * указанной площади ещё до того, как к нему прикоснулись.
 */
function applyFilters(
  products: CatalogProduct[],
  f: Filters,
  bounds: CatalogBounds,
): CatalogProduct[] {
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
    list = list.filter(
      (p) => p.specs.noiseDb != null && p.specs.noiseDb <= f.noise!,
    );
  }
  if (f.comp === "inverter") list = list.filter((p) => p.specs.isInverter);
  if (f.comp === "on-off") list = list.filter((p) => !p.specs.isInverter);
  if (f.wifi) list = list.filter((p) => p.specs.hasWifi);

  return list;
}

/** Сортировка. Новый массив, а не мутация: `list` может быть исходным. */
function applySort(list: CatalogProduct[], sort: string): CatalogProduct[] {
  switch (sort) {
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "area-desc":
      return [...list].sort(
        (a, b) => (b.specs.areaM2 ?? 0) - (a.specs.areaM2 ?? 0),
      );
    case "noise-asc":
      // Модели без указанного шума уводим в конец, а не считаем самыми тихими.
      return [...list].sort(
        (a, b) => (a.specs.noiseDb ?? 999) - (b.specs.noiseDb ?? 999),
      );
    default:
      return list;
  }
}

export function useCatalogFilters(products: CatalogProduct[]) {
  const [params, setParams] = useSearchParams();

  const bounds = useMemo(() => getBounds(products), [products]);

  const filters: Filters = {
    area: Number(params.get("area")) || bounds.areaMin,
    priceFrom: Number(params.get("pmin")) || bounds.priceMin,
    priceTo: Number(params.get("pmax")) || bounds.priceMax,
    noise: Number(params.get("noise")) || null,
    comp: params.get("comp"),
    wifi: params.get("wifi") === "1",
    sort: params.get("sort") ?? "",
  };

  const { area, priceFrom, priceTo, noise, comp, wifi, sort } = filters;

  const filtered = useMemo(
    () => applySort(applyFilters(products, filters, bounds), sort),
    // Зависимости перечислены значениями, а не объектом filters: тот
    // пересоздаётся на каждом рендере, и useMemo не давал бы ничего.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, bounds, area, priceFrom, priceTo, noise, comp, wifi, sort],
  );

  const [shown, setShown] = useState(PAGE);

  // Смена фильтра возвращает список к первым двенадцати. Ключ собран
  // из значений в адресе, а не из черновиков ползунка, поэтому сброс
  // происходит один раз на отпускании, а не на каждом шаге перетаскивания.
  //
  // Сравнение прямо в теле, а не в эффекте: эффект дал бы лишний рендер
  // со старым `shown` — список успел бы мигнуть длинным.
  const filterKey = `${area}|${priceFrom}|${priceTo}|${noise}|${comp}|${wifi}|${sort}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (prevKey !== filterKey) {
    setPrevKey(filterKey);
    setShown(PAGE);
  }

  function update(patch: Record<string, number | string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    // replace, чтобы каждое движение фильтра не засоряло историю браузера.
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return {
    bounds,
    filters,
    filtered,
    /** Сколько карточек показано и сколько осталось под кнопкой. */
    shown,
    rest: filtered.length - shown,
    showMore: () => setShown((n) => n + PAGE),
    /** Сколько условий человек тронул — для счётчика на кнопке «Фильтры». */
    activeCount:
      (area > bounds.areaMin ? 1 : 0) +
      (priceFrom > bounds.priceMin || priceTo < bounds.priceMax ? 1 : 0) +
      (noise ? 1 : 0) +
      (comp ? 1 : 0) +
      (wifi ? 1 : 0),
    update,
    reset: () => setParams({}, { replace: true }),
  };
}
