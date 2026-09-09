import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { steps } from "~/data/steps";
import styles from "./steps.module.scss";

/**
 * Витрина раскладок блока «Как я работаю». Временная страница — удаляется
 * вместе с папкой `routes/dev`.
 *
 * Пять шагов везде одни и те же, из настоящих данных. Меняется только то,
 * как между ними показана связь.
 */

export function meta() {
  return [
    { title: "Шаги — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "plain",
    name: "Пять колонок с кружками",
    tag: "как сейчас",
    why: "Номера есть, связи нет. Пять одинаковых столбиков читаются перечнем, а не процессом: глаз не понимает, что второе следует за первым, а не лежит рядом с ним.",
  },
  {
    key: "line",
    name: "Соединённая линия",
    why: "Та же раскладка, но сквозь кружки проходит линия. Минимальная правка с максимальной отдачей: перечень превращается в маршрут, и порядок шагов становится содержанием, а не случайностью вёрстки.",
  },
  {
    key: "vertical",
    name: "Вертикальный степпер",
    why: "Шаги идут сверху вниз вдоль линии. Выигрывает там, где текста больше пары строк, и — главное — одинаково выглядит на телефоне: горизонтальные раскладки там всё равно схлопываются в столбик, теряя всю придуманную связь.",
  },
  {
    key: "zigzag",
    name: "Зигзаг вдоль оси",
    why: "Шаги чередуются слева и справа от центральной линии. Приём из таймлайнов: движение читается физически, взгляд идёт змейкой. Требует места по вертикали и коротких подписей.",
  },
  {
    key: "chevron",
    name: "Шевроны между шагами",
    why: "Вместо линии — стрелки в промежутках. Направление показано буквально, без сплошной оси. Хорошо переживает разное количество шагов, но на узком экране стрелки приходится разворачивать вниз.",
  },
  {
    key: "big",
    name: "Крупные номера фоном",
    why: "Номер становится не значком, а частью карточки — крупной полупрозрачной цифрой позади текста. Тот же приём, что у метража в карточках решений, то есть блок попадает в общий язык сайта.",
  },
  {
    key: "progress",
    name: "Полоса прогресса",
    why: "Над шагами — полоса с засечками. Читается как шкала пути: видно не только порядок, но и то, что процесс конечен. Уместно там, где важно показать «это недолго».",
  },
] as const;

function Steps({ variant }: { variant: string }) {
  return (
    <div className={[styles.stage, styles[variant]].join(" ")}>
      {variant === "progress" && (
        <div className={styles.bar} aria-hidden>
          {steps.map((s) => (
            <span key={s.title} />
          ))}
        </div>
      )}

      <ol className={styles.list}>
        {steps.map((s, i) => (
          <li key={s.title} className={styles.item}>
            <span className={styles.num}>{i + 1}</span>
            <span className={styles.body}>
              <b className={styles.title}>{s.title}</b>
              <span className={styles.text}>{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function DevSteps() {
  return (
    <main>
      <PageHeader
        title="«Как я работаю»: семь раскладок"
        lead="Пять шагов везде одни и те же. Меняется то, как между ними показана связь."
        crumbs={[{ label: "Шаги" }]}
      />

      <Section>
        <div className={styles.variants}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.variant}>
              <div className={styles.vhead}>
                <span className={styles.vnum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.vname}>{v.name}</h2>
                {"tag" in v && <span className={styles.tag}>{v.tag}</span>}
              </div>
              <p className={styles.why}>{v.why}</p>
              <Steps variant={v.key} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
