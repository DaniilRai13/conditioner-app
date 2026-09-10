import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { site } from "~/config/site";
import styles from "./og.module.scss";

/**
 * Обложки для соцсетей, 1200×630 — то, что видно, когда ссылку кидают
 * в Telegram или Viber. Временная страница: сами картинки статические,
 * страница нужна только чтобы их снять.
 *
 * Почему страница, а не скрипт: нарисовать текст в PNG из Node нечем —
 * нужен растеризатор шрифта, а его в проекте нет и тащить ради пяти
 * картинок незачем. Браузер это умеет и рисует ровно теми же шрифтами
 * и цветами, что и сайт, — расхождения между обложкой и страницей
 * не будет по построению.
 *
 * Оформление выбрано из шести вариантов, которые здесь стояли до этого:
 * нарисованный блок вместо стоковой фотографии. В превью карточка видна
 * размером с ноготь, и белый предмет на светлом фоне там превращается
 * в пятно, а фигуры остаются собой на любом размере. Тот же компонент
 * AcUnit стоит и в hero — обложка и сайт не разъедутся.
 *
 * Как снять: девтулзы → правый клик по элементу карточки в дереве →
 * Capture node screenshot. Файл сохранить в public/og/ под именем
 * из подписи. Размер выйдет ровно 1200×630 при масштабе страницы 100%.
 */

export function meta() {
  return [
    { title: "Обложки для соцсетей — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const CARDS = [
  {
    file: "default.png",
    kicker: site.region,
    title: "Установка кондиционеров",
    note: "Подбор · доставка · монтаж · сервис",
  },
  {
    file: "catalog.png",
    kicker: "Каталог",
    title: "Кондиционеры с установкой",
    note: "Сплит · мульти-сплит · мобильные · полупромышленные",
  },
  {
    file: "solutions.png",
    kicker: "Готовые решения",
    title: "Подбор по площади комнаты",
    note: "Спальня · гостиная · студия · офис",
  },
  {
    file: "price.png",
    kicker: "Цены",
    title: "Сколько стоит установка",
    note: "Оборудование и монтаж без скрытых доплат",
  },
  {
    file: "articles.png",
    kicker: "Полезное",
    title: "Как выбрать кондиционер",
    note: "Разбираю без маркетинга",
  },
];

type Card = (typeof CARDS)[number];

function Cover({ card }: { card: Card }) {
  return (
    <div className={styles.card}>
      <AcUnit className={styles.ac} />

      <div className={styles.body}>
        <span className={styles.kicker}>{card.kicker}</span>
        <b className={styles.title}>{card.title}</b>
        <span className={styles.note}>{card.note}</span>
      </div>

      <span className={styles.brand}>{site.name}</span>
    </div>
  );
}

export default function DevOg() {
  return (
    <main>
      <PageHeader
        title="Обложки для соцсетей"
        lead="Пять готовых карточек 1200×630. Снять через девтулзы: правый клик по элементу → Capture node screenshot, сохранить в public/og/ под подписанным именем."
        crumbs={[{ label: "Обложки" }]}
      />

      <Section>
        <div className={styles.list}>
          {CARDS.map((c) => (
            <figure key={c.file} className={styles.item}>
              <div className={styles.frame}>
                <Cover card={c} />
              </div>

              {/* Превью в натуральную величину миниатюры в переписке:
                  главный тест, который эти карточки обязаны пройти. */}
              <figcaption className={styles.caption}>
                <div className={styles.thumb}>
                  <Cover card={c} />
                </div>
                <span>
                  <b>public/og/{c.file}</b>
                  <small>так это видно в переписке</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </main>
  );
}
