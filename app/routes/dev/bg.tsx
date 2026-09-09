import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import styles from "./bg.module.scss";

/**
 * Витрина фоновых решений. Временная страница — удаляется вместе с папкой
 * `routes/dev`.
 *
 * Каждый вариант — кусок страницы целиком: заголовок, текст, три карточки
 * и тёмная панель. Фон нельзя оценивать пустым: вопрос в том, как на нём
 * читается содержимое, а не какой он сам по себе.
 *
 * Палитра холодная. У образца пастельная сине-розовая, но розовый под
 * кондиционеры — подражание; воздух и прохлада просят синего, ледяного
 * и лавандового.
 */

export function meta() {
  return [
    { title: "Фоны — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "now",
    name: "Плоский фон и фигуры",
    tag: "как сейчас",
    why: "Ровный #f8faff плюс четыре бледные фигуры с параллаксом. Спокойно, но действительно бело: фигуры на 12–17% почти не видны, и страница читается одним полотном.",
  },
  {
    key: "sections",
    name: "Градиент в каждой секции",
    why: "У каждой секции свой мягкий градиент, соседние отличаются оттенком. Ближе всего к образцу. Риск в том, что при семи секциях подряд это начинает пестрить — градиенты должны быть очень слабыми.",
  },
  {
    key: "page",
    name: "Один градиент на всю страницу",
    why: "Одна большая диагональная заливка сверху вниз, секции прозрачные. Страница читается цельной, переходы между блоками не рвут фон. Самый безопасный способ уйти от белого.",
  },
  {
    key: "bloom",
    name: "Световые ореолы",
    why: "Радиальные пятна света в углах секций — то, что в образце даёт ощущение подсветки. Не заливка, а свечение: фон остаётся светлым, но перестаёт быть плоским.",
  },
  {
    key: "wave",
    name: "Волнистые переходы",
    why: "Секции с тонированным фоном разделены дугой, а не прямой линией. Самый заметный приём образца. Требует аккуратности: волна съедает вертикальное место и на телефоне становится почти прямой.",
  },
  {
    key: "mix",
    name: "Градиент страницы и ореолы",
    why: "Общая диагональная заливка плюс два ореола в ключевых местах. Сочетание третьего и четвёртого: цельный фон и подсветка там, где нужен акцент.",
  },
  {
    key: "glass",
    name: "Стекло на градиенте",
    why: "Градиент на всю страницу, а карточки полупрозрачные с размытием — сквозь них виден фон. Это и есть то, что даёт ощущение «сайт пропитан цветом»: белые непрозрачные карточки на градиенте его закрывают, стеклянные пропускают.",
  },
  {
    key: "volume",
    name: "Стекло и объёмные фигуры",
    why: "То же плюс стеклянные сферы с бликом и тенью вместо плоских пятен. Именно они дают «заполненность» в образцах: у плоской фигуры нет глубины, у сферы есть — и страница перестаёт быть листом.",
  },
] as const;

function Demo({ variant }: { variant: string }) {
  return (
    <div className={[styles.demo, styles[variant]].join(" ")}>
      {variant === "volume" && (
        <>
          <span className={`${styles.sphere} ${styles.s1}`} aria-hidden />
          <span className={`${styles.sphere} ${styles.s2}`} aria-hidden />
          <span className={`${styles.sphere} ${styles.s3}`} aria-hidden />
        </>
      )}
      <div className={styles.block}>
        <span className={styles.eyebrow}>Готовые решения</span>
        <h3 className={styles.h}>Кондиционер для спальни до 20 м²</h3>
        <p className={styles.p}>
          В спальне кондиционер выбирают не по мощности, а по тишине. Мощности
          на 20 м² хватит почти любой модели.
        </p>
        <div className={styles.cards}>
          {["Спальня", "Гостиная", "Офис"].map((t) => (
            <div key={t} className={styles.card}>
              <b>{t}</b>
              <span>до 20 м²</span>
              <span className={styles.price}>от 975 р.</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.blockAlt}>
        <div className={styles.dark}>
          <b>Замер и консультация бесплатно</b>
          <span>
            Назовите площадь и этаж — посчитаю мощность и стоимость под ключ.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DevBg() {
  return (
    <main>
      <PageHeader
        title="Фон страницы: восемь решений"
        lead="Один и тот же кусок страницы на разных фонах. Смотреть нужно на то, как читается содержимое, а не на сам фон."
        crumbs={[{ label: "Фоны" }]}
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
              <Demo variant={v.key} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
