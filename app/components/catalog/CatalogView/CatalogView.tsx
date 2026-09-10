import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogProduct } from "~/lib/queries";
import { ProductCard } from "../ProductCard/ProductCard";
import { RangeFilter } from "../RangeFilter/RangeFilter";
import { formatPrice } from "~/lib/format";
import { useCatalogFilters, PAGE } from "./useCatalogFilters";
import styles from "./CatalogView.module.scss";

type Props = {
  products: CatalogProduct[];
};

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "area-desc", label: "Сначала мощнее" },
  { value: "noise-asc", label: "Сначала тише" },
] as const;

/** Пороги шума. Числа не выдуманы: у нас разброс 19–54.8 дБ, и 25 дБ —
 * граница, ниже которой блок тише шёпота. */
const NOISE_STEPS = [25, 30, 40];

/**
 * Витрина каталога: фильтры колонкой слева, товары справа.
 *
 * Боковая панель, а не полоса сверху: условий стало пять, и полосой они
 * занимали бы два ряда над выдачей. В колонке они видны всё время, и менять
 * их можно не прокручивая страницу вверх.
 *
 * Компонент занимается только разметкой. Отбор, сортировка, показ
 * по частям и состояние в адресе страницы — в `useCatalogFilters`.
 */
export function CatalogView({ products }: Props) {
  const {
    bounds,
    filters: { area, priceFrom, priceTo, noise, comp, wifi, sort },
    filtered,
    shown,
    rest,
    showMore,
    activeCount,
    update,
    reset,
  } = useCatalogFilters(products);

  // Единственное состояние, которое остаётся здесь: открыта ли панель
  // на узком экране. Это про показ, а не про отбор, и в адресе ему делать
  // нечего — ссылкой делятся ради выдачи, а не ради открытой панели.
  const [openOnMobile, setOpenOnMobile] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Кнопка только для узких экранов: там панель занимала бы экран
          целиком, и до товаров пришлось бы прокручивать. */}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpenOnMobile(!openOnMobile)}
        aria-expanded={openOnMobile}
      >
        {openOnMobile ? (
          <X size={18} aria-hidden />
        ) : (
          <SlidersHorizontal size={18} aria-hidden />
        )}
        Фильтры
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>

      <aside
        className={
          openOnMobile ? `${styles.sidebar} ${styles.open}` : styles.sidebar
        }
      >
        <div className={styles.sideHead}>
          <b>Фильтры</b>
          {activeCount > 0 && (
            <button type="button" className={styles.clear} onClick={reset}>
              Сбросить
            </button>
          )}
        </div>

        <RangeFilter
          id="filter-area"
          label="Площадь помещения"
          min={bounds.areaMin}
          max={bounds.areaMax}
          step={5}
          value={area}
          neutral={bounds.areaMin}
          unit="м²"
          onCommit={(v) => update({ area: v > bounds.areaMin ? v : null })}
        />

        <div className={styles.group}>
          <span className={styles.label}>Цена, р.</span>
          <div className={styles.pair}>
            <label className={styles.field}>
              <span>от</span>
              <input
                type="number"
                inputMode="numeric"
                step={100}
                min={bounds.priceMin}
                max={priceTo}
                value={priceFrom}
                onChange={(e) =>
                  update({
                    pmin:
                      Number(e.target.value) > bounds.priceMin
                        ? Number(e.target.value)
                        : null,
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>до</span>
              <input
                type="number"
                inputMode="numeric"
                step={100}
                min={priceFrom}
                max={bounds.priceMax}
                value={priceTo}
                onChange={(e) =>
                  update({
                    pmax:
                      Number(e.target.value) < bounds.priceMax
                        ? Number(e.target.value)
                        : null,
                  })
                }
              />
            </label>
          </div>
          <span className={styles.hint}>
            {formatPrice(bounds.priceMin)} — {formatPrice(bounds.priceMax)}
          </span>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Уровень шума</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={!noise ? `${styles.chip} ${styles.on}` : styles.chip}
              onClick={() => update({ noise: null })}
            >
              любой
            </button>
            {NOISE_STEPS.map((n) => (
              <button
                key={n}
                type="button"
                className={
                  noise === n ? `${styles.chip} ${styles.on}` : styles.chip
                }
                onClick={() => update({ noise: noise === n ? null : n })}
              >
                тише {n} дБ
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Компрессор</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={!comp ? `${styles.chip} ${styles.on}` : styles.chip}
              onClick={() => update({ comp: null })}
            >
              любой
            </button>
            <button
              type="button"
              className={
                comp === "inverter"
                  ? `${styles.chip} ${styles.on}`
                  : styles.chip
              }
              onClick={() =>
                update({ comp: comp === "inverter" ? null : "inverter" })
              }
            >
              инвертор
            </button>
            <button
              type="button"
              className={
                comp === "on-off" ? `${styles.chip} ${styles.on}` : styles.chip
              }
              onClick={() =>
                update({ comp: comp === "on-off" ? null : "on-off" })
              }
            >
              обычный
            </button>
          </div>
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={wifi}
            onChange={(e) => update({ wifi: e.target.checked ? "1" : null })}
          />
          Только с Wi-Fi
        </label>
      </aside>

      <div className={styles.main}>
        <div className={styles.top}>
          <p className={styles.count} aria-live="polite">
            {filtered.length === products.length
              ? `${products.length} моделей`
              : `Найдено ${filtered.length} из ${products.length}`}
          </p>
          <select
            className={styles.select}
            value={sort}
            aria-label="Сортировка"
            onChange={(e) => update({ sort: e.target.value || null })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

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
              <button type="button" className={styles.more} onClick={showMore}>
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
            {activeCount > 0 && (
              <button type="button" className={styles.reset} onClick={reset}>
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
