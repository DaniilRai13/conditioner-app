import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  applyFilters,
  applySort,
  countActive,
  getBounds,
  type ProductFilters,
} from "~/lib/product-filter";
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
 * Сами правила — в `~/lib/product-filter`: те же условия применяет админка,
 * и расходиться они не должны. Здесь остаётся то, что есть только у витрины:
 * состояние в адресе страницы и показ по частям.
 *
 * Состояние живёт в адресе страницы: ссылку на отфильтрованную выдачу можно
 * отправить, кнопка «назад» работает как ожидается, а у выдачи появляется
 * адрес для аналитики.
 */

/** Сколько карточек показываем сразу. Остальные лежат в разметке скрытыми:
 * поисковик их видит, человек разворачивает кнопкой. */
export const PAGE = 12;

export function useCatalogFilters(products: CatalogProduct[]) {
  const [params, setParams] = useSearchParams();

  const bounds = useMemo(() => getBounds(products), [products]);

  const filters: ProductFilters = {
    area: Number(params.get("area")) || bounds.areaMin,
    priceFrom: Number(params.get("pmin")) || bounds.priceMin,
    priceTo: Number(params.get("pmax")) || bounds.priceMax,
    noise: Number(params.get("noise")) || null,
    comp: params.get("comp"),
    wifi: params.get("wifi") === "1",
  };

  const sort = params.get("sort") ?? "";
  const { area, priceFrom, priceTo, noise, comp, wifi } = filters;

  const filtered = useMemo(
    () => applySort(applyFilters(products, filters, bounds), sort),
    // Зависимости перечислены значениями, а не объектом filters: тот
    // пересоздаётся на каждом рендере, и useMemo не давал бы ничего.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, bounds, area, priceFrom, priceTo, noise, comp, wifi, sort]
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
    filters: { ...filters, sort },
    filtered,
    /** Сколько карточек показано и сколько осталось под кнопкой. */
    shown,
    rest: filtered.length - shown,
    showMore: () => setShown((n) => n + PAGE),
    /** Сколько условий человек тронул — для счётчика на кнопке «Фильтры». */
    activeCount: countActive(filters, bounds),
    update,
    reset: () => setParams({}, { replace: true }),
  };
}
