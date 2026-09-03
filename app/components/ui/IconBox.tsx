import { icons, type IconName } from "~/lib/icons";
import styles from "./IconBox.module.scss";

type Props = {
  name: IconName;
  /** На синем фоне подложка инвертируется. */
  tone?: "brand" | "onBrand";
};

/** Контурная иконка в квадрате 40×40 — базовый элемент макета. */
export function IconBox({ name, tone = "brand" }: Props) {
  const Icon = icons[name];
  return (
    <span className={tone === "onBrand" ? styles.onBrand : styles.box}>
      <Icon size={20} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
