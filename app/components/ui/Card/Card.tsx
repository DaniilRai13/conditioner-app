import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Card.module.scss";

type Props = {
  children: ReactNode;
  /** Если передан — вся карточка становится ссылкой. */
  to?: string;
  className?: string;
};

export function Card({ children, to, className }: Props) {
  const cn = [styles.card, to && styles.linked, className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={cn}>
        {children}
      </Link>
    );
  }

  return <div className={cn}>{children}</div>;
}
