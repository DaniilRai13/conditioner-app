import { icons, type IconName } from "~/lib/icons";
import styles from "./IconBox.module.scss";

type Props = {
  name: IconName;
  /** На синем фоне подложка инвертируется. */
  tone?: "brand" | "onBrand";
  /** Круг — если так требует макет, по умолчанию скруглённый квадрат. */
  shape?: "square" | "circle";
  /** sm — для компактных строк вроде полосы преимуществ под hero. */
  size?: "sm" | "md";
};

/** Контурная иконка на светлой подложке — базовый элемент макета. */
export function IconBox({
  name,
  tone = "brand",
  shape = "square",
  size = "md",
}: Props) {
  const Icon = icons[name];
  const cn = [
    tone === "onBrand" ? styles.onBrand : styles.box,
    shape === "circle" && styles.circle,
    size === "sm" && styles.sm,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cn}>
      <Icon size={size === "sm" ? 16 : 20} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
