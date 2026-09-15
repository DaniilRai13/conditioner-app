import type { MetaFunction } from "react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ExternalLink,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import {
  listProducts,
  updateProduct,
  updateProductPrices,
} from "~/lib/admin-api";
import { useRows } from "~/hooks/useRows";
import { useSave } from "~/hooks/useSave";
import { Drawer, useDrawer } from "~/components/admin/Drawer";
import {
  applyFilters,
  applySort,
  countActive,
  getBounds,
  SORT_OPTIONS,
  type ProductFilters as ProductFilterValues,
} from "~/lib/product-filter";
import { ProductFilters, type AdminFilterValues } from "./ProductFilters";
import {
  Badge,
  Button,
  Check,
  Field,
  Input,
  PageHead,
  Saved,
  Select,
  State,
  Textarea,
} from "~/components/admin/ui";
import type { ProductRow } from "~/lib/admin-api";
import type { ProductTier } from "~/types/product";
import styles from "./products.module.scss";

/**
 * Товары: только наши поля.
 *
 * Характеристики и наличие сюда не выведены и выведены не будут: их
 * перезаписывает импорт из выгрузки поставщика. Правка, которая живёт
 * до следующей выгрузки, хуже отсутствия правки — заказчик поменяет
 * значение, через неделю оно вернётся, и доверие к админке пропадёт целиком.
 * Поэтому поставщиковые значения показаны, но только для чтения.
 *
 * Цена — исключение, и не по недосмотру: её перевели на нашу сторону
 * (`scripts/make-seed.ts` больше её не перезаписывает). Мастер ставит свои
 * цены, а цена поставщика служит лишь отправной точкой при первом появлении
 * товара. Отсюда же и изменение цен пачкой: при полусотне позиций поднять
 * их по одной — полсотни правок ради одного решения.
 *
 * Список — плитками, форма — в панели справа. Полсотни развёрнутых форм
 * подряд занимали шесть экранов прокрутки, из которых работают с одной;
 * плитками весь каталог виден сразу, а место под правку берётся тогда,
 * когда правка нужна.
 *
 * Отбор — тот же, что на витрине (`~/lib/product-filter`), плюс два условия
 * для своих: показ на сайте и «без описания».
 */

const TIERS: { value: ProductTier; label: string }[] = [
  { value: "budget", label: "Бюджет" },
  { value: "optimum", label: "Оптимум" },
  { value: "premium", label: "Премиум" },
];

const TYPES: Record<string, string> = {
  split: "Сплит",
  "multi-split": "Мульти-сплит",
  mobile: "Мобильный",
  "semi-industrial": "Полупромышленный",
};

const TIER_LABELS: Record<ProductTier, string> = {
  budget: "Бюджет",
  optimum: "Оптимум",
  premium: "Премиум",
};

/** Плитка в списке. Ничего не редактирует — только показывает и открывает. */
function ProductTile({
  product,
  onOpen,
  selected,
  onSelect,
}: {
  product: ProductRow;
  onOpen: (product: ProductRow, trigger: HTMLElement) => void;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}) {
  const area = product.specs.areaM2;

  return (
    // Обёртка нужна ради галочки. Вложить её в саму плитку нельзя: плитка —
    // кнопка, а кнопка внутри кнопки невалидна и ломает и клавиатуру,
    // и чтение с экрана. Поэтому галочка лежит рядом и накрывает угол.
    <div className={selected ? `${styles.cell} ${styles.picked}` : styles.cell}>
      <input
        type="checkbox"
        className={styles.pick}
        checked={selected}
        aria-label={`Выбрать ${product.name}`}
        onChange={(e) => onSelect(product.id, e.target.checked)}
      />

      <button
        type="button"
        className={
          product.is_published ? styles.tile : `${styles.tile} ${styles.dimmed}`
        }
        onClick={(e) => onOpen(product, e.currentTarget)}
      >
        <span className={styles.thumb}>
          {product.image ? (
            <img src={product.image} alt="" loading="lazy" />
          ) : (
            <span className={styles.noPhoto} aria-hidden />
          )}

          {/* Метки поверх снимка: в плитке нет места на отдельную строку,
            а знать, что товар скрыт или отмечен хитом, нужно сразу. */}
          <span className={styles.marks}>
            {product.featured && (
              <span className={styles.mark} title="Хит">
                <Star aria-hidden />
              </span>
            )}
            {!product.is_published && (
              <span
                className={`${styles.mark} ${styles.markOff}`}
                title="Скрыт на сайте"
              >
                <EyeOff aria-hidden />
              </span>
            )}
          </span>
        </span>

        <span className={styles.tileName}>{product.name}</span>

        <span className={styles.tileMeta}>
          {product.price} р.
          {area ? ` · до ${area} м²` : ""}
        </span>

        <span className={styles.tileTier}>{TIER_LABELS[product.tier]}</span>
      </button>
    </div>
  );
}

