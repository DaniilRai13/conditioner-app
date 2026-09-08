import { Link } from "react-router";
import { ArrowRight, Phone } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { services } from "~/data/services";
import { site } from "~/config/site";
import styles from "./ServicesPreview.module.scss";

/**
 * Сетка карточек, часть которых залита фирменным цветом.
 *
 * Заливка идёт по правилу `3n + 1` — то есть на первую карточку каждой
 * строки. Это не про важность услуги: акцент расставлен по сетке, а не по
 * смыслу, поэтому порядок услуг можно менять, не думая о цвете.
 *
 * Услуг четыре, и в сетке на три колонки они дают 3 + 1 — вторая строка
 * почти пустая. Карточка с телефоном занимает оставшиеся две ячейки:
 * прямоугольник закрывается, а на месте пустоты появляется то, ради чего
 * сайт и существует.
 */
export function ServicesPreview() {
  return (
    <Section
      title="Услуги"
      lead="Полный спектр работ по продаже, установке и обслуживанию кондиционеров для квартир, домов и офисов."
    >
      <div className={styles.grid}>
        {services.map((s) => (
          <Link
            key={s.slug}
            to={`/services/${s.slug}`}
            className={styles.card}
          >
            <IconBox name={s.icon} />
            <b className={styles.title}>{s.title}</b>
            <span className={styles.text}>{s.short}</span>
            <span className={styles.more}>
              Подробнее <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        ))}

        <a className={styles.call} href={site.phoneHref}>
          <IconBox name="headphones" />
          <b className={styles.title}>Не нашли нужного?</b>
          <span className={styles.text}>
            Позвоните — отвечу лично и скажу, берусь ли за задачу и сколько
            это будет стоить.
          </span>
          <span className={styles.more}>
            <Phone size={16} aria-hidden />
            {site.phone}
          </span>
        </a>
      </div>
    </Section>
  );
}
