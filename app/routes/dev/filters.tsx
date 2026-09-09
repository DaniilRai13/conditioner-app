import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import styles from "./filters.module.scss";

/**
 * Витрина блоков фильтрации каталога. Временная страница — удаляется вместе
 * с папкой `routes/dev`.
 *
 * Каждый вариант — панель целиком, со всеми элементами: площадь, цена,
 * дополнительные условия, сортировка, сброс и строка результата. Сравнивать
 * половинки бессмысленно: вопрос в том, как они уживаются вместе.
 *
 * Числа настоящие, из products.json: площадь 18–160 м², цена 960–8880 р.,
 * шум 19–54.8 дБ, инверторных 26 из 50, с Wi-Fi 21.
 */

export function meta() {
  return [
    { title: "Фильтры — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const SORTS = [
  "По умолчанию",
  "Сначала дешевле",
  "Сначала дороже",
  "Сначала мощнее",
  "Сначала тише",
];

const AREA_CHIPS = [20, 25, 35, 50, 70, 100];
const NOISE_CHIPS = ["тише 25 дБ", "тише 30 дБ", "тише 40 дБ"];
const TYPE_CHIPS = ["инвертор", "обычный"];

/** Подпись над группой. */
function Label({ children }: { children: string }) {
  return <span className={styles.label}>{children}</span>;
}

function Chips({
  options,
  value,
  onChange,
  suffix,
}: {
  options: (string | number)[];
  value: string | number | null;
  onChange: (v: string | number | null) => void;
  suffix?: string;
}) {
  return (
    <div className={styles.chips}>
      <button
        type="button"
        className={value === null ? `${styles.chip} ${styles.on}` : styles.chip}
        onClick={() => onChange(null)}
      >
        любая
      </button>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={value === o ? `${styles.chip} ${styles.on}` : styles.chip}
          onClick={() => onChange(value === o ? null : o)}
        >
          {typeof o === "number" ? `от ${o}${suffix ?? ""}` : o}
        </button>
      ))}
    </div>
  );
}

function NumField({
  value,
  onChange,
  unit,
  placeholder,
  wide,
  label,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  unit?: string;
  placeholder?: string;
  wide?: boolean;
  label: string;
}) {
  return (
    <span className={wide ? styles.entryWide : styles.entry}>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
      />
      {unit && <span className={styles.unit}>{unit}</span>}
    </span>
  );
}

function Sort() {
  return (
    <select className={styles.select} aria-label="Сортировка">
      {SORTS.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}

function Count({ n = 15 }: { n?: number }) {
  return (
    <p className={styles.count}>
      Найдено <b>{n}</b> из 50
    </p>
  );
}

/** Ползунок площади с числовым полем рядом. */
function AreaSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.group}>
      <div className={styles.groupHead}>
        <Label>Площадь помещения</Label>
        <NumField
          value={value}
          onChange={(v) => onChange(Number(v) || 15)}
          unit="м²"
          label="Площадь помещения"
        />
      </div>
      <input
        className={styles.slider}
        type="range"
        min={15}
        max={160}
        step={5}
        value={value}
        aria-label="Площадь помещения, ползунок"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className={styles.marks}>
        <span>15 м²</span>
        <span>160 м²</span>
      </div>
    </div>
  );
}

function PriceFields() {
  const [from, setFrom] = useState<number | "">("");
  const [to, setTo] = useState<number | "">("");
  return (
    <div className={styles.group}>
      <Label>Цена, р.</Label>
      <div className={styles.pair}>
        <NumField
          value={from}
          onChange={setFrom}
          placeholder="900"
          label="Цена от"
        />
        <NumField
          value={to}
          onChange={setTo}
          placeholder="8900"
          label="Цена до"
        />
      </div>
    </div>
  );
}