/**
 * Изменение цен у выбранных товаров на процент.
 *
 * Показывается только когда что-то выбрано: кнопка «поднять всё» без выбора
 * слишком легко нажимается мимо, а откатить нечем — старых цен нигде
 * не остаётся.
 *
 * В два шага: сперва пересчёт с показом чисел, потом применение. Человек
 * соглашается на результат («975 станет 1073»), а не на формулу: округление
 * иначе он увидел бы уже постфактум, на полусотне товаров сразу.
 */
function BulkPrices({
  products,
  onApplied,
  onClear,
}: {
  products: ProductRow[];
  onApplied: (rows: { id: string; price: number }[]) => void;
  onClear: () => void;
}) {
  const [percent, setPercent] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  const pct = Number(percent);
  const valid =
    percent.trim() !== "" && Number.isFinite(pct) && pct !== 0 && pct > -100;

  // Округление до рубля, а не до десятков: десятки выглядят опрятнее,
  // но тогда «плюс 10%» перестаёт быть десятью процентами, и на вопрос
  // «почему 1080, а не 1073» ответить нечем.
  const next = useMemo(
    () =>
      valid
        ? products.map((p) => ({
            id: p.id,
            name: p.name,
            from: p.price,
            price: Math.max(0, Math.round(p.price * (1 + pct / 100))),
          }))
        : [],
    [products, pct, valid],
  );

  // Товары, у которых цена не сдвинулась (копеечные при малом проценте),
  // в запрос не идут: лишний запрос, который ничего не меняет.
  const changed = next.filter((n) => n.price !== n.from);

  async function apply() {
    setBusy(true);
    setError(null);
    const res = await updateProductPrices(
      changed.map(({ id, price }) => ({ id, price })),
    );
    setBusy(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }
    onApplied(changed.map(({ id, price }) => ({ id, price })));
    setDone(res.data ?? changed.length);
    setConfirming(false);
    setPercent("");
  }

  return (
    <div className={styles.bulk}>
      <div className={styles.bulkMain}>
        <b className={styles.bulkCount}>Выбрано {products.length}</b>

        <label className={styles.bulkField}>
          Изменить цену на
          <Input
            type="number"
            step={1}
            inputMode="numeric"
            className={styles.bulkInput}
            value={percent}
            placeholder="10"
            aria-label="Процент изменения цены"
            onChange={(e) => {
              setPercent(e.target.value);
              setConfirming(false);
              setDone(0);
            }}
          />
          %
        </label>

        {/* Минус допустим: снижать цены нужно не реже, чем поднимать,
            а отдельная кнопка «снизить» — это второй путь к тому же. */}
        <Button small disabled={!valid} onClick={() => setConfirming(true)}>
          Пересчитать
        </Button>

        <Button small variant="ghost" onClick={onClear}>
          Снять выбор
        </Button>
      </div>

      {done > 0 && (
        <p className={styles.bulkDone}>Цены изменены у {done} товаров.</p>
      )}

      {confirming && (
        <div className={styles.bulkConfirm}>
          {changed.length === 0 ? (
            <p>При таком проценте ни одна цена не изменится.</p>
          ) : (
            <>
              <p>
                {pct > 0 ? "Поднять" : "Снизить"} цену на {Math.abs(pct)}% у{" "}
                <b>{changed.length}</b> товаров. Например:
              </p>
              <ul className={styles.bulkPreview}>
                {changed.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    <span>{n.name}</span>
                    <b>
                      {n.from} → {n.price} р.
                    </b>
                  </li>
                ))}
              </ul>
              <div className={styles.bulkActions}>
                <Button small busy={busy} onClick={apply}>
                  {busy ? "Меняю…" : "Применить"}
                </Button>
                <Button
                  small
                  variant="ghost"
                  onClick={() => setConfirming(false)}
                >
                  Отмена
                </Button>
              </div>
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Форма товара внутри панели.
 *
 * Отдельный компонент с ключом по id: поля хранят своё состояние, и без
 * пересоздания при смене товара в них остался бы текст предыдущего.
 */
function ProductEditor({
  product,
  onPatch,
}: {
  product: ProductRow;
  onPatch: (id: string, fields: Partial<ProductRow>) => void;
}) {
  const { save, saveNow, saved, error } = useSave();
  const [description, setDescription] = useState(product.description);
  // Строкой, а не числом: поле должно переживать промежуточно пустое
  // состояние, когда старое число стёрли, а новое ещё не набрали.
  const [price, setPrice] = useState(String(product.price));

  const area = product.specs.areaM2;

  return (
    <>
      <div className={styles.supplier}>
        {product.image ? (
          <img
            className={styles.supplierPhoto}
            src={product.image}
            alt=""
            width={72}
            height={72}
          />
        ) : (
          <span
            className={`${styles.supplierPhoto} ${styles.noPhoto}`}
            aria-hidden
          />
        )}

        <dl className={styles.facts}>
          <div>
            <dt>Тип</dt>
            <dd>{TYPES[product.type] ?? product.type}</dd>
          </div>
          <div>
            <dt>Площадь</dt>
            <dd>{area ? `до ${area} м²` : "не указана"}</dd>
          </div>
        </dl>
      </div>

      <p className={styles.locked}>
        Эти поля приходят из выгрузки поставщика и перезаписываются при каждом
        импорте — здесь они только для справки.
      </p>

      {/* Цена — наша, а не поставщика. Повторный сид её больше не
          перезаписывает (см. scripts/make-seed.ts), поэтому правка здесь
          держится, а не живёт до следующего импорта. */}
      <Field
        label="Цена, р."
        hint="Показывается в каталоге и на странице товара"
      >
        <Input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            const raw = e.target.value;
            setPrice(raw);

            // Пустое поле не сохраняем: Number("") — это ноль, и товар молча
            // стал бы бесплатным, пока человек стирает старое число,
            // чтобы набрать новое.
            if (raw.trim() === "") return;
            const next = Number(raw);
            if (!Number.isInteger(next) || next < 0) return;

            onPatch(product.id, { price: next });
            save(() => updateProduct(product.id, { price: next }));
          }}
        />
      </Field>

      <Field label="Описание" hint="Показывается на странице товара и в поиске">
        <Textarea
          rows={6}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            save(() =>
              updateProduct(product.id, { description: e.target.value }),
            );
          }}
        />
      </Field>

      {/* Порядка в списке здесь нет намеренно: колонка sort_order осталась
          и по-прежнему задаёт очерёдность в каталоге, но заполняет её
          импорт. Поле, в котором номера расставляют вручную по одному,
          на полусотне товаров означает полсотни правок ради одной
          перестановки — и первый же импорт их сбросит. */}
      <Field label="Уровень">
        <Select
          value={product.tier}
          onChange={(e) => {
            const tier = e.target.value as ProductTier;
            onPatch(product.id, { tier });
            saveNow(() => updateProduct(product.id, { tier }));
          }}
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className={styles.flags}>
        <Check
          checked={product.featured}
          label="Хит"
          hint="Показывается на главной, в подборке лучших"
          onChange={(featured) => {
            onPatch(product.id, { featured });
            saveNow(() => updateProduct(product.id, { featured }));
          }}
        />

        <Check
          checked={product.is_published}
          label="Показывать на сайте"
          hint="Снятая галочка убирает товар из каталога при следующей сборке"
          onChange={(is_published) => {
            onPatch(product.id, { is_published });
            saveNow(() => updateProduct(product.id, { is_published }));
          }}
        />
      </div>

      {error && <p className={styles.error}>{error.message}</p>}

      <p className={styles.savedLine}>
        <Saved show={saved} />
      </p>
    </>
  );
}

