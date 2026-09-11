import { useState, type CSSProperties } from "react";
import styles from "./Bars.module.scss";

export interface BarPoint {
  /** Ключ и подпись по оси, `YYYY-MM-DD`. */
  day: string;
  value: number;
  /** Строка под значением во всплывающей подписи. */
  detail: string;
}

/**
 * График по дням — обычными элементами, а не SVG и не библиотекой.
 *
 * Столбик — единственная фигура, которую HTML рисует сам, а строка flex
 * перестраивается на любой ширине, не масштабируя текст внутри viewBox.
 * Библиотека графиков весит больше всего остального раздела и умеет
 * три десятка типов диаграмм, из которых нужен один.
 *
 * Одна величина на график. Посещения и заявки отличаются на два порядка,
 * и вторая ось ради того, чтобы уместить их вместе, — худшее, что может
 * сделать диаграмма: два столбика рядом читаются как сравнимые, хотя один
 * из них в сто раз меньше. Поэтому это два графика.
 */
export function Bars({
  points,
  color,
  label,
  empty,
}: {
  points: BarPoint[];
  /** Цвет — свойство графика, а не легенды: величина здесь всегда одна. */
  color: string;
  label: string;
  empty: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className={styles.empty}>{empty}</p>;
  }

  // Столбики сравнивают друг с другом, поэтому шкала всегда от нуля.
  // Небольшой запас сверху не даёт самому высокому упереться в линию.
  const peak = Math.max(...points.map((p) => p.value), 1);
  const scale = peak * 1.1;

  const active = hovered === null ? null : points[hovered];
  const activeLeft = hovered === null ? 0 : ((hovered + 0.5) / points.length) * 100;

  return (
    <div className={styles.chart} style={{ "--bar": color } as CSSProperties}>
      <div className={styles.plot}>
        {/* Две линии вместо полной сетки: хватает, чтобы оценить высоту,
            и достаточно тихо, чтобы остаться позади данных. */}
        <span className={styles.rule} style={{ bottom: "100%" }} aria-hidden />
        <span className={styles.rule} style={{ bottom: "50%" }} aria-hidden />
        <span className={styles.peak} aria-hidden>
          {peak}
        </span>

        <ol className={styles.bars}>
          {points.map((point, index) => (
            <li
              key={point.day}
              className={styles.slot}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className={styles.bar}
                style={{ height: `${(point.value / scale) * 100}%` }}
              />
              {/* Значение для скринридера: столбик высотой в проценты
                  ему ничего не говорит. */}
              <span className={styles.sr}>
                {dayLabel(point.day)}: {point.value} {label}
              </span>
            </li>
          ))}
        </ol>

        {active && (
          <span
            className={styles.tip}
            style={{ left: `${activeLeft}%` }}
            aria-hidden
          >
            <b>
              {active.value} {label}
            </b>
            {dayLabel(active.day)} · {active.detail}
          </span>
        )}
      </div>

      {/* Подписи только по краям: на тридцати днях все тридцат дат
          слипаются в серую полосу. */}
      <div className={styles.axis} aria-hidden>
        <span>{dayLabel(points[0].day)}</span>
        <span>{dayLabel(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}

const dayLabel = (day: string) => {
  const [, month, date] = day.split("-");
  return `${Number(date)}.${Number(month)}`;
};

/** Все даты периода, старые слева, как `YYYY-MM-DD`. */
export function eachDay(days: number): string[] {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}
