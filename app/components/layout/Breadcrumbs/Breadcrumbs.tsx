import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { site } from "~/config/site";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.to ? { item: `${site.url}${c.to === "/" ? "" : c.to}` } : {}),
    })),
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
