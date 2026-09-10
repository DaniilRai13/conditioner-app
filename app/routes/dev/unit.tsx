import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { advantages } from "~/data/advantages";
import { QUIZ_QUESTIONS } from "~/lib/quiz";
import styles from "./unit.module.scss";

/**
 * Пять раскладок hero с нарисованным блоком.
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Задача не «куда воткнуть картинку», а как ужиться двум объектам:
 * панель подбора уже занимает правую колонку и уходить оттуда не должна —
 * это главное действие страницы. Поэтому варианты отличаются тем, какую
 * роль получает блок: фон, сосед, отдельная колонка, мелкая деталь
 * или, в последнем случае, снова главный предмет вместо панели.
 */

export function meta() {
  return [
    { title: "Кондиционер в hero — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "behind",
    name: "Позади панели",
    why: "Блок крупный, по центру правой колонки, панель подбора лежит поверх него стеклом. Поток проходит за панелью и выходит снизу. Предмет читается, но внимание остаётся на панели.",
    adaptive:
      "Ниже 1024 блок остаётся за панелью, но ужимается: панель во всю ширину, он выглядывает сверху. Ниже 640 скрыт — за панелью его всё равно не видно.",
  },
  {
    key: "above",
    name: "Над панелью",
    why: "Блок сверху, панель под ним. Поток «дует» прямо на панель и обрезается ею — получается, что подбор стоит в струе холодного воздуха. Самая понятная связь между предметом и действием.",
    adaptive:
      "Одна колонка ниже 1024: блок остаётся над панелью, только уже. Ниже 480 блок уменьшается ещё, чтобы первый экран не превратился в одну картинку.",
  },
  {
    key: "column",
    name: "Своя колонка",
    why: "Три колонки: текст, панель, узкая полоса с блоком у правого края. Никто никого не перекрывает, у каждого своё место. Требует ширины — на ноутбуке колонки становятся тесными.",
    adaptive:
      "Ниже 1280 третья колонка исчезает вместе с блоком: втискивать её в 1024 значит сплющить и текст, и панель.",
  },
  {
    key: "corner",
    name: "Деталь в углу",
    why: "Блок небольшой, прижат к верхнему правому углу секции, поток спускается вдоль края за панель. Не спорит ни с чем, добавляет глубины и намекает на предмет, не занимая места.",
    adaptive:
      "Держится до 640: он маленький и место находит везде. Ниже — скрыт, там каждый пиксель ширины нужен тексту.",
  },
  {
    key: "object",
    name: "Предмет вместо панели",
    why: "Панели в hero нет, справа только блок — крупно, с дышащим потоком. Квиз возвращается второй секцией. Первый экран становится спокойнее, но действие с него уходит.",
    adaptive:
      "Ниже 1024 блок уезжает под кнопки во всю ширину, ниже 480 скрыт — там его место занимает полоса преимуществ.",
  },
] as const;

function Copy() {
  return (
    <div className={styles.content}>
      <p className={styles.kicker}>Подбор за 4 вопроса</p>
      <h3 className={styles.title}>
        Продажа и установка кондиционеров в Минске и области
      </h3>
      <p className={styles.lead}>
        Не знаете, какой нужен? Ответьте на четыре вопроса — покажу три модели
        под ваше помещение. Без звонка и без телефона.
      </p>
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

function Panel() {
  const first = QUIZ_QUESTIONS[0];
  return (
    <div className={styles.panel}>
      <span className={styles.panelLabel}>
        Шаг 1 из {QUIZ_QUESTIONS.length}
      </span>
      <b className={styles.question}>{first.title}</b>
      <div className={styles.options}>
        {first.options.map((o) => (
          <Link
            key={o.value}
            to={`/?${first.key}=${o.value}#quiz`}
            className={styles.option}
          >
            <span className={styles.optionLabel}>{o.label}</span>
            {o.hint && <span className={styles.optionHint}>{o.hint}</span>}
            <ArrowRight size={16} className={styles.optionArrow} aria-hidden />
          </Link>
        ))}
      </div>
      <p className={styles.panelNote}>
        В конце — три модели с ценами. Телефон не спрашиваю.
      </p>
    </div>
  );
}

function Strip() {
  return (
    <ul className={styles.list}>
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

function Demo({ variant }: { variant: string }) {
  const withPanel = variant !== "object";

  return (
    <div className={`${styles.demo} ${styles[variant]}`}>
      <div className={styles.grid}>
        <Copy />

        {/* Правая часть: у всех вариантов, кроме последнего, здесь
            и блок, и панель — различия в CSS, а не в разметке. */}
        <div className={styles.side}>
          <AcUnit className={styles.ac} breathing={!withPanel} />
          {withPanel && <Panel />}
        </div>
      </div>

      <Strip />
    </div>
  );
}

export default function DevUnit() {
  return (
    <main>
      <PageHeader
        title="Кондиционер в hero"
        lead="Блок нарисован фигурами и масштабируется сам — внутри у него ни одного медиазапроса. Пять раскладок отличаются тем, какую роль он получает рядом с панелью подбора."
        crumbs={[{ label: "Кондиционер" }]}
      />

      <Section>
        <div className={styles.showcase}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.item}>
              <div className={styles.vhead}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.vname}>{v.name}</h2>
              </div>
              <p className={styles.why}>{v.why}</p>
              <p className={styles.adaptive}>
                <b>Адаптив.</b> {v.adaptive}
              </p>

              <Demo variant={v.key} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
