import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import styles from "./type.module.scss";

/**
 * Витрина шрифтовых пар. Временная страница — удаляется вместе с папкой
 * `routes/dev`, как витрина кнопок до неё.
 *
 * Кандидаты отобраны по одному жёсткому признаку: полноценная кириллица.
 * Половина красивых гарнитур с Google Fonts латиницей и ограничивается,
 * а у нас весь текст русский.
 */

export function meta() {
  return [
    { title: "Шрифты — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

// Грузим только с этой страницы: в основную сборку кандидаты не попадают.
export function links() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href:
        "https://fonts.googleapis.com/css2?" +
        [
          "family=Onest:wght@400;600;700;800",
          "family=Golos+Text:wght@400;600;700;900",
          "family=Unbounded:wght@400;600;700",
          "family=Oswald:wght@400;500;600;700",
          "family=Rubik:wght@400;600;700",
        ].join("&") +
        "&display=swap",
    },
  ];
}

const PAIRS = [
  {
    key: "manrope",
    name: "Manrope",
    tag: "как сейчас",
    text: "Один шрифт на всё. Аккуратный и нейтральный — ровно поэтому и не запоминается: так выглядит половина современных сайтов.",
  },
  {
    key: "onest",
    name: "Onest в заголовках + Manrope в тексте",
    text: "Onest рисовали от кириллицы, а не приделывали её потом. Заголовки чуть плотнее и характернее, текст остаётся привычным.",
  },
  {
    key: "golos",
    name: "Golos Text",
    text: "Гарнитура «Паратайпа», сделанная под русский интерфейс. Спокойная, очень разборчивая на мелком кегле — хороша там, где много текста: характеристики, статьи, договор.",
  },
  {
    key: "oswald",
    name: "Oswald в заголовках + Manrope в тексте",
    text: "Узкий гротеск. Заголовки становятся плотными и «рабочими» — как надписи на технике. Рискованный, но для монтажника попадает в тон точнее гладких геометрических.",
  },
  {
    key: "unbounded",
    name: "Unbounded в заголовках + Manrope в тексте",
    text: "Самый характерный вариант. Заголовки читаются как вывеска. Уместен, если сайт должен запоминаться сильнее, чем внушать доверие.",
  },
] as const;

export default function DevType() {
  return (
    <main>
      <PageHeader
        title="Шрифтовые пары"
        lead="Один и тот же настоящий текст сайта в пяти вариантах. У всех кандидатов полная кириллица."
        crumbs={[{ label: "Шрифты" }]}
      />

      <Section>
        <div className={styles.list}>
          {PAIRS.map((p, i) => (
            <section key={p.key} className={`${styles.pair} ${styles[p.key]}`}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.pairName}>{p.name}</h2>
                {"tag" in p && <span className={styles.tag}>{p.tag}</span>}
              </div>
              <p className={styles.why}>{p.text}</p>

              <div className={styles.sample}>
                <span className={styles.label}>Каталог · Сплит-системы</span>
                <h3 className={styles.h1}>Кондиционер для спальни до 20 м²</h3>
                <p className={styles.body}>
                  В спальне кондиционер выбирают не по мощности, а по тишине.
                  Мощности на 20 м² хватит почти любой модели, а вот шум решает,
                  будете вы спать с ним или выключать на ночь.
                </p>
                <h4 className={styles.h2}>Какая нужна мощность</h4>
                <p className={styles.body}>
                  На 20 м² при потолках до 3 метров нужно около 2 кВт холода —
                  это модели с маркировкой 07 BTU. Цена от 1 265 р.
                </p>
                <div className={styles.actions}>
                  <Button>Оставить заявку</Button>
                  <Button variant="secondary">Подобрать модель</Button>
                </div>
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
