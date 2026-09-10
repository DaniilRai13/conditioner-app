import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { site } from "~/config/site";
import { breadcrumbsJsonLd, jsonLdProps } from "~/lib/json-ld";
import styles from "./Breadcrumbs.module.scss";

export type Crumb = {
  label: string;
  to?: string;
};

type Props = {
  items: Crumb[];
};

/**
 * Хлебные крошки + JSON-LD BreadcrumbList в одном месте:
 * разметка для людей и для поисковика не разъедется.
 */
export function Breadcrumbs({ items }: Props) {
  const all: Crumb[] = [{ label: "Главная", to: "/" }, ...items];

  return (
    <>
      <nav className={styles.nav} aria-label="Хлебные крошки">
        <ol className={styles.list}>
          {all.map((c, i) => (
            <li key={c.label} className={styles.item}>
              {c.to && i < all.length - 1 ? (
                <Link to={c.to} className={styles.link}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
              {i < all.length - 1 && (
                <ChevronRight size={14} className={styles.sep} aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script {...jsonLdProps(breadcrumbsJsonLd(items))} />
    </>
  );
}
