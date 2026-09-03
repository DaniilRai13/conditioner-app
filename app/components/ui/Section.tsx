import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./Section.module.scss";

type Props = {
  children?: ReactNode;
  title?: string;
  lead?: string;
  /** Синяя секция — как баннер «Работаю один» из макета. */
  tone?: "default" | "brand";
  id?: string;
  className?: string;
};

export function Section({
  children,
  title,
  lead,
  tone = "default",
  id,
  className,
}: Props) {
  const cn = [styles.section, tone === "brand" && styles.brand, className]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={cn}>
      <Container>
        {(title || lead) && (
          <header className={styles.head}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {lead && <p className={styles.lead}>{lead}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
