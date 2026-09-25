import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import {
  BUSINESS_POINTS,
  BUSINESS_OBJECTS,
  PAY_WAYS,
  INSTALLMENT_CONFIRMED,
} from "~/data/business";
import { site } from "~/config/site";
import { seo } from "~/lib/seo";
import styles from "./business.module.scss";

/**
 * Отдельная страница, а не блок на главной, и это про поиск.
 *
 * «Кондиционеры юридическим лицам», «установка кондиционера в офис»,
 * «кондиционер по безналу» — это отдельные запросы с отдельным намерением:
 * человек ищет не технику, а поставщика, который выставит счёт и закроет
 * документы. Блок на главной такой запрос не займёт — у страницы должны
 * быть свой заголовок, свой адрес и свой текст.
 *
 * Содержимое — из `~/data/business`: там же лежат условия оплаты частями,
 * и меняются они в одном месте на обе страницы, эту и «Цены».
 */

export const meta: MetaFunction = () =>
  seo({
    title: "Кондиционеры юридическим лицам",
    description: `Продажа и установка кондиционеров для организаций в ${site.regionIn}. Безналичный расчёт, договор, закрывающие документы, рассрочка и обслуживание по графику.`,
    path: "/business",
  });

export default function Business() {
  return (
    <main>
      {/*
        Вводка нарочно скучная: что делаю, для кого и как платить.

        До этого здесь стояло «счёт, договор и монтаж — от одного человека;
        вы разговариваете с тем, кто приедет, а не с менеджером». Ровная
        тройка через тире плюс противопоставление «не с тем, а с этим» —
        фигура из учебника риторики, и читается она как реклама, написанная
        кем-то посторонним. Заказчик это заметил первым же взглядом.

        Живой человек про свою работу говорит списком дел, а не антитезой.
      */}
      <PageHeader
        title="Юридическим лицам"
        lead="Ставлю кондиционеры организациям и ИП: в офисы, магазины, кафе, на склады. Работаю по договору, оплата на расчётный счёт."
        crumbs={[{ label: "Юридическим лицам" }]}
      />

      <Section
        title="Как я работаю с организациями"
        lead="Четыре вещи, которых обычно ждут от поставщика. Всё остальное — уже про сами кондиционеры."
      >
        <ul className={styles.points}>
          {BUSINESS_POINTS.map((p) => (
            <li key={p.key} className={styles.point}>
              <IconBox name={p.icon} />
              <b className={styles.pointTitle}>{p.title}</b>
              <p className={styles.pointText}>{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Что чаще всего оснащаю"
        lead="Под каждое помещение мощность считается отдельно: на кухне кафе и в кабинете при одной площади нужны разные блоки."
      >
        <ul className={styles.objects}>
          {BUSINESS_OBJECTS.map((item) => (
            <li key={item}>
              <Check size={16} aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        {/* Серверная стоит в списке отдельной строкой не случайно: там
            кондиционер работает круглый год и на отказ его никто не
            проверяет, пока оборудование не встало. */}
        <p className={styles.note}>
          Для серверных и аппаратных подбираю модели с круглогодичной
          работой и нижней границей по улице — обычный бытовой блок зимой
          на охлаждение не запустится.
        </p>
      </Section>

      <Section
        id="pay"
        title="Оплата частями"
        lead={
          INSTALLMENT_CONFIRMED
            ? "Три способа разнести оплату по времени."
            : "Три способа разнести оплату по времени. Точные условия зависят от банка и суммы заказа — назову их при расчёте, вместе со сметой."
        }
      >
        <ul className={styles.ways}>
          {PAY_WAYS.map((w) => (
            <li key={w.key} className={styles.way}>
              <IconBox name={w.icon} />
              <b className={styles.wayTitle}>{w.title}</b>
              <p className={styles.wayText}>{w.text}</p>
              {/* Точные условия показываются, только когда они названы:
                  пустое поле лучше пустой строки на странице. */}
              {w.terms && <p className={styles.wayTerms}>{w.terms}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="С чего начать">
        <div className={styles.cta}>
          <p className={styles.ctaText}>
            Напишите, сколько помещений и какой площади — посчитаю мощность,
            подберу модели и выставлю счёт. Если нужен выезд на замер,
            приеду: в {site.regionIn} это бесплатно.
          </p>
          <div className={styles.ctaRow}>
            <Button to="/#lead" size="lg" className={styles.ctaBtn}>
              Оставить заявку
            </Button>
            <Link to="/catalog" className={styles.ctaLink}>
              Посмотреть каталог
            </Link>
          </div>
        </div>
      </Section>

      <LeadBlock
        title="Выставить счёт"
        lead="Напишите, что за помещение и сколько блоков — посчитаю и пришлю счёт с документами."
        source="footer"
        defaultMessage={"Организация: , помещение: , площадь: "}
        points={[
          "Счёт выставлю в день обращения",
          "Договор поставки и монтажа",
          "Акт выполненных работ и накладные",
          "Выезд на замер бесплатный",
        ]}
      />
    </main>
  );
}
