import type { ReactNode } from "react";
import { Container } from "../Container/Container";
import styles from "./Section.module.scss";

type Props = {
  children?: ReactNode;
  title?: string;
  lead?: string;

  id?: string;
  className?: string;
};

export function Section({ children, title, lead, id, className }: Props) {
  const cn = [styles.section, className].filter(Boolean).join(" ");

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
