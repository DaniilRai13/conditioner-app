import type { MetaFunction } from "react-router";
import { Check, Plus } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import {
  installRows,
  PRICES_CONFIRMED,
  STANDARD_INSTALL_INCLUDES,
  EXTRA_CHARGES,
} from "~/config/pricing";
import { site } from "~/config/site";
import styles from "./price.module.scss";

export const meta: MetaFunction = () => [
  { title: `Сколько стоит установка кондиционера — ${site.name}` },
  {
    name: "description",
    content:
      "Цены на монтаж кондиционера по мощности, что входит в стандартную установку и что оплачивается отдельно. Без скрытых доплат.",
  },
];

export default function Price() {
  return (
    <main>
      <PageHeader
        title="Сколько стоит установка кондиционера"
        lead="Стоимость зависит от мощности блока и условий монтажа. Ниже — из чего складывается цена и что может её увеличить."
        crumbs={[{ label: "Цены на монтаж" }]}
      />

      <Section className={styles.top}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Мощность</th>
                <th>кВт</th>
                <th>Площадь</th>
                <th>Монтаж</th>
              </tr>
            </thead>
            <tbody>
              {installRows.map((row) => (
                <tr key={row.btu}>
                  <td>
                    <b>{row.btu}</b> BTU
                  </td>
                  <td>{row.kw}</td>
                  <td>{row.area}</td>
                  <td className={styles.price}>
                    {PRICES_CONFIRMED ? (
                      <>от {row.price.toLocaleString("ru-RU")} р.</>
                    ) : (
                      <span className={styles.onRequest}>по запросу</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!PRICES_CONFIRMED && (
          <p className={styles.notice}>
            Прайс уточняется. Назову точную стоимость по телефону — для этого
            достаточно знать площадь комнаты и этаж.{" "}
            <a href={site.phoneHref}>{site.phone}</a>
          </p>
        )}
      </Section>

      <Section title="Что входит в стандартный монтаж">
        <div className={styles.columns}>
          <ul className={styles.list}>
            {STANDARD_INSTALL_INCLUDES.map((item) => (
              <li key={item} className={styles.item}>
                <Check size={18} className={styles.check} aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div>
            <h3 className={styles.subTitle}>Оплачивается отдельно</h3>
            <p className={styles.subNote}>
              Всё это обсуждается до начала работ, а не появляется в счёте
              после.
            </p>
            <ul className={styles.list}>
              {EXTRA_CHARGES.map((item) => (
                <li key={item} className={styles.item}>
                  <Plus size={18} className={styles.plus} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title="Рассчитать точно"
        lead="Опишите помещение — назову стоимость с учётом ваших условий."
      >
        <LeadForm
          source="footer"
          defaultMessage="Площадь комнаты: , этаж: "
        />
      </Section>
    </main>
  );
}
