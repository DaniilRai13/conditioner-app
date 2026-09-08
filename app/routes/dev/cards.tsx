import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { solutions, areaLabel } from "~/data/solutions";
import { getSolutionPriceFrom } from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import styles from "./cards.module.scss";

/**
 * Витрина оформления карточек решений. Временная страница — удаляется
 * вместе с папкой `routes/dev`.
 *
 * Содержимое карточки везде одно и то же, из настоящих данных. Меняется
 * только то, как устроен её край и как она держит свет.
 */

export function meta() {
  return [
    { title: "Карточки — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "flat",
    name: "Рамка 1px",
    tag: "как сейчас",
    why: "Ровно один приём: тонкая линия по контуру. Карточка не отделяется от фона, потому что и белая она, и фон почти белый — граница держится на одной шестнадцатой доли контраста.",
  },
  {
    key: "shadow",
    name: "Многослойная тень без рамки",
    why: "Три тени с разным размытием вместо одной: плотная у самого края, средняя и широкая рассеянная. Так падает настоящий свет, и именно это отличает готовую вёрстку от учебной — одна тень с большим блюром выглядит наклейкой.",
  },
  {
    key: "lift",
    name: "Плоская, поднимается на наведении",
    why: "В покое ни рамки, ни тени — только фон чуть плотнее страницы. Тень появляется при наведении. Спокойно в статике и отзывчиво в работе; хорошо там, где карточек много и постоянные тени зарябили бы.",
  },
  {
    key: "split",
    name: "Двухчастная",
    why: "Шапка с названием и площадью на подложке, остальное на белом. Карточка перестаёт быть однородным прямоугольником и получает внутреннюю структуру — сразу видно, где ключ, а где подробности.",
  },
  {
    key: "ghost",
    name: "Площадь фоном",
    why: "Метраж крупной полупрозрачной цифрой за содержимым. Единственный вариант, где оформление несёт данные, а не украшает: площадь — то, по чему решение и выбирают.",
  },
  {
    key: "rule",
    name: "Колонки с разделителями",
    why: "Карточек нет вовсе, только вертикальные линии между колонками. Самый сдержанный вариант: на странице и так много рамок, и здесь их отсутствие читается как уверенность, а не как недоделка.",
  },
  {
    key: "accent",
    name: "Одна карточка акцентная",
    why: "Средняя залита индиго — тем же, что в услугах. Сетка перестаёт быть ровным рядом равнозначных плиток, а самое ходовое решение получает вес. Требует решить, какое из них рекомендуем.",
  },
] as const;

function Cards({ variant }: { variant: string }) {
  return (
    <div className={[styles.grid, styles[variant]].join(" ")}>
      {solutions.map((s, i) => {
        const price = getSolutionPriceFrom(s.areaTo, s.types);
        return (
          <Link
            key={s.slug}
            to={`/solutions/${s.slug}`}
            className={
              variant === "accent" && i === 1
                ? `${styles.card} ${styles.hot}`
                : styles.card
            }
          >
            {variant === "ghost" && (
              <span className={styles.bigArea} aria-hidden>
                {s.areaTo}
              </span>
            )}

            <span className={styles.head}>
              <b className={styles.room}>{s.room}</b>
              <span className={styles.area}>{areaLabel(s)}</span>
            </span>

            <span className={styles.bodyPart}>
              {price && (
                <span className={styles.price}>
                  от {formatPrice(price)}
                  <span className={styles.priceNote}>за оборудование</span>
                </span>
              )}
              <span className={styles.short}>{s.short}</span>
              <span className={styles.more}>
                Подробнее <ArrowRight size={16} aria-hidden />
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function DevCards() {
  return (
    <main>
      <PageHeader
        title="Карточки решений: семь вариантов"
        lead="Содержимое везде одно и то же. Меняется только то, как устроен край карточки и как она держит свет."
        crumbs={[{ label: "Карточки" }]}
      />

      <Section>
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.variant}>
              <div className={styles.vhead}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.name}>{v.name}</h2>
                {"tag" in v && <span className={styles.tag}>{v.tag}</span>}
              </div>
              <p className={styles.why}>{v.why}</p>
              <Cards variant={v.key} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
