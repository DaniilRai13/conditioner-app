import type { ReactNode } from "react";
import { Snowflake, Flame, Wifi, Volume2 } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { getProductBySlug } from "~/lib/queries";
import { formatPrice, formatArea, formatKw } from "~/lib/format";
import { PRICE_MODE } from "~/config/pricing";
import card from "~/components/catalog/ProductCard/ProductCard.module.scss";
import styles from "./marks.module.scss";

/**
 * Восемь способов пометить на карточке, что модель умеет греть.
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Карточка здесь не нарисована заново: подключён настоящий
 * ProductCard.module.scss, и разметка повторяет настоящий компонент
 * один в один. Иначе сравнивались бы восемь вариантов похожей карточки,
 * а не восемь меток на той, что стоит в каталоге.
 *
 * Сам ProductCard не тронут: пока вариант не выбран, городить в рабочем
 * компоненте восемь режимов незачем.
 *
 * Каждый вариант показан на трёх товарах: греющем, только холодящем
 * и трудном — у того занят угол снимка и нет числа в данных. Смотреть
 * надо на второй и третий: на удобном примере хороша любая метка.
 */

export function meta() {
  return [
    { title: "Метки холода и тепла — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** Что нужно карточке от товара. Полный Product тут избыточен. */
type Demo = {
  slug: string;
  brand: string;
  model: string;
  name: string;
  image: string | null;
  price: number;
  areaM2?: number;
  coolingKw?: number;
  noiseDb?: number;
  hasWifi?: boolean;
  isInverter?: boolean;
  /** Греет ли вообще. Нижней границы у части моделей нет, мощность есть. */
  heats: boolean;
  /** Нижняя граница обогрева. Есть у 41 товара из 50. */
  minHeatTemp?: number;
};

/** Куда вариант вставляет метку. Пустые места вариант просто не заполняет. */
type Slots = {
  /** Поверх снимка, рядом с «Под заказ». */
  onMedia?: ReactNode;
  /** Строкой в списке характеристик. */
  inSpecs?: ReactNode;
  /** В подвале, рядом с ценой и тегом «Инвертор». */
  inFooter?: ReactNode;
  /** Полоса над карточкой. */
  topBar?: ReactNode;
};

type Variant = {
  key: string;
  name: string;
  why: string;
  risk: string;
  slots: (p: Demo) => Slots;
};

/** Подпись нижней границы: «−15 °C» с настоящим минусом, а не дефисом. */
function temp(p: Demo): string {
  return p.minHeatTemp !== undefined
    ? `${String(p.minHeatTemp).replace("-", "−")} °C`
    : "";
}

const VARIANTS: Variant[] = [
  {
    key: "pills",
    name: "Две пилюли в подвале",
    why: "Самое прямое решение: к тегу «Инвертор» добавляются ещё две того же вида — синий «Холод» и янтарный «Тепло». Ничего нового изобретать не нужно, элемент на карточке уже есть, меняется только их количество.",
    risk: "Подвал занят ценой, и три пилюли в ряд на карточке шириной 273 точки не помещаются — они переносятся на вторую строку, и карточка растёт. В сетке это заметят все карточки, а не только те, что греют.",
    slots: (p) => ({
      inFooter: (
        <span className={styles.marks}>
          <span className={styles.cold}>Холод</span>
          {p.heats && <span className={styles.hot}>Тепло</span>}
          {p.isInverter && <span className={card.tag}>Инвертор</span>}
        </span>
      ),
    }),
  },
  {
    key: "split",
    name: "Сдвоенная метка",
    why: "Одна вещь вместо двух: пилюля из двух половин, синяя и янтарная. Читается как одно свойство модели — «умеет и то, и другое», — а не как два независимых ярлыка. У мобильных остаётся одна половина, и разница видна с одного взгляда.",
    risk: "Половинка без пары выглядит обрезанной: у мобильного кондиционера метка смотрится так, будто вторая часть не догрузилась. Лечится скруглением с обеих сторон, но тогда пропадает та самая узнаваемость формы.",
    slots: (p) => ({
      inFooter: (
        <span className={styles.marks}>
          <span className={p.heats ? styles.pair : styles.pairOne}>
            <span className={styles.pairCold}>Холод</span>
            {p.heats && <span className={styles.pairHot}>Тепло</span>}
          </span>
          {p.isInverter && <span className={card.tag}>Инвертор</span>}
        </span>
      ),
    }),
  },
  {
    key: "icons",
    name: "Только значки",
    why: "Снежинка и пламя без слов. Занимают вчетверо меньше места, чем пилюли, поэтому влезают в подвал рядом с «Инвертором» без переноса. Оба знака общеизвестны — они нарисованы на любом пульте.",
    risk: "Значок без подписи объясняет себя только тому, кто уже знает. Человек, который впервые выбирает кондиционер, может прочитать пламя как «греется» или «опасно», а не «умеет греть».",
    slots: (p) => ({
      inFooter: (
        <span className={styles.marks}>
          <span className={styles.glyphs}>
            <Snowflake size={16} className={styles.glyphCold} aria-hidden />
            <span className={styles.srOnly}>охлаждение</span>
            {p.heats && (
              <>
                <Flame size={16} className={styles.glyphHot} aria-hidden />
                <span className={styles.srOnly}>обогрев</span>
              </>
            )}
          </span>
          {p.isInverter && <span className={card.tag}>Инвертор</span>}
        </span>
      ),
    }),
  },
  {
    key: "temp",
    name: "Только тепло, и с числом",
    why: "Холод не помечается вовсе: холодят все пятьдесят моделей, и синяя метка на каждой карточке не сообщает ничего. Помечается только то, что отличает, — и сразу числом: «греет до −15 °C». Нижняя граница есть у 41 товара из 50.",
    risk: "Подвал тут тот же, что и в первом варианте: пилюля с числом шире тега, цена ломается на две строки, «Инвертор» уезжает на третью. Плюс у двух моделей из сорока трёх числа в данных нет, и метка у них становится безликим «греет» — на витрине окажется два вида метки вместо одного.",
    slots: (p) => ({
      inFooter: (
        <span className={styles.marks}>
          {p.heats && (
            <span className={styles.hot}>
              <Flame size={13} aria-hidden />
              {p.minHeatTemp !== undefined ? `греет до ${temp(p)}` : "греет"}
            </span>
          )}
          {p.isInverter && <span className={card.tag}>Инвертор</span>}
        </span>
      ),
    }),
  },
  {
    key: "media",
    name: "На снимке",
    why: "Метки уезжают в правый верхний угол снимка. Подвал не трогается вовсе, высота карточки не меняется ни на точку, а в сетке цветные углы читаются как столбец меток.",
    risk: "Левый верхний угол уже занят меткой «Под заказ». Два угла с плашками — это уже не акцент, а рамка, и снимок начинает выглядеть как товар с наклейками.",
    slots: (p) => ({
      onMedia: (
        <span className={styles.corner}>
          <span className={styles.cold}>Холод</span>
          {p.heats && <span className={styles.hot}>Тепло</span>}
        </span>
      ),
    }),
  },
  {
    key: "bar",
    name: "Полоса сверху",
    why: "Метки нет вообще. Над карточкой идёт полоса в четыре точки: наполовину синяя, наполовину янтарная у тех, кто умеет оба, целиком синяя у мобильных. Приём уже живёт на сайте — так устроены плитки решений. Ноль лишних слов и ноль высоты.",
    risk: "Полоса ничего не называет. Догадаться, что синее — холод, а янтарное — тепло, можно только по остальному сайту, и то не сразу. Это метка для того, кто уже листает десятую карточку, а не для первой.",
    slots: (p) => ({
      topBar: (
        <span className={p.heats ? styles.barBoth : styles.barCold} aria-hidden />
      ),
    }),
  },
  {
    key: "specs",
    name: "Строкой в характеристиках",
    why: "Тоже без отдельной метки: в списке характеристик появляется ещё строка — янтарное пламя и «обогрев до −15 °C», рядом с синей снежинкой площади. Ничего на карточку не вешается, работает то, что уже есть, и цвет попадает туда же, где он уже введён на странице товара.",
    risk: "Список характеристик — это то, что читают последним. Метка, ради которой всё затевалось, перестаёт быть меткой: она больше не видна одним взглядом по сетке, а находится чтением.",
    slots: (p) => ({
      inSpecs: p.heats ? (
        <li className={styles.specHot}>
          <Flame size={14} aria-hidden />
          {p.minHeatTemp !== undefined
            ? `обогрев до ${temp(p)}`
            : "с обогревом"}
        </li>
      ) : null,
    }),
  },
  {
    key: "corner",
    name: "Одна метка в углу снимка",
    why: "Собрано из того, что выдержало проверку остальных шести. Метка одна: холодят все пятьдесят моделей, и синяя не отличает ничего — помечается только тепло, и сразу числом. Стоит она в правом верхнем углу снимка, куда не дотягивается подвал: цена и «Инвертор» остаются на своей строке, высота карточки не меняется ни на точку. А плашка поверх снимка на сайте уже есть и работает — «Под заказ» лежит на товаре у 28 карточек из 50, и ни разу это не мешало.",
    risk: "Остаётся одно, и это не поломка, а цена решения: карточка без янтарного угла означает «только холод» лишь для того, кто знает уговор. Так работает любая метка, которая помечает не всё подряд.",
    slots: (p) => ({
      onMedia: p.heats ? (
        <span className={styles.cornerOne}>
          <span className={styles.hot}>
            <Flame size={13} aria-hidden />
            {p.minHeatTemp !== undefined ? `греет до ${temp(p)}` : "греет"}
          </span>
        </span>
      ) : null,
    }),
  },
];

/**
 * Копия карточки каталога со слотами под метку.
 *
 * Классы — из настоящего ProductCard.module.scss, поэтому отступы, кегли
 * и пропорции здесь ровно те же, что на витрине. Своё тут только то,
 * что вставляется в слоты.
 */
function Card({ p, v }: { p: Demo; v: Variant }) {
  const slots = v.slots(p);

  return (
    <div className={styles.slot}>
      {slots.topBar}
      <a
        href={`/product/${p.slug}`}
        className={`${card.card} ${card.mediaSquare}`}
      >
        <div className={card.media}>
          {p.image ? (
            <img
              className={card.image}
              src={p.image}
              alt={p.name}
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={card.noImage} aria-hidden />
          )}
          <span className={card.badge}>Под заказ</span>
          {slots.onMedia}
        </div>

        <span className={card.body}>
          <span className={card.brand}>{p.brand}</span>
          <b className={card.model}>{p.model || p.name}</b>

          <ul className={card.specs}>
            {p.areaM2 && (
              <li>
                <Snowflake size={14} aria-hidden />
                {formatArea(p.areaM2)}
                {p.coolingKw ? ` · ${formatKw(p.coolingKw)}` : ""}
              </li>
            )}
            {slots.inSpecs}
            {p.noiseDb && (
              <li>
                <Volume2 size={14} aria-hidden />
                от {p.noiseDb} дБ
              </li>
            )}
            {p.hasWifi && (
              <li>
                <Wifi size={14} aria-hidden />
                Wi-Fi
              </li>
            )}
          </ul>

          <span className={card.footer}>
            <span className={card.price}>
              от {formatPrice(p.price)}
              <span className={card.priceNote}>
                {PRICE_MODE === "turnkey" ? "под ключ" : "без монтажа"}
              </span>
            </span>
            {slots.inFooter ??
              (p.isInverter && <span className={card.tag}>Инвертор</span>)}
          </span>
        </span>
      </a>
    </div>
  );
}

/** Полный товар из каталога в то, что нужно карточке. */
function demo(slug: string): Demo | null {
  const p = getProductBySlug(slug);
  if (!p) return null;

  return {
    slug: p.slug,
    brand: p.brand,
    model: p.model,
    name: p.name,
    image: p.image,
    price: p.price,
    areaM2: p.specs.areaM2,
    coolingKw: p.specs.coolingKw,
    noiseDb: p.specs.noiseDb,
    hasWifi: p.specs.hasWifi,
    isInverter: p.specs.isInverter,
    heats: Boolean(p.specs.heatingKw),
    minHeatTemp: p.specs.minHeatTemp,
  };
}

export default function DevMarks() {
  const both = demo("electrolux-monaco-eacs-i-07hm-n8");
  const cold = demo("ballu-orbis-bpac-07-or-n6");
  // Трудный случай в том же ряду, чтобы вариант не проверялся только
  // на удобном снимке: угол занят товаром на 64%, а числа в данных нет.
  const hard = demo("electrolux-eacs-i-18hef-n8-wifi");

  return (
    <main>
      <PageHeader
        title="Метки холода и тепла"
        lead="Восемь способов показать на карточке каталога, что модель умеет греть. Каждый — на настоящей карточке и обязательно на двух товарах сразу."
        crumbs={[{ label: "Метки" }]}
      />

      <Section title="Что на самом деле в данных">
        <ul className={styles.facts}>
          <li>
            <b>43 модели из 50 греют и холодят.</b> Только холодят семь,
            и все семь — мобильные кондиционеры. То есть деления «эти
            охлаждают, а эти обогревают» в каталоге нет: почти всё умеет
            и то, и другое.
          </li>
          <li>
            <b>Значит, метка не выбирает, а перечисляет.</b> Синяя ИЛИ
            янтарная не получится — получится синяя И янтарная у сорока
            трёх карточек, и одна синяя у семи. Ниже это учтено во всех
            восьми вариантах, а четвёртый и восьмой прямо на этом стоят: они
            помечает только тепло, потому что холод есть у всех и ничего
            не отличает.
          </li>
          <li>
            <b>Числа хватает почти всем, кто греет.</b> Из 43 греющих
            моделей нижняя граница указана у 41 — не хватает двум, и их
            проще дописать руками в админке, чем городить запасной вид
            метки. Значения от −7 до −25 °C. У двух TCL стоит −153 °C:
            это ошибка разбора выгрузки (<code>firstNumber</code>{" "}
            в <code>normalize.ts</code> берёт первое число из склеенной
            строки), и чинить её надо до метки, а не после, — иначе
            −153 °C поедет прямо в каталог.
          </li>
          <li>
            <b>Свободного угла на снимках нет.</b> Я обмерил все
            пятьдесят фотографий по четырём углам: пустых нет ни одного.
            Верх-лево занят у 28 снимков, верх-право у 26, низ-лево
            у 40, низ-право у всех пятидесяти. Так что «поставим метку
            туда, где пусто» — не решение. Решение в том, что плашка
            с заливкой поверх товара на сайте уже стоит: «Под заказ»
            лежит на снимке у 28 карточек, и читается нормально.
          </li>
          <li>
            <b>Карточка про обогрев пока не знает ничего.</b>{" "}
            <code>toCatalog</code> в <code>queries.ts</code> отдаёт
            урезанный вид товара, и <code>heatingKw</code>
            {" с "}
            <code>minHeatTemp</code> в него не входят. Какой бы вариант
            ни выбрали, начинать придётся с того, чтобы их туда добавить.
          </li>
        </ul>
      </Section>

      <Section
        title="Восемь вариантов"
        lead="Три случая в ряд: модель, которая греет и холодит; мобильный, который только холодит; и трудный — угол снимка занят товаром на 64%, а нижней границы обогрева в данных нет. Смотреть надо на второй и третий: любая метка выглядит осмысленной на удобном примере."
      >
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.item}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.name}>{v.name}</h3>
              </div>

              <p className={styles.why}>{v.why}</p>
              <p className={styles.risk}>
                <b>Риск.</b> {v.risk}
              </p>

              <div className={styles.pair2}>
                {both && (
                  <div className={styles.case}>
                    <span className={styles.caseLabel}>греет и холодит</span>
                    <Card p={both} v={v} />
                  </div>
                )}
                {cold && (
                  <div className={styles.case}>
                    <span className={styles.caseLabel}>только холод</span>
                    <Card p={cold} v={v} />
                  </div>
                )}
                {hard && (
                  <div className={styles.case}>
                    <span className={styles.caseLabel}>
                      угол занят, числа нет
                    </span>
                    <Card p={hard} v={v} />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
