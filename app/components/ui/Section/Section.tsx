import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { revealVariants } from "~/lib/animations";
import { Container } from "../Container/Container";
import styles from "./Section.module.scss";

type Props = {
  children?: ReactNode;
  title?: string;
  lead?: string;

  id?: string;
  className?: string;

  /**
   * Проявляться при прокрутке.
   *
   * Не по умолчанию, и это осознанно. Первый экран прятать нельзя —
   * он и есть то, ради чего страницу открыли; а на внутренних страницах
   * секции идут сплошным текстом, и проявление каждой превратило бы
   * чтение в ожидание.
   */
  reveal?: boolean;
};

export function Section({
  children,
  title,
  lead,
  id,
  className,
  reveal,
}: Props) {
  // Класс `reveal` — метка для страховки в _reveal.scss, а не оформление:
  // по ней CSS находит блоки, которым framer проставил начальную
  // прозрачность, и отменяет её, если скрипт не поднялся.
  const cn = [styles.section, reveal && "reveal", className]
    .filter(Boolean)
    .join(" ");

  const body = (
    <Container>
      {(title || lead) && (
        <header className={styles.head}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {lead && <p className={styles.lead}>{lead}</p>}
        </header>
      )}
      {children}
    </Container>
  );

  // Обычная секция, когда появление не просили: motion-компонент тянет
  // за собой наблюдатель и состояние на каждый экземпляр, а секций
  // на сайте десятки.
  if (!reveal) {
    return (
      <section id={id} className={cn}>
        {body}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={cn}
      initial="hidden"
      whileInView="visible"
      // once: false — блок проявляется каждый раз, когда входит в экран,
      // а не единожды. amount: 0.1, а не половина: секции здесь высокие,
      // и половина иных не помещается в экран целиком — такой блок
      // не показался бы никогда.
      viewport={{ once: false, amount: 0.1, margin: "0px 0px -8% 0px" }}
      variants={revealVariants}
    >
      {body}
    </motion.section>
  );
}
