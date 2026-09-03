import { icons, type IconName } from "~/lib/icons";
import styles from "./IconBox.module.scss";

type Props = {
  name: IconName;
  /** На синем фоне подложка инвертируется. */
  tone?: "brand" | "onBrand";
  /** Круг — для полосы преимуществ под hero, квадрат — везде остальное. */
  shape?: "square" | "circle";
};

/** Контурная иконка на светлой подложке — базовый элемент макета. */
export function IconBox({ name, tone = "brand", shape = "square" }: Props) {
  const Icon = icons[name];
  const cn = [
    tone === "onBrand" ? styles.onBrand : styles.box,
    shape === "circle" && styles.circle,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cn}>
      <Icon size={20} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
