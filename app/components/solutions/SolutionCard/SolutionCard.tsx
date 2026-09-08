import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "~/lib/format";
import styles from "./SolutionCard.module.scss";

type Props = {
  slug: string;
  room: string;
  /** Готовая подпись вида «20–35 м²». */
  area: string;
  /** Верхняя граница площади — она же крупная цифра. */
  areaTo: number;
  priceFrom: number | null;
  short: string;

  /**
   * `tile` — плитка с крупным метражом фоном и заливкой у выделенной.
   * Для превью на главной.
   *
   * `split` — двухчастная: помещение и площадь на подложке, цена и
   * описание на белом. Для страницы решений. Разный вид у превью и
   * у самой страницы нужен затем, чтобы переход между ними читался
   * как переход, а не как перезагрузка того же блока.
   */
  layout?: "tile" | "split";

  /** Залить фирменным индиго. Ровно одна карточка в списке. */
  featured?: boolean;
};

/**
 * Карточка готового решения. Одна на превью главной и на странице `/solutions`.
 *
 * Вынесена в компонент не ради переиспользования как такового: до этого
 * страницы держали каждая свою копию разметки и стилей, и правка на главной
 * молча не доезжала до списка решений. Общая карточка делает такое
 * расхождение невозможным, а разный вид достигается раскладкой, а не
 * второй копией кода.
 *
 * Сетку компонент не задаёт — она остаётся за страницами.
 */
export function SolutionCard({
  slug,
  room,
  area,
  areaTo,
  priceFrom,
  short,
  layout = "tile",
  featured = false,
}: Props) {
  const cn = [styles.card, styles[layout], featured && styles.hot]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={`/solutions/${slug}`} className={cn}>
      {/* Метраж крупной цифрой. Не украшение: площадь — то, по чему решение
          и выбирают. В плитке она уходит фоном за содержимое, в строке
          становится отдельным столбцом слева. */}
      <span className={styles.bigArea} aria-hidden>
        {areaTo}
      </span>

      <span className={styles.head}>
        <span className={styles.room}>{room}</span>
        <span className={styles.area}>{area}</span>
      </span>

      {priceFrom && (
        <span className={styles.priceBox}>
          <span className={styles.price}>от {formatPrice(priceFrom)}</span>
          <span className={styles.priceNote}>за оборудование</span>
        </span>
      )}

      <span className={styles.short}>{short}</span>

      <span className={styles.more}>
        Подробнее <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
