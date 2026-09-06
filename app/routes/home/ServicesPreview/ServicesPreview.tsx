import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "~/components/ui/Section/Section";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { services } from "~/data/services";
import styles from "./ServicesPreview.module.scss";

/**
 * Услуги списком, а не сеткой карточек.
 *
 * Раньше здесь стояла та же сетка 4→2→1, что и в решениях выше, — два
 * соседних блока выглядели одним и тем же дважды, и глаз пролистывал их
 * не заметив. Плюс услуг пять, и пятая висела в ряду одна.
 *
 * Список решает и то, и другое: строки заполняют ширину при любом
 * количестве, а страница получает передышку от карточек.
 */
export function ServicesPreview() {
  return (
    <Section
      title="Услуги"
      lead="Полный спектр работ по продаже, установке и обслуживанию кондиционеров для квартир, домов и офисов."
    >
      <ul className={styles.list}>
        {services.map((s) => (
          <li key={s.slug}>
            <Link to={`/services/${s.slug}`} className={styles.row}>
              <IconBox name={s.icon} />
              <span className={styles.body}>
                <b className={styles.title}>{s.title}</b>
                <span className={styles.text}>{s.short}</span>
              </span>
              <ArrowRight className={styles.arrow} size={20} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
