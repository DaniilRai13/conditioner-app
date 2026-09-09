import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import styles from "./bg2.module.scss";

/**
 * Развитие двух фоновых идей — волны и стекла с объёмом — в серьёзной палитре.
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Пастель прежней витрины читалась детской. Здесь три направления, и все
 * строятся от утверждённого индиго #49527e: сталь (холодные серо-синие),
 * графит (тёмные с индиго) и лёд (почти монохром). Ярко-синего #3b5bfe
 * в фонах нет вовсе — он остаётся кнопкам и ссылкам.
 */

export function meta() {
  return [
    { title: "Фоны, серьёзная палитра — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    group: "Волна",
    key: "waveSteel",
    name: "Сталь",
    why: "Верхняя секция — холодный серо-синий градиент без намёка на пастель, нижняя белая, между ними дуга. Самый сдержанный из волн: цвет есть, но он читается как металл, а не как краска.",
  },
  {
    group: "Волна",
    key: "waveDeep",
    name: "Глубина",
    why: "Верх — тёмный, от графита к индиго. Белая секция выныривает из него дугой. Сильный контраст даёт странице якорь; такой блок один на страницу, не больше.",
  },
  {
    group: "Волна",
    key: "waveGlass",
    name: "Сталь и стекло",
    why: "Стальной градиент, стеклянные карточки поверх, дуга снизу. Волна и стекло вместе: переход остаётся, а карточки пропускают фон вместо того, чтобы закрывать его белым.",
  },
  {
    group: "Объём",
    key: "volSteel",
    name: "Сталь",
    why: "Серо-синий градиент, стекло, сферы графитовые — с холодным бликом, без голубого свечения. Сферы читаются как шарики из матового металла, а не как мыльные пузыри.",
  },
  {
    group: "Объём",
    key: "volDeep",
    name: "Графит",
    why: "Тёмный фон от графита к индиго, тёмное стекло, светлые сферы. Драматичный вариант: белые карточки на нём невозможны, всё содержимое становится светлым на тёмном. Годится для одной секции, не для всей страницы.",
  },
  {
    group: "Объём",
    key: "volIce",
    name: "Лёд",
    why: "Почти монохром: серебристо-серый градиент с едва заметной синевой, стекло, хромированные сферы. Самый строгий. Цвет здесь почти отсутствует, объём и материал делают всю работу.",
  },
] as const;

function Demo({ variant, dark }: { variant: string; dark: boolean }) {
  const volume = variant.startsWith("vol");
  return (
    <div
      className={[styles.demo, styles[variant], dark && styles.onDark]
        .filter(Boolean)
        .join(" ")}
    >
      {volume && (
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
          {[
            "Спальня",
            "Гостиная",
            "Квартира-студия",
            "Офис",
            "Детская",
            "Кабинет",
          ].map((t) => (
            <div key={t} className={styles.card}>
              <b>{t}</b>
              <span>до 20 м²</span>
              <span className={styles.price}>от 975 р.</span>
            </div>
          ))}
        </div>
        <span className={styles.more}>Показать ещё 12 · осталось 44</span>
      </div>

      <div className={styles.blockAlt}>
        <div className={styles.panel}>
          <b>Замер и консультация бесплатно</b>
          <span>
            Назовите площадь и этаж — посчитаю мощность и стоимость под ключ.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DevBg2() {
  let lastGroup = "";
  return (
    <main>
      <PageHeader
        title="Фон: волна и объём в серьёзной палитре"
        lead="Два выбранных направления, по три подхода на каждое. Ярко-синего в фонах нет — только сталь, графит и лёд."
        crumbs={[{ label: "Фоны" }]}
      />

      <Section>
        <div className={styles.list}>
          {VARIANTS.map((v, i) => {
            const showGroup = v.group !== lastGroup;
            lastGroup = v.group;
            const dark = v.key === "waveDeep" || v.key === "volDeep";
            return (
              <section key={v.key} className={styles.variant}>
                {showGroup && <p className={styles.group}>{v.group}</p>}
                <div className={styles.vhead}>
                  <span className={styles.num}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className={styles.vname}>{v.name}</h2>
                </div>
                <p className={styles.why}>{v.why}</p>
                <Demo variant={v.key} dark={dark} />
              </section>
            );
          })}
        </div>
      </Section>
    </main>
  );
}
