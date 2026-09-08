import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { services } from "~/data/services";
import styles from "./services.module.scss";

/**
 * Витрина раскладок блока «Услуги». Временная страница — удаляется вместе
 * с папкой `routes/dev`.
 *
 * Везде одни и те же пять услуг из настоящих данных: сравнивать нужно
 * устройство блока, а не текст.
 */

export function meta() {
  return [
    { title: "Услуги — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const VARIANTS = [
  {
    key: "rows",
    name: "Список строк",
    tag: "как сейчас",
    why: "Иконка, текст, стрелка, разделитель. Компактно и не спорит с сеткой решений выше. Минус: пять одинаковых строк подряд читаются монотонно, и услуги выглядят второстепенными.",
  },
  {
    key: "numbered",
    name: "Нумерованный перечень",
    why: "Вместо иконок крупные номера, вместо рамок воздух. Услуги перестают быть карточками и читаются как оглавление. Номера тут не врут: это перечень, а не последовательность, поэтому они приглушённые и не претендуют на порядок действий.",
  },
  {
    key: "columns",
    name: "Две колонки без карточек",
    why: "Ни рамок, ни подложек, только отступы. Самый спокойный вариант: на странице и так семь блоков с рамками, и убрать их хотя бы в одном месте заметно разгружает.",
  },
  {
    key: "accordion",
    name: "Раскрывающийся состав работ",
    why: "Свёрнуто — компактный список, развёрнуто — что именно входит в услугу. Единственный вариант, где на главной появляется конкретика вместо обещания: человек видит пункты работ, не уходя со страницы.",
  },
  {
    key: "featured",
    name: "Первая услуга крупная",
    why: "Асимметрия: установка занимает две колонки, остальные обычные. Сразу видно, что главное, и сетка перестаёт быть ровным ковром одинаковых плиток.",
  },
  {
    key: "chips",
    name: "Строки с составом работ",
    why: "То же, что первый вариант, но под каждой услугой три пункта состава работ. Плотнее по смыслу: вместо «полного спектра работ» видно, что конкретно делают.",
  },
  {
    key: "table",
    name: "Таблица со сроками",
    why: "Услуга, срок, стрелка. Самый утилитарный вид — так выглядят прайсы у мастеров, и для частника это скорее плюс: похоже на документ, а не на витрину.",
  },
] as const;

export default function DevServices() {
  return (
    <main>
      <PageHeader
        title="Блок «Услуги»: семь раскладок"
        lead="Одни и те же пять услуг из настоящих данных. Сравнивать нужно устройство, а не текст."
        crumbs={[{ label: "Услуги" }]}
      />

      <Section>
        <div className={styles.list}>
          {VARIANTS.map((v, i) => (
            <section key={v.key} className={styles.variant}>
              <div className={styles.head}>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.name}>{v.name}</h2>
                {"tag" in v && <span className={styles.tag}>{v.tag}</span>}
              </div>

              <p className={styles.why}>{v.why}</p>

              <div className={[styles.stage, styles[v.key]].join(" ")}>
                {v.key === "rows" && (
                  <ul className={styles.rowsList}>
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/services/${s.slug}`} className={styles.row}>
                          <IconBox name={s.icon} />
                          <span className={styles.body}>
                            <b className={styles.title}>{s.title}</b>
                            <span className={styles.text}>{s.short}</span>
                          </span>
                          <ArrowRight
                            className={styles.arrow}
                            size={20}
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {v.key === "numbered" && (
                  <ol className={styles.numList}>
                    {services.map((s, n) => (
                      <li key={s.slug}>
                        <Link
                          to={`/services/${s.slug}`}
                          className={styles.numItem}
                        >
                          <span className={styles.index}>
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <span className={styles.body}>
                            <b className={styles.title}>{s.title}</b>
                            <span className={styles.text}>{s.short}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}

                {v.key === "columns" && (
                  <div className={styles.cols}>
                    {services.map((s) => (
                      <Link
                        key={s.slug}
                        to={`/services/${s.slug}`}
                        className={styles.col}
                      >
                        <IconBox name={s.icon} />
                        <b className={styles.title}>{s.title}</b>
                        <span className={styles.text}>{s.short}</span>
                        <span className={styles.more}>
                          Подробнее <ArrowRight size={16} aria-hidden />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {v.key === "accordion" && (
                  <div className={styles.accList}>
                    {services.map((s) => (
                      <details key={s.slug} className={styles.acc}>
                        <summary className={styles.accHead}>
                          <IconBox name={s.icon} />
                          <b className={styles.title}>{s.title}</b>
                          <span className={styles.text}>{s.short}</span>
                        </summary>
                        <ul className={styles.includes}>
                          {s.includes.slice(0, 4).map((it) => (
                            <li key={it}>
                              <Check size={15} aria-hidden />
                              {it}
                            </li>
                          ))}
                        </ul>
                        <Link
                          to={`/services/${s.slug}`}
                          className={styles.more}
                        >
                          Подробнее об услуге{" "}
                          <ArrowRight size={16} aria-hidden />
                        </Link>
                      </details>
                    ))}
                  </div>
                )}

                {v.key === "featured" && (
                  <div className={styles.feat}>
                    {services.map((s, n) => (
                      <Link
                        key={s.slug}
                        to={`/services/${s.slug}`}
                        className={
                          n === 0
                            ? `${styles.featCard} ${styles.big}`
                            : styles.featCard
                        }
                      >
                        <IconBox name={s.icon} />
                        <b className={styles.title}>{s.title}</b>
                        <span className={styles.text}>{s.short}</span>
                        {n === 0 && (
                          <ul className={styles.includes}>
                            {s.includes.slice(0, 3).map((it) => (
                              <li key={it}>
                                <Check size={15} aria-hidden />
                                {it}
                              </li>
                            ))}
                          </ul>
                        )}
                        <span className={styles.more}>
                          Подробнее <ArrowRight size={16} aria-hidden />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {v.key === "chips" && (
                  <ul className={styles.rowsList}>
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link
                          to={`/services/${s.slug}`}
                          className={styles.chipRow}
                        >
                          <span className={styles.body}>
                            <b className={styles.title}>{s.title}</b>
                            <span className={styles.chips}>
                              {s.includes.slice(0, 3).map((it) => (
                                <span key={it} className={styles.chip}>
                                  {it}
                                </span>
                              ))}
                            </span>
                          </span>
                          <ArrowRight
                            className={styles.arrow}
                            size={20}
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {v.key === "table" && (
                  <ul className={styles.table}>
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link
                          to={`/services/${s.slug}`}
                          className={styles.tableRow}
                        >
                          <b className={styles.title}>{s.title}</b>
                          <span className={styles.term}>{s.terms}</span>
                          <ArrowRight
                            className={styles.arrow}
                            size={18}
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </Section>
    </main>
  );
}
