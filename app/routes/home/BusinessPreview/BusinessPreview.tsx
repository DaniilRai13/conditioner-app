import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { BUSINESS_POINTS } from "~/data/business";
import styles from "./BusinessPreview.module.scss";

/**
 * Короткий блок про работу с организациями со ссылкой на страницу.
 *
 * Здесь только перечень, без объяснений: задача блока — сообщить, что
 * с юрлицами вообще работают, и увести на страницу. Пересказывать её
 * целиком на главной значит сделать два одинаковых текста, из которых
 * поисковик выберет один сам, и не обязательно тот, что нужен.
 *
 * Заголовки пунктов берутся из того же файла, что и страница: разойтись
 * они не должны — на главной обещано ровно то, что на странице описано.
 */
export function BusinessPreview() {
  return (
    <Section reveal>
      <div className={styles.band}>
        <div className={styles.head}>
          <span className={styles.kicker}>Организациям и ИП</span>
          <h2 className={styles.title}>Работаю по безналу и договору</h2>
          <p className={styles.lead}>
            Офисы, магазины, кафе, серверные. Счёт в день обращения,
            закрывающие документы, обслуживание по графику и оплата частями.
          </p>
          <Link to="/business" className={styles.link}>
            Условия для юрлиц
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <ul className={styles.list}>
          {BUSINESS_POINTS.map((p) => (
            <li key={p.key}>
              <Check size={16} aria-hidden />
              {p.title}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
