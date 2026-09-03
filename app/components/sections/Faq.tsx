import { ChevronDown } from "lucide-react";
import { faq } from "~/data/faq";
import styles from "./Faq.module.scss";

/**
 * Аккордеон на <details>/<summary>: работает без JS, доступен с клавиатуры
 * и переживает пререндер — раскрытый текст лежит в HTML и индексируется.
 */
export function Faq() {
  return (
    <div className={styles.list}>
      {faq.map((item) => (
        <details key={item.q} className={styles.item}>
          <summary className={styles.question}>
            {item.q}
            <ChevronDown className={styles.chevron} size={20} aria-hidden />
          </summary>
          <p className={styles.answer}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