const VARIANTS = [
  {
    key: "now",
    name: "Ползунок и поля",
    tag: "как сейчас",
    why: "Площадь ползунком, цена двумя полями, сортировка справа. Работает, но поле площади оформлено как подпись — не видно, что в него можно писать. И половина данных о товаре не используется вовсе.",
  },
  {
    key: "fields",
    name: "Только поля ввода",
    why: "Ни ползунков, ни чипов — четыре числовых поля с рамками. Самый предсказуемый вариант: всё вводится одинаково, ничего не нужно объяснять. Скучно, зато никто не запутается.",
  },
  {
    key: "rich",
    name: "Полный набор условий",
    why: "Площадь, цена, шум, тип компрессора, Wi-Fi. Использует то, что у нас уже есть в данных: шум заполнен у 49 моделей, инвертор делит каталог почти пополам. Панель становится выше — это цена за возможность реально сузить выдачу.",
  },
  {
    key: "ask",
    name: "Вопрос, остальное свёрнуто",
    why: "Крупное поле «Какая у вас площадь?» и кнопка «Ещё условия». Совпадает с логикой всего сайта: квиз спрашивает, готовые решения спрашивают — а каталог до сих пор предлагает крутить регуляторы.",
  },
  {
    key: "side",
    name: "Боковая панель",
    why: "Фильтры колонкой слева, товары справа. Классика каталогов: условия всегда на виду, менять их можно не прокручивая. Забирает четверть ширины у карточек — на четырёх колонках это заметно.",
  },
  {
    key: "dropdowns",
    name: "Строка выпадающих кнопок",
    why: "Каждое условие — кнопка, раскрывающая свой набор. Панель занимает одну строку при любом числе фильтров, и добавить восьмой не страшно. Минус: значения спрятаны, видно только выбранное.",
  },
  {
    key: "sticky",
    name: "Компактная липкая строка",
    why: "Свёрнуто в строку: сколько найдено, сортировка, кнопка «Фильтры» со счётчиком активных. При прокрутке остаётся сверху. Управление всегда под рукой и почти не занимает экран.",
  },
] as const;

