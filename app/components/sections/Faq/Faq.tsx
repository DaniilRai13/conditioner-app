import { ChevronDown } from "lucide-react";
import type { FaqItem } from "~/data/faq";
import styles from "./Faq.module.scss";

type Props = {
  items: FaqItem[];
};

/**
 * Аккордеон на <details>/<summary>: работает без JS, доступен с клавиатуры
 * и переживает пререндер — текст ответов лежит в HTML и индексируется.
 *
 * Вопросы приходят пропсом, а не читаются из data напрямую: иначе компонент
 * годится ровно для одной страницы, и на страницах услуг пришлось бы
 * дублировать такую же разметку.
 *
 * Разметка FAQPage генерируется здесь же — чтобы она не разъезжалась
 * с тем, что видит пользователь.
 */
export function Faq({ items }: Props) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <div className={styles.list}>
        {items.map((item) => (
          <details key={item.q} className={styles.item}>
            <summary className={styles.question}>
              {item.q}
              <ChevronDown className={styles.chevron} size={20} aria-hidden />
            </summary>
            <p className={styles.answer}>{item.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
