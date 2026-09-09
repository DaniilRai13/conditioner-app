import { Check, Clock } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { LeadForm } from "../LeadForm/LeadForm";
import { site } from "~/config/site";
import styles from "./LeadBlock.module.scss";

type Props = {
  id?: string;
  title: string;
  lead: string;

  /**
   * Ответы на возражения, которые возникают именно на этой странице.
   * Не украшение и не наполнитель: блок заявки — последнее место перед
   * уходом, и слева должно стоять то, что снимает сомнение, а не воздух.
   */
  points: string[];

  source: "home" | "product" | "solution" | "footer";
  defaultMessage?: string;
  productSlug?: string;
};

/**
 * Блок заявки: слева доводы, справа форма.
 *
 * Один на весь сайт. До этого главная имела свою раскладку в две колонки,
 * а остальные десять страниц — заголовок над формой во всю ширину. Правка
 * на главной до них не доезжала, и они постепенно расходились.
 */
export function LeadBlock({
  id,
  title,
  lead,
  points,
  source,
  defaultMessage,
  productSlug,
}: Props) {
  return (
    <Section id={id}>
      <div className={styles.box}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.lead}>{lead}</p>

          <ul className={styles.points}>
            {points.map((t) => (
              <li key={t}>
                <Check size={16} aria-hidden />
                {t}
              </li>
            ))}
          </ul>

          <p className={styles.hours}>
            <Clock size={16} aria-hidden />
            {site.workHours}
          </p>
        </div>

        <LeadForm
          source={source}
          defaultMessage={defaultMessage}
          productSlug={productSlug}
        />
      </div>
    </Section>
  );
}