export default function ProductsPage() {
  const load = useCallback(() => listProducts(), []);
  const { rows, loading, refreshing, error, refresh, patch } =
    useRows<ProductRow>(load);

  // Условия в адресе страницы, как на витрине: «назад» возвращает прежний
  // отбор, а ссылку на «все скрытые без описания» можно просто сохранить
  // в закладках и открывать как рабочий список.
  const [params, setParams] = useSearchParams();

  const drawer = useDrawer<string>();
  // Карточка, с которой открыли панель: туда возвращается фокус после
  // закрытия. Иначе Tab после Escape начинается с начала страницы.
  const trigger = useRef<HTMLElement | null>(null);

  // Открыта ли панель на узком экране. Это про показ, а не про отбор,
  // и в адресе ему делать нечего.
  const [openOnMobile, setOpenOnMobile] = useState(false);

  // Выбранные товары — для изменения цен пачкой. В состоянии страницы,
  // а не в адресе: выбор живёт минуту и делиться ссылкой на него незачем,
  // а полсотни идентификаторов в строке адреса сделали бы её нечитаемой.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggleSelected = useCallback((id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Границы — по всему каталогу, а не по отфильтрованному: иначе шкала
  // цены съезжала бы от каждого движения ползунка, и вернуть её обратно
  // было бы уже нечем.
  const bounds = useMemo(() => getBounds(rows), [rows]);

  const values: AdminFilterValues = {
    area: Number(params.get("area")) || bounds.areaMin,
    priceFrom: Number(params.get("pmin")) || bounds.priceMin,
    priceTo: Number(params.get("pmax")) || bounds.priceMax,
    type: params.get("type") ?? "",
    visibility: params.get("vis") ?? "",
    noDescription: params.get("nodesc") === "1",
  };

  /**
   * Условия для общего кода витрины. Шум, компрессор и Wi-Fi здесь всегда
   * выключены: по ним выбирает покупатель, а заказчику они не нужны —
   * панель без них короче на треть. Передаём нейтральные значения, а не
   * вырезаем условия из общей функции: витрине они нужны, и развилка
   * внутри неё стоила бы дороже трёх констант здесь.
   */
  const shared: ProductFilterValues = {
    area: values.area,
    priceFrom: values.priceFrom,
    priceTo: values.priceTo,
    noise: null,
    comp: null,
    wifi: false,
  };

  const search = params.get("q") ?? "";
  const sort = params.get("sort") ?? "";

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();

    // Сначала своё — поиск, тип, показ, описание, — потом общие правила
    // витрины. Порядок ради скорости не важен (полсотни строк), важен
    // ради чтения: здесь видно, чем админка отличается от сайта.
    const mine = rows.filter((p) => {
      if (values.type && p.type !== values.type) return false;
      if (values.visibility === "on" && !p.is_published) return false;
      if (values.visibility === "off" && p.is_published) return false;
      if (values.noDescription && p.description.trim()) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.model.toLowerCase().includes(needle)
      );
    });

    return applySort(applyFilters(mine, shared, bounds), sort);
    // Зависимости значениями, а не объектом values: тот пересоздаётся
    // на каждом рендере, и useMemo не давал бы ничего.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rows,
    bounds,
    search,
    sort,
    values.type,
    values.visibility,
    values.noDescription,
    values.area,
    values.priceFrom,
    values.priceTo,
  ]);

  // Товар берём из списка по id, а не запоминаем строку: правка идёт через
  // patch, и сохранённая копия разошлась бы с плиткой за спиной панели.
  const editing = drawer.value
    ? (rows.find((p) => p.id === drawer.value) ?? null)
    : null;

  const hidden = rows.filter((p) => !p.is_published).length;
  const filtered = shown.length !== rows.length;

  // Счётчик на кнопке «Фильтры»: общие условия плюс свои.
  const activeCount =
    countActive(shared, bounds) +
    (values.type ? 1 : 0) +
    (values.visibility ? 1 : 0) +
    (values.noDescription ? 1 : 0);

  function update(patchParams: Record<string, number | string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patchParams)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    // replace, чтобы каждое движение фильтра не засоряло историю браузера.
    setParams(next, { replace: true, preventScrollReset: true });
  }

  /** Сброс не трогает поиск и сортировку: это не условия отбора. */
  function reset() {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (sort) next.set("sort", sort);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return (
    <>
      <PageHead
        title="Товары"
        text="Описание и уровень ведутся здесь. Цена, характеристики и наличие приходят из выгрузки поставщика и перезаписываются при каждом импорте."
      >
        {hidden > 0 && <Badge>{hidden} скрыто</Badge>}

        <Input
          className={styles.search}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          value={search}
          onChange={(e) => update({ q: e.target.value || null })}
        />

        <Select
          aria-label="Сортировка"
          value={sort}
          onChange={(e) => update({ sort: e.target.value || null })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Button variant="ghost" small busy={refreshing} onClick={refresh}>
          <RefreshCw aria-hidden />
          {refreshing ? "Обновляю…" : "Обновить"}
        </Button>
      </PageHead>

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
            <X size={17} aria-hidden />
          ) : (
            <SlidersHorizontal size={17} aria-hidden />
          )}
          Фильтры
          {activeCount > 0 && (
            <span className={styles.toggleCount}>{activeCount}</span>
          )}
        </button>

        <aside
          className={
            openOnMobile ? `${styles.side} ${styles.open}` : styles.side
          }
        >
          <ProductFilters
            bounds={bounds}
            values={values}
            types={TYPES}
            activeCount={activeCount}
            onChange={update}
            onReset={reset}
          />
        </aside>

        <div className={styles.main}>
          <State
            loading={loading}
            error={error}
            empty={shown.length === 0}
            emptyText="Под эти условия ничего не нашлось."
          >
            {/* Сколько показано из скольких: с включённым фильтром длина
                списка перестаёт что-либо говорить о каталоге, и легко
                решить, что половина товаров пропала. */}
            <p className={styles.count} aria-live="polite">
              {filtered
                ? `Показано ${shown.length} из ${rows.length}`
                : `${rows.length} товаров`}
            </p>

            {/* Липкая полоса действий. Выбирают, прокручивая список, и без
                прилипания кнопка «Пересчитать» осталась бы где-то вверху,
                за пределами экрана. */}
            {selected.size > 0 && (
              <BulkPrices
                products={rows.filter((p) => selected.has(p.id))}
                onClear={() => setSelected(new Set())}
                onApplied={(updated) => {
                  // Обновляем строки на месте, а не перезагружаем список:
                  // перезагрузка сбросила бы прокрутку к началу, и человек
                  // потерял бы место, где выбирал.
                  for (const { id, price } of updated) patch(id, { price });
                  setSelected(new Set());
                }}
              />
            )}

            <div className={styles.grid}>
              {shown.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  selected={selected.has(product.id)}
                  onSelect={toggleSelected}
                  onOpen={(p, el) => {
                    trigger.current = el;
                    drawer.show(p.id);
                  }}
                />
              ))}
            </div>
          </State>
        </div>
      </div>

      {editing && (
        <Drawer
          open={drawer.open}
          onClose={drawer.hide}
          onExited={drawer.forget}
          restoreTo={trigger}
          title={editing.name}
          subtitle={`${editing.brand} ${editing.model}`.trim()}
          footer={
            <>
              {/* Только у опубликованных: у скрытых страницы на сайте нет,
                  и ссылка вела бы на «страница не найдена». */}
              {editing.is_published && (
                <a
                  className={styles.siteLink}
                  href={`/product/${editing.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink aria-hidden />
                  Открыть на сайте
                </a>
              )}

              <Button small className={styles.done} onClick={drawer.hide}>
                Готово
              </Button>
            </>
          }
        >
          {/* Ключ по id: поля формы держат своё состояние, и без пересоздания
              при переходе к другому товару в них остался бы прежний текст. */}
          <ProductEditor key={editing.id} product={editing} onPatch={patch} />
        </Drawer>
      )}
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Товары — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