function Panel({ variant }: { variant: string }) {
  const [area, setArea] = useState(70);
  const [areaChip, setAreaChip] = useState<string | number | null>(null);
  const [noise, setNoise] = useState<string | number | null>(null);
  const [type, setType] = useState<string | number | null>(null);
  const [open, setOpen] = useState(false);

  if (variant === "now") {
    return (
      <>
        <div className={styles.panel}>
          <AreaSlider value={area} onChange={setArea} />
          <PriceFields />
          <div className={styles.group}>
            <Label>Сортировка</Label>
            <Sort />
          </div>
          <button type="button" className={styles.clear}>
            Сбросить
          </button>
        </div>
        <Count />
      </>
    );
  }

  if (variant === "fields") {
    return (
      <>
        <div className={styles.panel}>
          <div className={styles.group}>
            <Label>Площадь от</Label>
            <NumField
              value={""}
              onChange={() => {}}
              unit="м²"
              placeholder="24"
              label="Площадь от"
            />
          </div>
          <PriceFields />
          <div className={styles.group}>
            <Label>Шум не выше</Label>
            <NumField
              value={""}
              onChange={() => {}}
              unit="дБ"
              placeholder="30"
              label="Шум не выше"
            />
          </div>
          <div className={styles.group}>
            <Label>Сортировка</Label>
            <Sort />
          </div>
        </div>
        <Count />
      </>
    );
  }

  if (variant === "rich") {
    return (
      <>
        <div className={styles.panelTall}>
          <AreaSlider value={area} onChange={setArea} />
          <PriceFields />
          <div className={styles.group}>
            <Label>Уровень шума</Label>
            <Chips options={NOISE_CHIPS} value={noise} onChange={setNoise} />
          </div>
          <div className={styles.group}>
            <Label>Компрессор</Label>
            <Chips options={TYPE_CHIPS} value={type} onChange={setType} />
          </div>
          <div className={styles.groupWide}>
            <label className={styles.check}>
              <input type="checkbox" />
              Только с Wi-Fi <span className={styles.dim}>21 модель</span>
            </label>
            <div className={styles.spacer} />
            <Sort />
            <button type="button" className={styles.clear}>
              Сбросить
            </button>
          </div>
        </div>
        <Count />
      </>
    );
  }

  if (variant === "ask") {
    return (
      <>
        <div className={styles.ask}>
          <label className={styles.askLabel} htmlFor="ask-area">
            Какая у вас площадь?
          </label>
          <div className={styles.askRow}>
            <NumField
              value={""}
              onChange={() => {}}
              unit="м²"
              placeholder="24"
              wide
              label="Площадь помещения"
            />
            <button
              type="button"
              className={styles.askMore}
              onClick={() => setOpen(!open)}
            >
              <SlidersHorizontal size={16} aria-hidden />
              Ещё условия
            </button>
            <Sort />
          </div>
          <span className={styles.askHint}>
            Покажу модели, которые её тянут. Не знаете точно — возьмите площадь
            комнаты по полу.
          </span>

          {open && (
            <div className={styles.askExtra}>
              <PriceFields />
              <div className={styles.group}>
                <Label>Уровень шума</Label>
                <Chips
                  options={NOISE_CHIPS}
                  value={noise}
                  onChange={setNoise}
                />
              </div>
              <div className={styles.group}>
                <Label>Компрессор</Label>
                <Chips options={TYPE_CHIPS} value={type} onChange={setType} />
              </div>
            </div>
          )}
        </div>
        <Count />
      </>
    );
  }

  if (variant === "side") {
    return (
      <div className={styles.side}>
        <aside className={styles.sideBar}>
          <div className={styles.sideHead}>
            <b>Фильтры</b>
            <button type="button" className={styles.clear}>
              Сбросить
            </button>
          </div>
          <AreaSlider value={area} onChange={setArea} />
          <PriceFields />
          <div className={styles.group}>
            <Label>Уровень шума</Label>
            <Chips options={NOISE_CHIPS} value={noise} onChange={setNoise} />
          </div>
          <div className={styles.group}>
            <Label>Компрессор</Label>
            <Chips options={TYPE_CHIPS} value={type} onChange={setType} />
          </div>
        </aside>

        <div className={styles.sideMain}>
          <div className={styles.sideTop}>
            <Count />
            <Sort />
          </div>
          <div className={styles.fakeGrid}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.fakeCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dropdowns") {
    return (
      <>
        <div className={styles.row}>
          <div className={styles.dropWrap}>
            <button
              type="button"
              className={open ? `${styles.drop} ${styles.dropOn}` : styles.drop}
              onClick={() => setOpen(!open)}
            >
              Площадь{areaChip ? `: от ${areaChip} м²` : ""}
              <span className={styles.caret} aria-hidden>
                ▾
              </span>
            </button>
            {open && (
              <div className={styles.dropPanel}>
                <Chips
                  options={AREA_CHIPS}
                  value={areaChip}
                  onChange={(v) => {
                    setAreaChip(v);
                    setOpen(false);
                  }}
                  suffix=" м²"
                />
              </div>
            )}
          </div>

          <button type="button" className={styles.drop}>
            Цена <span className={styles.caret}>▾</span>
          </button>
          <button type="button" className={styles.drop}>
            Шум <span className={styles.caret}>▾</span>
          </button>
          <button type="button" className={styles.drop}>
            Компрессор <span className={styles.caret}>▾</span>
          </button>
          <div className={styles.spacer} />
          <Sort />
        </div>
        <Count />
      </>
    );
  }

  // sticky
  return (
    <>
      <div className={styles.bar}>
        <span className={styles.barCount}>
          Найдено <b>15</b> из 50
        </span>
        <div className={styles.spacer} />
        <Sort />
        <button
          type="button"
          className={styles.barBtn}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={16} aria-hidden />
          ) : (
            <SlidersHorizontal size={16} aria-hidden />
          )}
          Фильтры
          <span className={styles.badge}>2</span>
        </button>
      </div>

      {open && (
        <div className={styles.panelTall}>
          <AreaSlider value={area} onChange={setArea} />
          <PriceFields />
          <div className={styles.group}>
            <Label>Уровень шума</Label>
            <Chips options={NOISE_CHIPS} value={noise} onChange={setNoise} />
          </div>
          <div className={styles.group}>
            <Label>Компрессор</Label>
            <Chips options={TYPE_CHIPS} value={type} onChange={setType} />
          </div>
        </div>
      )}

      <p className={styles.note}>
        Строка прилипает к верху при прокрутке. Нажмите «Фильтры», чтобы
        раскрыть панель.
      </p>
    </>
  );
}

export default function DevFilters() {
  return (
    <main>
      <PageHeader
        title="Фильтры каталога: семь блоков"
        lead="Каждый вариант — панель целиком. Числа настоящие, из данных каталога."
        crumbs={[{ label: "Фильтры" }]}
      />

      <Section>
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.variant}>
              <div className={styles.vhead}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.vname}>{v.name}</h2>
                {"tag" in v && <span className={styles.tag}>{v.tag}</span>}
              </div>
              <p className={styles.why}>{v.why}</p>
              <div className={styles.stage}>
                <Panel variant={v.key} />
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
