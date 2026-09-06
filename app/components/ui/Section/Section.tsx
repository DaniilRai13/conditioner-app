import type { ReactNode } from "react";
import { Container } from "../Container/Container";
import { Decor, type DecorVariant } from "../Decor/Decor";
import styles from "./Section.module.scss";

type Props = {
  children?: ReactNode;
  title?: string;
  lead?: string;

  /**
   * Органическая подложка под секцией. Раскладку задавать разную:
   * одинаковая на каждой секции вернёт монотонность, ради ухода
   * от которой она и добавлена.
   */
  decor?: DecorVariant;
  id?: string;
  className?: string;
};

export function Section({
  children,
  title,
  lead,
  decor,
  id,
  className,
}: Props) {
  const cn = [styles.section, decor && styles.decorated, className]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={cn}>
      {decor && <Decor variant={decor} />}
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
