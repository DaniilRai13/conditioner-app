import { Link } from "react-router";
import { ArrowRight, Check, Phone } from "lucide-react";
import type { Route } from "./+types/hero";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { advantages, brandPoints } from "~/data/advantages";
import { steps } from "~/data/steps";
import { solutions } from "~/data/solutions";
import { installRows } from "~/config/pricing";
import { site } from "~/config/site";
import {
  getCatalogProducts,
  getCategoriesWithCount,
  getSolutionPriceFrom,
} from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import styles from "./hero.module.scss";

/**
 * Десять полных первых экранов на тёмной шапке «Глубина».
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Прошлая витрина меняла только картинку справа, и это оказалось мелко:
 * первый экран обязан сам рассказать, о чём сайт. Поэтому здесь каждый
 * вариант — законченная композиция вокруг одной опоры сайта: каталог,
 * цены, подбор, мастер, решения, процесс, доверие. Заголовок везде один
 * (это H1, и он про поиск), меняются надзаголовок, подводка и то, что
 * стоит рядом с текстом. Цены и количества — настоящие, из данных.
 */

export function meta() {
  return [
    { title: "Hero: десять первых экранов — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export function clientLoader() {
  const products = getCatalogProducts();
  const featured = products.filter((p) => p.featured);
  const byPrice = [...products].sort((a, b) => a.price - b.price);
  return {
    total: products.length,
    // Три карточки на витрину: отмеченные, а если их нет — самые доступные.
    showcase: (featured.length >= 3 ? featured : byPrice).slice(0, 3),
    categories: getCategoriesWithCount(),
    rooms: solutions.map((s) => ({
      slug: s.slug,
      room: s.room,
      areaTo: s.areaTo,
      price: getSolutionPriceFrom(s.areaTo, s.types),
    })),
    prices: installRows.map((r) => ({
      area: r.area,
      areaTo: r.areaTo,
      price: getSolutionPriceFrom(r.areaTo, ["split"]),
    })),
    from20: getSolutionPriceFrom(20, ["split"]),
  };
}

type Data = Route.ComponentProps["loaderData"];

type Variant = {
  key: string;
  name: string;
  why: string;
  kicker: string;
  lead: string;
};

const VARIANTS: Variant[] = [
  {
    key: "hub",
    name: "Три входа",
    why: "Сайт целиком на одном экране: под заголовком и блоком — три двери, через которые на него приходят. Кто знает, что хочет, — в каталог; кто не знает — в подбор; кто считает деньги — в цены.",
    kicker: "Продажа · монтаж · сервис",
    lead: "Подберу, привезу и установлю кондиционер в квартиру, дом или офис. Работаю сам, без посредников.",
  },
  {
    key: "showcase",
    name: "Витрина",
    why: "Рядом с текстом — три настоящие модели с ценами. Продажа видна с первого взгляда, цены открыты, и это не абстрактный «каталог», а конкретные вещи, которые можно купить сегодня.",
    kicker: "Модели в наличии",
    lead: "Проверенные бренды, честные цены и монтаж в один день. Ниже — каталог, справа — то, что беру чаще всего.",
  },
  {
    key: "price",
    name: "Цена честно",
    why: "Главный вопрос человека — «сколько». Справа сразу ответ по площади комнаты, без звонка. Это самый сильный сигнал доверия, который сайт может дать за секунду.",
    kicker: "Цены открыты",
    lead: "Стоимость складывается из оборудования и монтажа. Оборудование — вот, монтаж назову после бесплатного замера.",
  },
  {
    key: "quiz",
    name: "Подбор на первом экране",
    why: "Единственный интерактив сайта — не второй секцией, а прямо здесь. Первый вопрос уже задан, ответ уводит в полный квиз. Человек начинает действовать раньше, чем дочитает.",
    kicker: "Подбор за 4 вопроса",
    lead: "Не знаете, какой нужен? Ответьте на четыре вопроса — покажу три модели под ваше помещение. Без звонка и без телефона.",
  },
  {
    key: "master",
    name: "Один мастер",
    why: "Сайт одного человека, и это его главное отличие. Фото (пока место под него) и подпись справа, а под текстом — четыре факта цифрами. Здесь продаётся не техника, а тот, кто её ставит.",
    kicker: "Работаю один — отвечаю лично",
    lead: "Сам подбираю, сам привожу и сам ставлю. Никаких менеджеров и бригад по вызову: с кем говорите — тот и приедет.",
  },
  {
    key: "rooms",
    name: "По комнатам",
    why: "Человек думает не в киловаттах, а в комнатах: «мне в спальню». Справа четыре комнаты с площадью и ценой «от» — готовые решения, каждое ведёт на свою страницу.",
    kicker: "Готовые решения",
    lead: "Выберите комнату — покажу, какая мощность нужна, что подойдёт и сколько это стоит.",
  },
  {
    key: "steps",
    name: "Как это будет",
    why: "Страх перед монтажом — «придут, разведут грязь, возьмут лишнее». Справа пять шагов от звонка до холода. Процесс понятен до того, как человек оставил контакт.",
    kicker: "От звонка до холода — пять шагов",
    lead: "Подбор, договор с фиксированной ценой, монтаж в удобный день и поддержка после. Всё — со мной напрямую.",
  },
  {
    key: "chat",
    name: "Диалог",
    why: "Вместо витрины — как выглядит обращение: вопрос клиента и мой ответ с настоящей ценой. Показывает и товар, и цену, и тон общения разом. Такого нет ни у кого из конкурентов.",
    kicker: "Так это работает",
    lead: "Опишите комнату — отвечу, что подойдёт и сколько будет стоить. Замер и консультация бесплатно.",
  },
  {
    key: "catalog",
    name: "Каталог по типам",
    why: "Для тех, кто пришёл за конкретным: сплит, мульти-сплит, мобильный, полупромышленный. Четыре типа с количеством моделей и одной фразой, для чего каждый. Кондиционер на картинке — второстепенен.",
    kicker: "Четыре типа техники",
    lead: "От сплита в спальню до полупромышленной системы в магазин. Не найдёте нужного — у поставщика 4000 моделей, привезу под заказ.",
  },
  {
    key: "trust",
    name: "Гарантии",
    why: "Справа — то, за что я отвечаю, списком, как в договоре: гарантия, смета до работ, прямая связь. Плюс телефон крупно. Для людей, которые не выбирают, а проверяют.",
    kicker: "Без посредников и мелкого шрифта",
    lead: "Смету называю до начала работ, гарантия — официальная, вопросы — напрямую мне, а не в колл-центр.",
  },
];

function Copy({ v }: { v: Variant }) {
  return (
    <div className={styles.content}>
      <p className={styles.kicker}>{v.kicker}</p>
      <h3 className={styles.title}>
        Продажа и установка кондиционеров в Минске и области
      </h3>
      <p className={styles.lead}>{v.lead}</p>
      <div className={styles.actions}>
        <Button to="/#quiz" size="lg">
          Подобрать кондиционер
        </Button>
        <Button
          to="/#lead"
          size="lg"
          variant="secondary"
          className={styles.glass}
        >
          Оставить заявку
        </Button>
      </div>
    </div>
  );
}

// Нарисованный блок вместо стоковой фотографии: та тянула за собой
// ореол от вырезания на тёмном фоне и 323 КБ в сборке.
function Unit() {
  return <AcUnit className={styles.unit} />;
}

function Advantages() {
  return (
    <ul className={styles.advantages}>
      {advantages.map((item) => (
        <li key={item.title} className={styles.advantage}>
          <IconBox name={item.icon} size="sm" tone="onBrand" />
          <span className={styles.advantageText}>
            <b>{item.title}</b>
            <span>{item.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const from = (n: number | null) => (n ? `от ${formatPrice(n)}` : "по запросу");

function Side({ variant, data }: { variant: string; data: Data }) {
  switch (variant) {
    case "hub":
    case "catalog":
      return (
        <div className={styles.side}>
          <Unit />
        </div>
      );

    case "showcase":
      return (
        <div className={styles.side}>
          <ul className={styles.stack}>
            {data.showcase.map((p) => (
              <li key={p.slug}>
                <Link to={`/product/${p.slug}`} className={styles.product}>
                  <span className={styles.productBody}>
                    <b>{p.name}</b>
                    <small>
                      {p.specs.areaM2 ? `до ${p.specs.areaM2} м²` : p.brand}
                      {p.specs.isInverter ? " · инвертор" : ""}
                    </small>
                  </span>
                  <span className={styles.productPrice}>
                    {formatPrice(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/catalog" className={styles.sideLink}>
            Весь каталог — {data.total} моделей{" "}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      );

    case "price":
      return (
        <div className={`${styles.side} ${styles.panel}`}>
          <span className={styles.panelLabel}>Сколько стоит</span>
          <dl className={styles.priceRows}>
            {data.prices.map((r) => (
              <div key={r.areaTo} className={styles.priceRow}>
                <dt>{r.area}</dt>
                <dd>{from(r.price)}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.panelNote}>
            Это оборудование. Монтаж — после замера, замер бесплатный.
          </p>
          <Link to="/price" className={styles.sideLink}>
            Что входит в монтаж <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      );

    case "quiz":
      return (
        <div className={`${styles.side} ${styles.panel}`}>
          <span className={styles.panelLabel}>Шаг 1 из 4</span>
          <b className={styles.panelTitle}>Какая площадь помещения?</b>
          <div className={styles.options}>
            {[
              ["20", "До 20 м²", "спальня, кабинет"],
              ["35", "20–35 м²", "гостиная"],
              ["50", "35–50 м²", "студия, большая комната"],
              ["70", "50–70 м²", "офис, помещение"],
            ].map(([v, label, hint]) => (
              <Link key={v} to={`/?area=${v}#quiz`} className={styles.option}>
                <span>{label}</span>
                <small>{hint}</small>
                <ArrowRight size={16} aria-hidden />
              </Link>
            ))}
          </div>
          <p className={styles.panelNote}>
            В конце — три модели с ценами. Телефон не спрашиваю.
          </p>
        </div>
      );

    case "master":
      return (
        <div className={styles.side}>
          <div className={styles.photo} aria-hidden>
            <span>Фото мастера на объекте — попросить у заказчика</span>
          </div>
          <div className={styles.caption}>
            <b>{site.name}</b>
            <span>Подбор, доставка и монтаж — один человек</span>
          </div>
        </div>
      );

    case "rooms":
      return (
        <div className={styles.side}>
          <ul className={styles.tiles}>
            {data.rooms.map((r) => (
              <li key={r.slug}>
                <Link to={`/solutions/${r.slug}`} className={styles.tile}>
                  <span className={styles.tileArea}>до {r.areaTo} м²</span>
                  <b>{r.room}</b>
                  <small>{from(r.price)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );

    case "steps":
      return (
        <div className={`${styles.side} ${styles.panel}`}>
          <ol className={styles.timeline}>
            {steps.map((s, i) => (
              <li key={s.title} className={styles.stepItem}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepText}>
                  <b>{s.title}</b>
                  <small>{s.text}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "chat":
      return (
        <div className={`${styles.side} ${styles.chat}`}>
          <p className={styles.msgIn}>
            Спальня 18 м², пятый этаж, окна на юг. Что подойдёт и сколько
            выйдет?
          </p>
          <p className={styles.msgOut}>
            Подойдёт сплит на 20–25 м², инверторный — в спальне важна тишина.
            Оборудование {from(data.from20)}, монтаж назову после замера.
            Замер бесплатный, приеду в удобное время.
          </p>
          <span className={styles.chatMeta}>
            Отвечаю сам · {site.workHours}
          </span>
        </div>
      );

    case "trust":
      return (
        <div className={`${styles.side} ${styles.panel}`}>
          <span className={styles.panelLabel}>За что отвечаю</span>
          <ul className={styles.checks}>
            {brandPoints.map((p) => (
              <li key={p.title}>
                <Check size={18} aria-hidden />
                <span>
                  <b>{p.title}</b> — {p.text}
                </span>
              </li>
            ))}
          </ul>
          <a href={site.phoneHref} className={styles.phone}>
            <Phone size={20} aria-hidden />
            {site.phone}
          </a>
          <span className={styles.panelNote}>{site.workHours}</span>
        </div>
      );

    default:
      return null;
  }
}

/** Полоса под сеткой: у двух вариантов своя, у остальных — преимущества. */
function Strip({ variant, data }: { variant: string; data: Data }) {
  if (variant === "hub") {
    const doors = [
      {
        to: "/catalog",
        title: "Каталог",
        text: `${data.total} моделей в наличии и 4000 под заказ`,
      },
      {
        to: "/#quiz",
        title: "Подбор за 4 вопроса",
        text: "Три модели под ваше помещение, без телефона",
      },
      {
        to: "/price",
        title: "Цены на монтаж",
        text: "Что входит и что оплачивается отдельно",
      },
    ];
    return (
      <ul className={styles.doors}>
        {doors.map((d) => (
          <li key={d.to}>
            <Link to={d.to} className={styles.door}>
              <b>{d.title}</b>
              <span>{d.text}</span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "master") {
    const facts = [
      ["1", "мастер — от подбора до запуска"],
      ["5 лет", "официальной гарантии"],
      ["1 день", "на монтаж в большинстве случаев"],
      ["4000", "моделей у поставщика под заказ"],
    ];
    return (
      <ul className={styles.facts}>
        {facts.map(([n, t]) => (
          <li key={t} className={styles.fact}>
            <b>{n}</b>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "catalog") {
    return (
      <ul className={styles.types}>
        {data.categories.map((c) => (
          <li key={c.slug}>
            <Link to={`/catalog/${c.slug}`} className={styles.type}>
              <b>{c.title}</b>
              <span>{c.count} моделей</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return <Advantages />;
}

export default function DevHero({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <PageHeader
        title="Hero: десять первых экранов"
        lead="Каждый вариант — законченный первый экран вокруг одной опоры сайта. Заголовок один и тот же, это H1; всё остальное меняется. Цены и количества настоящие."
        crumbs={[{ label: "Hero" }]}
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
              </div>
              <p className={styles.why}>{v.why}</p>

              <div className={`${styles.demo} ${styles[v.key]}`}>
                <div className={styles.grid}>
                  <Copy v={v} />
                  <Side variant={v.key} data={loaderData} />
                </div>
                <Strip variant={v.key} data={loaderData} />
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
