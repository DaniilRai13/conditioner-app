import styles from "./AcUnit.module.scss";

type Props = {
  /** Ширину задаёт родитель — всё остальное считается от неё. */
  className?: string;
  /** Поток воздуха под блоком. Без него это просто корпус на стене. */
  flow?: boolean;
  /** Поток дышит: медленное изменение прозрачности и ширины. */
  breathing?: boolean;
  /** Цифра на дисплее. */
  temp?: string;
};

/**
 * Кондиционер, нарисованный фигурами, а не снятый на фото.
 *
 * Зачем: стоковый блок — белый предмет на светлом фоне. В маленьком
 * размере (превью ссылки в мессенджере, узкий экран) он превращается
 * в бесформенное пятно, а на тёмном фоне сайта вокруг него всегда
 * оставался ореол от вырезания. Фигуры остаются собой на любом размере
 * и весят ноль байт вместо ста килобайт картинки.
 *
 * Размеры внутри — в cqw, то есть в процентах от собственной ширины.
 * Поэтому компонент масштабируется целиком: родитель задаёт ширину,
 * пропорции держатся сами, и отдельного адаптива блоку не нужно —
 * ни одного медиазапроса внутри.
 *
 * Декорация: из дерева доступности убрана целиком.
 */
export function AcUnit({
  className,
  flow = true,
  breathing = false,
  temp = "24°",
}: Props) {
  const cn = [styles.unit, className].filter(Boolean).join(" ");

  return (
    <div className={cn} aria-hidden>
      <div className={styles.body}>
        <span className={styles.display}>{temp}</span>
        <span className={styles.louver} />
      </div>
      {flow && (
        <span
          className={[styles.flow, breathing && styles.breathing]
            .filter(Boolean)
            .join(" ")}
        />
      )}
    </div>
  );
}
