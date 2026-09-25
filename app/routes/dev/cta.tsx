import { ArrowRight } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import styles from "./cta.module.scss";

/**
 * Наведение у пары «кнопка + ссылка» в тёмном блоке и семь вводок
 * для страницы юрлиц.
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Каждый вариант показан сразу в двух состояниях — обычном и под курсором.
 * Иначе выбирать пришлось бы, водя мышью по семи блокам подряд и держа
 * предыдущий в памяти; а на скриншоте наведение не видно вовсе.
 *
 * Состояние «под курсором» подделано классом `.on`, который включает ровно
 * те же правила, что и `:hover`. Настоящее наведение тоже работает —
 * по левой карточке каждой пары можно водить мышью.
 */

export function meta() {
  return [
    { title: "Наведение и вводки — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

type Variant = {
  key: string;
  name: string;
  why: string;
  /** Класс кнопки и класс ссылки. */
  btn: string;
  link: string;
  /** Ссылка со стрелкой. */
  arrow?: boolean;
};

const VARIANTS: Variant[] = [
  {
    key: "fade",
    name: "Гашение и подчёркивание",
    why: "Как сейчас. Кнопка гаснет до 88% белого, у ссылки появляется подчёркивание. Ровно так ведут себя остальные кнопки сайта на тёмном — этим и хорошо.",
    btn: styles.btnFade,
    link: styles.linkUnderline,
  },
  {
    key: "arrow",
    name: "Стрелка вместо подчёркивания",
    why: "У ссылки подчёркивания нет совсем: рядом со стрелкой оно и не нужно, стрелка сама говорит «сюда». На наведении стрелка отъезжает вправо. Приём на сайте уже живёт — так сделаны «подробнее» в карточках услуг.",
    btn: styles.btnShadow,
    link: styles.linkArrow,
    arrow: true,
  },
  {
    key: "always",
    name: "Линия всегда, на наведении ярче",
    why: "Ссылка подчёркнута постоянно, но линией в 40% белого и с отбивкой от букв. На наведении линия становится белой. Так ссылка видна как ссылка ещё до того, как к ней потянулись мышью.",
    btn: styles.btnFade,
    link: styles.linkAlways,
  },
  {
    key: "pill",
    name: "Подложка вместо линии",
    why: "На наведении под ссылкой проявляется полупрозрачная белая плашка. Ссылка на секунду становится второй кнопкой — и сразу понятно, что нажимать можно и сюда.",
    btn: styles.btnLift,
    link: styles.linkPill,
  },
  {
    key: "outline",
    name: "Две кнопки",
    why: "Ссылка сразу нарисована кнопкой с белой рамкой, на наведении рамка заливается. Самый заметный из семи: два равных действия рядом.",
    btn: styles.btnFade,
    link: styles.linkOutline,
  },
  {
    key: "grow",
    name: "Полоса растёт слева направо",
    why: "Линии под ссылкой нет, на наведении она вырастает из левого края. Движение короткое и заметное боковым зрением, а в покое блок остаётся чистым.",
    btn: styles.btnBright,
    link: styles.linkGrow,
  },
  {
    key: "swap",
    name: "Меняются местами",
    why: "На наведении кнопка становится прозрачной с белой рамкой, а ссылка — белой заливкой. Пара как бы передаёт друг другу главную роль. Самый смелый вариант и единственный, где наведение меняет расстановку сил, а не оттенок.",
    btn: styles.btnSwap,
    link: styles.linkSwap,
  },
];

function Pair({ v, on }: { v: Variant; on: boolean }) {
  const cls = (base: string) => (on ? `${base} ${styles.on}` : base);

  return (
    <div className={styles.band}>
      <p className={styles.bandText}>
        Напишите, сколько помещений и какой площади — посчитаю мощность,
        подберу модели и выставлю счёт.
      </p>
      <div className={styles.row}>
        <Button to="#0" size="lg" className={cls(v.btn)}>
          Оставить заявку
        </Button>
        <a href="#0" className={cls(v.link)}>
          Посмотреть каталог
          {v.arrow && <ArrowRight size={16} aria-hidden />}
        </a>
      </div>
    </div>
  );
}

/**
 * Семь вводок для страницы юрлиц.
 *
 * У каждой свой угол, а не семь пересказов одного. Ни в одной нет ровной
 * тройки через тире и противопоставления «не то, а это»: именно на них
 * прошлый вариант и читался как написанный не человеком.
 */
const LEADS: { key: string; angle: string; text: string }[] = [
  {
    key: "plain",
    angle: "Что делаю и как платить — как сейчас",
    text: "Ставлю кондиционеры организациям и ИП: в офисы, магазины, кафе, на склады. Работаю по договору, оплата на расчётный счёт.",
  },
  {
    key: "alone",
    angle: "Работаю один",
    text: "Ставлю кондиционеры организациям и ИП. Работаю один: счёт, монтаж и документы на мне.",
  },
  {
    key: "cycle",
    angle: "Полный цикл своими руками",
    text: "Работаю с организациями и ИП по договору. Считаю мощность, привожу технику, вешаю и запускаю.",
  },
  {
    key: "docs",
    angle: "Скорость бумаг",
    text: "Оборудую офисы, магазины, кафе и склады. Счёт выставлю в день обращения, акты отдам сразу после монтажа.",
  },
  {
    key: "scale",
    angle: "Масштаб заказа",
    text: "Занимаюсь кондиционерами для организаций — от одного кабинета до всего этажа. По договору, с полным комплектом документов.",
  },
  {
    key: "question",
    angle: "Вопросом, разговорно",
    text: "Нужен кондиционер в офис или магазин? Посчитаю мощность и выставлю счёт. Работаю по договору, оплата безналом.",
  },
  {
    key: "accounting",
    angle: "От имени бухгалтерии",
    text: "Кондиционеры для организаций и ИП в Пинске и районе. Договор, счёт, акт и накладная — всё, что нужно закрыть период.",
  },
];

export default function DevCta() {
  return (
    <main>
      <PageHeader
        title="Наведение и вводки"
        lead="Семь способов оживить пару «кнопка и ссылка» в тёмном блоке и семь вводок для страницы юрлиц."
        crumbs={[{ label: "Наведение" }]}
      />

      <Section
        title="Кнопка и ссылка"
        lead="Слева — как блок выглядит обычно, справа — то же самое под курсором. По левому можно и правда водить мышью."
      >
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.item}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.name}>{v.name}</h3>
              </div>
              <p className={styles.why}>{v.why}</p>

              <div className={styles.states}>
                <div className={styles.state}>
                  <span className={styles.stateLabel}>обычное</span>
                  <Pair v={v} on={false} />
                </div>
                <div className={styles.state}>
                  <span className={styles.stateLabel}>под курсором</span>
                  <Pair v={v} on />
                </div>
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section
        title="Что написать наверху"
        lead="Семь вводок для страницы юрлиц, каждая со своим углом. Показаны на тёмной подложке первого экрана — там они и стоят."
      >
        <div className={styles.leads}>
          {LEADS.map((l, i) => (
            <section key={l.key} className={styles.lead}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.name}>{l.angle}</h3>
              </div>
              <div className={styles.leadBand}>
                <b className={styles.leadTitle}>Юридическим лицам</b>
                <p className={styles.leadText}>{l.text}</p>
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
