import { Link } from "react-router";
import { Snowflake } from "lucide-react";
import { site } from "~/config/site";
import styles from "./Logo.module.scss";

/**
 * TODO: заглушка. Заказчик пока не передал логотип в векторе (PLAN.md §11),
 * поэтому знак собран из иконки, а не из SVG-файла. Замена — только здесь.
 */
export function Logo() {
  return (
    <Link to="/" className={styles.logo} aria-label={`${site.name} — на главную`}>
      <span className={styles.mark}>
        <Snowflake size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <span className={styles.text}>
        <b className={styles.name}>{site.name}</b>
        <span className={styles.tagline}>{site.tagline}</span>
      </span>
    </Link>
  );
}
