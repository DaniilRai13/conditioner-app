import { RotateCcw } from "lucide-react";
import { RangeFilter } from "~/components/catalog/RangeFilter/RangeFilter";
import type { ProductBounds } from "~/lib/product-filter";
import { formatPrice } from "~/lib/format";
import styles from "./ProductFilters.module.scss";

/**
 * Панель отбора товаров в админке.
 *
 * Условий пять, и это не все, что умеет витрина. Шума, компрессора и Wi-Fi
 * здесь нет намеренно: по ним выбирает покупатель, которому важно, какой
 * кондиционер купить. Заказчик приходит сюда с другими вопросами — что ещё
 * не опубликовано, у чего не написано описание, — и лишние фишки только
 * растягивали панель, оставаясь нетронутыми.
 *
 * Отбор по площади и цене считается общим кодом витрины
 * (`~/lib/product-filter`), так что «нашлось три модели» здесь означает
 * те же три на сайте.
 *
 * Ползунок площади взят готовым с витрины: он нативный, умеет стрелки
 * и Home/End и отдаёт значение на отпускании, а не на каждом пикселе.
 * Переписывать его ради другого цвета незачем — акцент он берёт
 * из переменной.
 */

export type AdminFilterValues = {
  area: number;
  priceFrom: number;
  priceTo: number;
  type: string;
  visibility: string;
  noDescription: boolean;
};

type Patch = Record<string, number | string | null>;

export function ProductFilters({
  bounds,
  values,
  types,
  activeCount,
  onChange,
  onReset,
}: {
  bounds: ProductBounds;
  values: AdminFilterValues;
  types: Record<string, string>;
  activeCount: number;
  onChange: (patch: Patch) => void;
  onReset: () => void;
}) {
  const { area, priceFrom, priceTo, type, visibility } = values;

  const chip = (on: boolean) =>
    on ? `${styles.chip} ${styles.on}` : styles.chip;

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <b>Фильтры</b>
        {activeCount > 0 && (
          <button type="button" className={styles.clear} onClick={onReset}>
            <RotateCcw aria-hidden />
            Сбросить
          </button>
        )}
      </div>

      {/* С этого начинают работу: «что ещё не готово». */}
      <div className={styles.group}>
        <span className={styles.label}>Показ на сайте</span>
        <div className={styles.chips}>
          <button
            type="button"
            className={chip(!visibility)}
            onClick={() => onChange({ vis: null })}
          >
            все
          </button>
          <button
            type="button"
            className={chip(visibility === "on")}
            onClick={() => onChange({ vis: visibility === "on" ? null : "on" })}
          >
            на сайте
          </button>
          <button
            type="button"
            className={chip(visibility === "off")}
            onClick={() => onChange({ vis: visibility === "off" ? null : "off" })}
          >
            скрытые
          </button>
        </div>
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={values.noDescription}
          onChange={(e) => onChange({ nodesc: e.target.checked ? "1" : null })}
        />
        Без описания
      </label>

      <div className={styles.group}>
        <span className={styles.label}>Тип</span>
        <select
          className={styles.select}
          aria-label="Тип оборудования"
          value={type}
          onChange={(e) => onChange({ type: e.target.value || null })}
        >
          <option value="">Все типы</option>
          {Object.entries(types).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <RangeFilter
        id="admin-filter-area"
        label="Площадь помещения"
        min={bounds.areaMin}
        max={bounds.areaMax}
        step={5}
        value={area}
        neutral={bounds.areaMin}
        unit="м²"
        onCommit={(v) => onChange({ area: v > bounds.areaMin ? v : null })}
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
                onChange({
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
                onChange({
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
    </div>
  );
}
