import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Check, Phone } from "lucide-react";
import { site } from "~/config/site";
import styles from "./form.module.scss";

/**
 * Витрина оформления блока заявки. Временная страница — удаляется вместе
 * с папкой `routes/dev`.
 *
 * Поля здесь не подключены к react-hook-form: сравниваем вид, а не работу
 * формы. Семь живых копий с валидацией дали бы семь состояний и дубли id,
 * а показали бы ровно то же самое.
 */

export function meta() {
  return [
    { title: "Форма — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "now",
    name: "Белые поля с рамкой",
    tag: "как сейчас",
    why: "Поле белое, фон страницы почти белый — граница держится на тонкой линии. Форма не читается как область ввода: глаз видит текст с подписями, а не место, куда нужно писать.",
  },
  {
    key: "sunken",
    name: "Утопленные поля",
    why: "Поле темнее фона и без рамки. Ровно обратная логика: не карточка на странице, а углубление в ней. Самый прямой ответ на «сливается» — сливаться нечему, поле темнее всего вокруг.",
  },
  {
    key: "panel",
    name: "Форма в белой панели",
    why: "Вся форма на белой карточке с тенью, поля внутри — приглушённые. Работает на двух уровнях: панель отделяется от страницы, поля отделяются от панели. Заодно форма перестаёт быть «продолжением текста» и становится предметом.",
  },
  {
    key: "dark",
    name: "Тёмная панель",
    why: "Форма на индиго — том же, что в услугах и в выделенном решении. Самый заметный вариант: блок заявки выделяется на странице сам по себе, без стрелок и надписей. Риск в том, что светлые поля на тёмном требуют аккуратности с контрастом подписей.",
  },
  {
    key: "underline",
    name: "Только подчёркивание",
    why: "Ни рамок, ни заливки — линия под каждым полем. Самый лёгкий вариант; хорош там, где форма не должна доминировать. Минус: область клика неочевидна, и на телефоне в неё труднее попасть.",
  },
  {
    key: "twocol",
    name: "Две колонки: аргументы и форма",
    why: "Слева три причины оставить заявку, справа сама форма на панели. Единственный вариант, где блок не только собирает контакты, но и отвечает на «зачем мне это» — а именно на этом месте человек чаще всего и уходит.",
  },
  {
    key: "big",
    name: "Крупные поля",
    why: "Те же поля, но выше, с большим отступом и скруглением побольше. Ничего не меняет по сути, зато форма выглядит основательнее и на телефоне в неё легче попасть пальцем.",
  },
] as const;

function Form({ variant }: { variant: string }) {
  const twocol = variant === "twocol";

  const fields = (
    <>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Как вас зовут</span>
          <input className={styles.input} placeholder="Иван" readOnly />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            placeholder="+375 (29) 123-45-67"
            readOnly
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>
          Комментарий <span className={styles.optional}>— необязательно</span>
        </span>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="Площадь помещения, этаж, пожелания по модели"
          readOnly
        />
      </label>

      <span className={styles.consent}>
        <input type="checkbox" readOnly />
        Согласен на обработку персональных данных
      </span>

      <div className={styles.actions}>
        <span className={styles.submit}>Отправить заявку</span>
        <span className={styles.note}>
          Или позвоните: <a href={site.phoneHref}>{site.phone}</a>
        </span>
      </div>
    </>
  );

  if (twocol) {
    return (
      <div className={[styles.stage, styles.twocol].join(" ")}>
        <div className={styles.pitch}>
          <h3 className={styles.pitchTitle}>Замер и консультация бесплатно</h3>
          <ul className={styles.pitchList}>
            {[
              "Перезвоню в течение часа",
              "Смету назову до начала работ",
              "Отвечаю лично, без колл-центра",
            ].map((t) => (
              <li key={t}>
                <Check size={16} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <a className={styles.pitchPhone} href={site.phoneHref}>
            <Phone size={18} aria-hidden />
            {site.phone}
          </a>
        </div>
        <div className={styles.formBox}>{fields}</div>
      </div>
    );
  }

  return (
    <div className={[styles.stage, styles[variant]].join(" ")}>{fields}</div>
  );
}

export default function DevForm() {
  return (
    <main>
      <PageHeader
        title="Блок заявки: семь вариантов"
        lead="Поля везде одни и те же. Меняется то, как форма отделяется от страницы."
        crumbs={[{ label: "Форма" }]}
      />

      <Section>
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.variant}>
              <div className={styles.vhead}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.name}>{v.name}</h2>
                {"tag" in v && <span className={styles.tag}>{v.tag}</span>}
              </div>
              <p className={styles.why}>{v.why}</p>
              <Form variant={v.key} />
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
