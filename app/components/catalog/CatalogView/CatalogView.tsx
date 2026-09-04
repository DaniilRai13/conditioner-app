import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CatalogProduct } from "~/lib/queries";
import { ProductCard } from "../ProductCard/ProductCard";
import { formatPrice } from "~/lib/format";
import styles from "./CatalogView.module.scss";

type Props = {
  products: CatalogProduct[];
};

/** Классы площади те же, по которым отбирался каталог. */
const AREA_OPTIONS = [20, 25, 35, 50, 70];

/** Сколько карточек показываем сразу. Остальные лежат в разметке скрытыми:
 * поисковик их видит, человек разворачивает кнопкой. */
const PAGE = 12;

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
] as const;

/**
 * Витрина каталога. Фильтров сознательно два — площадь и цена: на 44 позициях
 * слайдеры по уровню шума и типу фреона были бы интерфейсом ради интерфейса
 * (PLAN.md §5).
 *
 * Состояние живёт в URL, а не в useState: так ссылку на отфильтрованную
 * выдачу можно отправить, а кнопка «назад» в браузере работает как ожидается.
 */
export function CatalogView({ products }: Props) {
  const [params, setParams] = useSearchParams();

  const area = params.get("area");
  const maxPrice = params.get("price");
  const sort = params.get("sort") ?? "";

  const priceSteps = useMemo(() => {
    if (products.length === 0) return [];
    const max = Math.max(...products.map((p) => p.price));
    // Три ступени с округлением до 500 — ровные числа читаются лучше сетки.
    return [1, 2, 3].map((i) => Math.ceil((max * i) / 4 / 500) * 500);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;

    if (area) {
      const limit = Number(area);
      list = list.filter((p) => (p.specs.areaM2 ?? 0) <= limit);
    }
    if (maxPrice) {
      list = list.filter((p) => p.price <= Number(maxPrice));
    }
    if (sort === "price-asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, area, maxPrice, sort]);

  const [shown, setShown] = useState(PAGE);

  // Смена фильтра возвращает список к первым двенадцати. Иначе, развернув
  // весь каталог и переключив площадь, человек видит кнопку, которая
  // уже ничего не открывает.
  //
  // Состояние правится прямо в рендере, а не эффектом: React тут же
  // перезапускает рендер с новым значением, и лишнего кадра со старым
  // счётчиком не возникает.
  const filterKey = area + "|" + maxPrice + "|" + sort;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (prevKey !== filterKey) {
    setPrevKey(filterKey);
    setShown(PAGE);
  }

  const rest = filtered.length - shown;

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // replace, чтобы каждый клик по фильтру не засорял историю браузера.
    setParams(next, { replace: true, preventScrollReset: true });
  }

  const hasFilters = Boolean(area || maxPrice);

  return (
    <div className={styles.wrap}>
      <div className={styles.filters}>
        <div className={styles.group}>
          <span className={styles.label}>Площадь помещения</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={!area ? `${styles.chip} ${styles.on}` : styles.chip}
              onClick={() => update("area", null)}
            >
              Любая
            </button>
            {AREA_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={
                  area === String(value)
                    ? `${styles.chip} ${styles.on}`
                    : styles.chip
                }
                onClick={() => update("area", String(value))}
              >
                до {value} м²
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Цена</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={
                !maxPrice ? `${styles.chip} ${styles.on}` : styles.chip
              }
              onClick={() => update("price", null)}
            >
              Любая
            </button>
            {priceSteps.map((value) => (
              <button
                key={value}
                type="button"
                className={
                  maxPrice === String(value)
                    ? `${styles.chip} ${styles.on}`
                    : styles.chip
                }
                onClick={() => update("price", String(value))}
              >
                до {formatPrice(value)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="catalog-sort">
            Сортировка
          </label>
          <select
            id="catalog-sort"
            className={styles.select}
            value={sort}
            onChange={(e) => update("sort", e.target.value || null)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className={styles.count} aria-live="polite">
        {filtered.length === products.length
          ? `${products.length} моделей`
          : `Найдено ${filtered.length} из ${products.length}`}
      </p>

      {filtered.length > 0 ? (
        <>
          <div className={styles.grid}>
            {filtered.map((p, i) => (
              <ProductCard
                key={p.slug}
                product={p}
                className={i >= shown ? styles.beyond : undefined}
              />
            ))}
          </div>

          {rest > 0 && (
            <button
              type="button"
              className={styles.more}
              onClick={() => setShown(shown + PAGE)}
            >
              Показать ещё {Math.min(PAGE, rest)}
              <span className={styles.moreRest}>осталось {rest}</span>
            </button>
          )}
        </>
      ) : (
        // Пустая выдача без объяснения и выхода — тупик. Даём и то, и другое.
        <div className={styles.empty}>
          <b>Под эти условия ничего не нашлось</b>
          <p>
            Попробуйте ослабить фильтры. Или позвоните — у поставщика больше
            4000 моделей, привезу нужную под заказ.
          </p>
          {hasFilters && (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setParams({}, { replace: true })}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
}
