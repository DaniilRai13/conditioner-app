import type { LucideIcon } from "lucide-react";
import styles from "./IconBox.module.scss";

type Props = {
  icon: LucideIcon;
  /** На синем фоне подложка инвертируется. */
  tone?: "brand" | "onBrand";
};

/** Контурная иконка в квадрате 40×40 — базовый элемент макета. */
export function IconBox({ icon: Icon, tone = "brand" }: Props) {
  return (
    <span className={tone === "onBrand" ? styles.onBrand : styles.box}>
      <Icon size={20} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
