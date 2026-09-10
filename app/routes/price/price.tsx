import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { ArrowRight, Check, Plus } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import {
  installRows,
  PRICES_CONFIRMED,
  STANDARD_INSTALL_INCLUDES,
  EXTRA_CHARGES,
} from "~/config/pricing";
import { getSolutionPriceFrom } from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import { site } from "~/config/site";
import { seo } from "~/lib/seo";
import styles from "./price.module.scss";

export const meta: MetaFunction = () =>
  seo({
    title: "Сколько стоит установка кондиционера",
    description:
      "Цены на кондиционеры и монтаж по площади помещения: что входит в стандартную установку и что оплачивается отдельно. Без скрытых доплат.",
    path: "/price",
  });

/**
 * Страница называется «Сколько стоит», и до этого чисел на ней не было
 * ни одного: цены монтажа ждут заказчика, а больше ничего не показывалось.
 *
 * Между тем половина ответа у нас есть и она настоящая — цены оборудования
 * из каталога. По каждому классу площади показываем «оборудование от N р.»
 * по самой дешёвой подходящей модели, а монтаж честно держим «по запросу»,
 * пока PRICES_CONFIRMED = false. Полцены с источником лучше, чем ноль.
 *
 * Классы — сплит-системы: маркировка 07–24 BTU относится к ним, и монтаж
 * в прайсе тоже про настенный блок.
 */
export default function Price() {
  return (
    <main>
      <PageHeader
        title="Сколько стоит установка кондиционера"
        lead="Цена складывается из двух частей: оборудование и монтаж. Ниже — обе по площади помещения, и что может увеличить вторую."
        crumbs={[{ label: "Цены на монтаж" }]}
      />

      <Section
        title="По площади помещения"
        lead="Выберите строку под свою комнату. Цена оборудования — по самой доступной подходящей модели из каталога, посмотреть все можно по ссылке."
      >
        <ul className={styles.rows}>
          {installRows.map((row) => {
            // Только сплиты: строки прайса — про настенные блоки, и мобильный
            // кондиционер той же площади сбил бы «от» вниз, обещая цену,
            // которая к монтажу не относится.
            const equipment = getSolutionPriceFrom(row.areaTo, ["split"]);
            return (
              <li key={row.btu} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.area}>{row.area}</span>
                  <span className={styles.spec}>
                    <b>{row.btu}</b> BTU · {row.kw} кВт
                  </span>
                </div>

                <dl className={styles.costs}>
                  <div className={styles.cost}>
                    <dt>Оборудование</dt>
                    <dd>{equipment ? `от ${formatPrice(equipment)}` : "—"}</dd>
                  </div>
                  <div className={styles.cost}>
                    <dt>Монтаж</dt>
                    <dd>
                      {PRICES_CONFIRMED ? (
                        `от ${formatPrice(row.price)}`
                      ) : (
                        <span className={styles.onRequest}>по запросу</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* В каталог уже с фильтром под эту площадь: то же значение,
                    которое ставит ползунок, — модели, рассчитанные не меньше
                    чем на неё. */}
                <Link
                  to={`/catalog?area=${row.areaTo}`}
                  className={styles.more}
                >
                  Модели <ArrowRight size={16} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        {!PRICES_CONFIRMED && (
          <p className={styles.notice}>
            Цены на монтаж уточняются. Назову точную по телефону — для этого
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

      <LeadBlock
        title="Рассчитать точно"
        lead="Опишите помещение — назову стоимость с учётом ваших условий."
        source="footer"
        defaultMessage={"Площадь комнаты: , этаж: "}
        points={[
          "Стоимость зависит от этажа, длины трассы и штробления",
          "Посчитаю по вашим условиям, а не «в среднем»",
          "Смету назову до начала работ",
          "Выезд на замер бесплатный",
        ]}
      />
    </main>
  );
}
