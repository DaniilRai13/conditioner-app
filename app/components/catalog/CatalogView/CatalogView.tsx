import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogProduct } from "~/lib/queries";
import { ProductCard } from "../ProductCard/ProductCard";
import { RangeFilter } from "../RangeFilter/RangeFilter";
import { formatPrice } from "~/lib/format";
import styles from "./CatalogView.module.scss";

type Props = {
  products: CatalogProduct[];
};

/** Сколько карточек показываем сразу. Остальные лежат в разметке скрытыми:
 * поисковик их видит, человек разворачивает кнопкой. */
const PAGE = 12;

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

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

/**
 * Витрина каталога: фильтры колонкой слева, товары справа.
 *
 * Боковая панель, а не полоса сверху: условий стало пять, и полосой они
 * занимали бы два ряда над выдачей. В колонке они видны всё время, и менять
 * их можно не прокручивая страницу вверх.
 *
 * Фильтр по площади отвечает на вопрос, с которым приходят: «у меня комната
 * N метров, что подойдёт». Поэтому он оставляет модели, рассчитанные
 * НЕ МЕНЬШЕ чем на N. До этого было наоборот, и для комнаты в 20 м² выдача
 * предлагала блок на 18 — заведомо слабый.
 *
 * Состояние живёт в URL: так ссылку на отфильтрованную выдачу можно
 * отправить, а кнопка «назад» работает как ожидается.
 */
export function CatalogView({ products }: Props) {
  const [params, setParams] = useSearchParams();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  // Границы считаются по выборке, а не задаются числами: на странице
  // категории диапазоны другие — у мобильных цена до 2 640, у мульти-сплитов
  // от 4 640.
  const bounds = useMemo(() => {
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
  }, [products]);

  const area = Number(params.get("area")) || bounds.areaMin;
  const priceFrom = Number(params.get("pmin")) || bounds.priceMin;
  const priceTo = Number(params.get("pmax")) || bounds.priceMax;
  const noise = Number(params.get("noise")) || null;
  const comp = params.get("comp");
  const wifi = params.get("wifi") === "1";
  const sort = params.get("sort") ?? "";

  const filtered = useMemo(() => {
    let list = products;

    if (area > bounds.areaMin) {
      list = list.filter((p) => {
        // Модель без указанной площади пропускаем всегда: спрятать товар
        // из-за дырки в данных хуже, чем показать его лишний раз.
        if (p.specs.areaM2 == null) return true;
        return p.specs.areaM2 >= area;
      });
    }
    if (priceFrom > bounds.priceMin) {
      list = list.filter((p) => p.price >= priceFrom);
    }
    if (priceTo < bounds.priceMax) {
      list = list.filter((p) => p.price <= priceTo);
    }
    if (noise) {
      list = list.filter(
        (p) => p.specs.noiseDb != null && p.specs.noiseDb <= noise,
      );
    }
    if (comp === "inverter") list = list.filter((p) => p.specs.isInverter);
    if (comp === "on-off") list = list.filter((p) => !p.specs.isInverter);
    if (wifi) list = list.filter((p) => p.specs.hasWifi);

    if (sort === "price-asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "area-desc")
      list = [...list].sort(
        (a, b) => (b.specs.areaM2 ?? 0) - (a.specs.areaM2 ?? 0),
      );
    // Модели без указанного шума уводим в конец, а не считаем самыми тихими.
    if (sort === "noise-asc")
      list = [...list].sort(
        (a, b) => (a.specs.noiseDb ?? 999) - (b.specs.noiseDb ?? 999),
      );

    return list;
  }, [products, area, priceFrom, priceTo, noise, comp, wifi, sort, bounds]);

  const [shown, setShown] = useState(PAGE);

  // Смена фильтра возвращает список к первым двенадцати. Ключ собран
  // из значений в адресе, а не из черновиков ползунка, поэтому сброс
  // происходит один раз на отпускании, а не на каждом шаге перетаскивания.
  const filterKey = `${area}|${priceFrom}|${priceTo}|${noise}|${comp}|${wifi}|${sort}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (prevKey !== filterKey) {
    setPrevKey(filterKey);
    setShown(PAGE);
  }

  const rest = filtered.length - shown;

  function update(patch: Record<string, number | string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    // replace, чтобы каждое движение фильтра не засоряло историю браузера.
    setParams(next, { replace: true, preventScrollReset: true });
  }

  const activeCount =
    (area > bounds.areaMin ? 1 : 0) +
    (priceFrom > bounds.priceMin || priceTo < bounds.priceMax ? 1 : 0) +
    (noise ? 1 : 0) +
    (comp ? 1 : 0) +
    (wifi ? 1 : 0);

  const reset = () => setParams({}, { replace: true });

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
