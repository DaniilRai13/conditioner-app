import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import styles from "./palette.module.scss";

/**
 * Десять палитр на одном и том же куске интерфейса.
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Ничего не перерисовывается: токены переопределяются инлайном на обёртке,
 * а внутри стоят настоящие компоненты сайта — кнопки, карточка, тёмный блок
 * с дугой. Поэтому видно именно то, что получится, а не приблизительный
 * образ палитры на квадратиках.
 *
 * Все десять проверены на контраст: белый на кнопке, ссылка на фоне,
 * подписи на подложках — везде не ниже 4.5:1. Палитра, которая не проходит
 * этот порог, здесь бы просто не появилась.
 */

export function meta() {
  return [
    { title: "Палитры — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

type Palette = {
  key: string;
  name: string;
  why: string;
  risk: string;
  brand600: string;
  brand700: string;
  brand50: string;
  ink900: string;
  ink600: string;
  ink400: string;
  bg: string;
  bgAlt: string;
  border: string;
  accent: string;
  deep900: string;
  deep700: string;
};

const PALETTES: Palette[] = [
  {
    key: "now",
    name: "Как сейчас",
    why: "Эталон для сравнения. Чистый синий 230°, всё остальное — тот же оттенок разной светлоты.",
    risk: "Ровно так выглядит половина сайтов услуг: синяя кнопка на почти белом фоне ничего не сообщает о ремесле.",
    brand600: "#3b5bfe", brand700: "#2f49d8", brand50: "#eef2ff",
    ink900: "#0f172a", ink600: "#475569", ink400: "#5b6b82",
    bg: "#f8faff", bgAlt: "#e6ecfb", border: "#e0e6f2",
    accent: "#49527e", deep900: "#262c47", deep700: "#3a4268",
  },
  {
    key: "calm",
    name: "Спокойный синий",
    why: "Тот же строй, но синий сбавил насыщенность с 99% до 76%. Кнопка перестаёт быть самым ярким пятном экрана и начинает читаться как элемент интерфейса, а не как реклама.",
    risk: "Изменение осторожное: со стороны выглядит как «то же самое, только тише». Если хочется, чтобы сайт запомнился, этого мало.",
    brand600: "#2563eb", brand700: "#1d4ed8", brand50: "#eff4ff",
    ink900: "#111827", ink600: "#4b5563", ink400: "#5f6b7d",
    bg: "#f7f9fc", bgAlt: "#e6ecf7", border: "#dde4ef",
    accent: "#3f4d6b", deep900: "#1f2637", deep700: "#33405c",
  },
  {
    key: "ultra",
    name: "Ультрамарин",
    why: "Синий уходит вглубь: тёмная кнопка, густой тёмный блок, холодные почти-белые фоны. Читается дороже и серьёзнее нынешнего — так выглядят сайты инженерных компаний, а не маркетплейсов.",
    risk: "Тёмная кнопка меньше «зовёт нажать», чем светлая яркая. На конверсию это влияет в обе стороны, проверяется только цифрами.",
    brand600: "#1d4ed8", brand700: "#1739a8", brand50: "#eaf0ff",
    ink900: "#0b1020", ink600: "#3f4a63", ink400: "#57627a",
    bg: "#f6f8fd", bgAlt: "#e3eaf9", border: "#d7e0f2",
    accent: "#28356b", deep900: "#131a38", deep700: "#22307a",
  },
  {
    key: "sea",
    name: "Морская волна",
    why: "Единственный оттенок, который сам по себе значит «холод»: сине-зелёный. Для торговца холодом это не украшение, а сообщение — и в нише кондиционеров он почти не занят, все сидят на синем.",
    risk: "Бирюза легко скатывается в «медицинский центр». Держится на том, что она приглушённая и тёмная, а не курортная.",
    brand600: "#0f766e", brand700: "#0b5a54", brand50: "#e8f6f4",
    ink900: "#0d1b1a", ink600: "#3f5250", ink400: "#546a67",
    bg: "#f6faf9", bgAlt: "#dceeeb", border: "#cfe4e0",
    accent: "#1f4e4a", deep900: "#0e2a2a", deep700: "#175c58",
  },
  {
    key: "mint",
    name: "Мята и графит",
    why: "Тот же холод, но с уклоном в голубой, а чернила — нейтральный графит без синевы. Свежо и при этом спокойно: цвет есть только там, где нужно действие.",
    risk: "Между «свежо» и «пусто» тонкая грань. На страницах с малым количеством цветных элементов может выглядеть недоделанным.",
    brand600: "#0e7490", brand700: "#0b586e", brand50: "#e6f4f9",
    ink900: "#111827", ink600: "#44515f", ink400: "#5a6773",
    bg: "#f6fafb", bgAlt: "#ddeef4", border: "#cfe3ea",
    accent: "#274653", deep900: "#12242c", deep700: "#1d4756",
  },
  {
    key: "amber",
    name: "Индиго и янтарь",
    why: "Первая палитра с двумя цветами вместо одного. Индиго держит интерфейс, янтарь — противоположный ему по кругу — достаётся акцентным блокам. Взгляд наконец получает, за что зацепиться.",
    risk: "Тёплый акцент придётся дозировать: два-три места на страницу. Развесь его щедрее — и сайт станет похож на распродажу.",
    brand600: "#4f46e5", brand700: "#4338ca", brand50: "#eeecfe",
    ink900: "#12122b", ink600: "#4a4a63", ink400: "#5e5e78",
    bg: "#f9f8fd", bgAlt: "#eae7f9", border: "#e0dcf2",
    accent: "#8a5a12", deep900: "#20204a", deep700: "#332f7a",
  },
  {
    key: "copper",
    name: "Сталь и медь",
    why: "Перевёрнутая логика: интерфейс нейтрально-стальной, а фирменный цвет — медь. Это цвет трубок, которые вы паяете; ремесло проговаривается палитрой, а не текстом.",
    risk: "Самый смелый вариант. Оранжево-коричневая кнопка непривычна для сайта услуг, и часть людей прочитает её как «предупреждение».",
    brand600: "#9a4a10", brand700: "#7d3a0b", brand50: "#f7eee6",
    ink900: "#161a20", ink600: "#454e5c", ink400: "#5a6472",
    bg: "#f8f9fb", bgAlt: "#e7ebf1", border: "#dbe1e9",
    accent: "#39434f", deep900: "#1a1f27", deep700: "#333d4a",
  },
  {
    key: "lime",
    name: "Графит и лайм",
    why: "Нейтральный серый корпус и травяной акцент. Так выглядят сервисные компании, которые хотят сказать «мы про работу, а не про офис». Зелёный к тому же читается как «исправно, готово».",
    risk: "Зелёная кнопка в вебе прочно значит «успех» или «оплатить». На неё жмут по привычке, и это не всегда тот клик, который вам нужен.",
    brand600: "#4d7c0f", brand700: "#3d640c", brand50: "#eef6e3",
    ink900: "#14181c", ink600: "#464e56", ink400: "#5b646d",
    bg: "#f8f9fa", bgAlt: "#e9ecee", border: "#dfe3e6",
    accent: "#2f3a33", deep900: "#181d1a", deep700: "#2c3a2c",
  },
  {
    key: "warm",
    name: "Тёплый нейтральный",
    why: "Синий на месте, а вот серые заменены на тёплые: фон уходит в бумагу, чернила в кофе. Сайт перестаёт выглядеть техническим и становится ближе к человеку, который приедет домой.",
    risk: "Тёплый фон вы уже отклоняли. Здесь он мягче прошлого (#faf9f7 против #f5f1ea), но направление то же — если оно не нравится в принципе, вариант мимо.",
    brand600: "#2f5fd8", brand700: "#254bab", brand50: "#eaf0fd",
    ink900: "#1c1917", ink600: "#57534e", ink400: "#6b635c",
    bg: "#faf9f7", bgAlt: "#efece7", border: "#e4e0d9",
    accent: "#413c36", deep900: "#221f1c", deep700: "#3b352f",
  },
  {
    key: "mono",
    name: "Почти монохром",
    why: "Фирменного цвета нет вовсе: кнопки почти чёрные, всё держится на типографике и контрасте. Самый строгий и самый «дорогой» вид — и единственный, который точно не похож на соседей по нише.",
    risk: "Прощает только безупречную вёрстку: цвету нечем прикрыть кривой отступ. И акцентировать нечем — выделять важное придётся размером и весом.",
    brand600: "#1f2937", brand700: "#111827", brand50: "#eef0f3",
    ink900: "#0b0f14", ink600: "#414b57", ink400: "#59636f",
    bg: "#f7f8f9", bgAlt: "#e9ebee", border: "#dfe2e6",
    accent: "#2b3440", deep900: "#12161c", deep700: "#28313d",
  },
];

/** Переопределение токенов на обёртке — внутри работают обычные компоненты. */
function vars(p: Palette): CSSProperties {
  return {
    "--brand-600": p.brand600,
    "--brand-700": p.brand700,
    "--brand-50": p.brand50,
    "--ink-900": p.ink900,
    "--ink-600": p.ink600,
    "--ink-400": p.ink400,
    "--bg": p.bg,
    "--bg-alt": p.bgAlt,
    "--border": p.border,
    "--surface-accent": p.accent,
    "--deep-900": p.deep900,
    "--deep-700": p.deep700,
    "--decor": p.brand600,
  } as CSSProperties;
}

const SWATCHES: [keyof Palette, string][] = [
  ["brand600", "кнопка"],
  ["accent", "акцент"],
  ["deep900", "тёмный"],
  ["ink900", "заголовок"],
  ["bgAlt", "подложка"],
  ["bg", "фон"],
];

function Demo({ p }: { p: Palette }) {
  return (
    <div className={styles.demo} style={vars(p)}>
      {/* Тёмная шапка — та же, что на всех страницах: градиент и дуга. */}
      <div className={styles.dark}>
        <div className={styles.darkInner}>
          <div className={styles.darkText}>
            <span className={styles.kicker}>Подбор за 4 вопроса</span>
            <b className={styles.h}>Установка кондиционеров в Минске</b>
            <p className={styles.p}>
              Подберу, привезу и поставлю. Работаю один — без посредников.
            </p>
          </div>
          <AcUnit className={styles.ac} />
        </div>
      </div>

      {/* Светлая часть: карточка, кнопки, ссылка, подложка, акцентный блок. */}
      <div className={styles.light}>
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.tag}>Хит</span>
            <b className={styles.cardTitle}>Electrolux Monaco</b>
            <span className={styles.spec}>до 20 м² · 2.2 кВт · 19 дБ</span>
            <span className={styles.price}>1 900 р.</span>
          </div>

          <div className={styles.alt}>
            <b className={styles.altTitle}>Что входит в монтаж</b>
            <ul className={styles.checks}>
              <li>
                <Check size={16} aria-hidden />
                Трасса до 3 метров
              </li>
              <li>
                <Check size={16} aria-hidden />
                Вакуумирование
              </li>
              <li>
                <Check size={16} aria-hidden />
                Пусконаладка
              </li>
            </ul>
          </div>

          <div className={styles.accent}>
            <b>Замер бесплатно</b>
            <span>Назовите площадь и этаж — посчитаю стоимость.</span>
          </div>
        </div>

        <div className={styles.row}>
          <Button size="md">Оставить заявку</Button>
          <Button size="md" variant="secondary">
            Смотреть каталог
          </Button>
          <a className={styles.link} href="#0">
            Все характеристики
          </a>
          <span className={styles.note}>Подпись мелким кеглем</span>
        </div>
      </div>
    </div>
  );
}

export default function DevPalette() {
  return (
    <main>
      <PageHeader
        title="Десять палитр"
        lead="Один и тот же кусок сайта в десяти наборах цветов. Компоненты настоящие — меняются только токены, поэтому видно результат, а не образ."
        crumbs={[{ label: "Палитры" }]}
      />

      <Section
        title="Что не так с нынешней"
        lead="Коротко, подробности — в ответе к этой странице."
      >
        <ul className={styles.findings}>
          <li>
            <b>Один оттенок на весь сайт.</b> Все двенадцать цветных токенов
            лежат в диапазоне 215–231° — это шестнадцать градусов цветового
            круга. Акцентировать нечем: любое «важное» приходится показывать
            той же синевой, что и всё остальное.
          </li>
          <li>
            <b>Кнопка — самое яркое пятно экрана.</b> Насыщенность синего 99%
            при том, что остальное почти обесцвечено. Отсюда ощущение,
            что цвет на сайте «приклеен», а не заложен.
          </li>
          <li>
            <b>Четыре почти одинаковых светлых.</b> Фон, подложка, рамка
            и светлый брендовый различаются на 2–13% яркости. Рамка на
            подложке физически неразличима — она там не работает.
          </li>
          <li>
            <b>Нет служебных цветов.</b> Ошибка формы задана прямо в стилях
            компонента (#fca5a5), успеха нет вовсе. При первой же новой форме
            красный разъедется.
          </li>
        </ul>
      </Section>

      <Section>
        <div className={styles.list}>
          {PALETTES.map((p, i) => (
            <section key={p.key} className={styles.item}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.name}>{p.name}</h2>
                <ul className={styles.swatches}>
                  {SWATCHES.map(([k, label]) => (
                    <li key={k} title={`${label}: ${p[k]}`}>
                      <span style={{ background: p[k] as string }} />
                      <small>{p[k] as string}</small>
                    </li>
                  ))}
                </ul>
              </div>

              <p className={styles.why}>{p.why}</p>
              <p className={styles.risk}>
                <b>Риск.</b> {p.risk}
              </p>

              <Demo p={p} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
