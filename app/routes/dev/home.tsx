import { Link } from "react-router";
import { ArrowRight, Check, Phone } from "lucide-react";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { advantages } from "~/data/advantages";
import { solutions, areaLabel } from "~/data/solutions";
import { services } from "~/data/services";
import { steps } from "~/data/steps";
import { site } from "~/config/site";
import { getSolutionPriceFrom } from "~/lib/queries";
import { formatPrice } from "~/lib/format";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import styles from "./home.module.scss";

/**
 * Главная в другом визуальном языке — по присланному макету кофейни.
 * Черновик для сравнения, удаляется вместе с папкой `routes/dev`.
 *
 * Что взято из образца, а что переосмыслено:
 *
 * — страница лежит в скруглённой рамке с отступом от краёв окна;
 * — секции сидят на разных подложках, а не на одном полотне;
 * — скругления крупные, кнопки в форме таблетки;
 * — фото живёт внутри скруглённой панели, а не висит само по себе.
 *
 * Палитра НЕ скопирована: у образца тёплый шалфей под кофе, у нас
 * прохладный нейтральный фон и индиго #49527e, выбранный для карточек
 * услуг. Копировать зелёный под кондиционеры было бы подражанием,
 * а не переносом приёма.
 *
 * Страница намеренно самодостаточна: свои токены на корне, ни одного
 * общего компонента вёрстки. Так её видно целиком и не жалко выбросить.
 */

export function meta() {
  return [
    { title: "Главная в новом стиле — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const NAV = ["Каталог", "Решения", "Услуги", "Обо мне", "Контакты"];

export default function DevHome() {
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        {/* --- шапка --- */}
        <header className={styles.top}>
          <span className={styles.logo}>
            <span className={styles.mark}>❄</span>
            <span>
              <b>Климат Лайн</b>
              <span className={styles.logoSub}>установка кондиционеров</span>
            </span>
          </span>

          <nav className={styles.nav}>
            {NAV.map((n) => (
              <span key={n} className={styles.navLink}>
                {n}
              </span>
            ))}
          </nav>

          <span className={styles.pill}>Заказать звонок</span>
        </header>

        {/* --- герой --- */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.h1}>
              Прохлада, которую
              <br />
              ставят один раз
            </h1>
            <p className={styles.heroLead}>
              Подберу кондиционер под ваше помещение и установлю сам — без
              бригад, посредников и сюрпризов в смете.
            </p>
            <div className={styles.heroActions}>
              <span className={`${styles.pill} ${styles.pillLg}`}>
                Рассчитать стоимость
              </span>
              <span className={styles.ghostPill}>
                Смотреть каталог <ArrowRight size={16} aria-hidden />
              </span>
            </div>
          </div>

          <div className={styles.heroMedia}>
            {/* Нарисованный блок вместо стоковой фотографии: та тянула
                ореол от вырезания и 323 КБ в сборку. */}
            <AcUnit />
            <span className={styles.badge}>
              <b>5 лет</b>
              гарантия
            </span>
          </div>
        </section>

        {/* --- полоса преимуществ --- */}
        <section className={styles.strip}>
          {advantages.map((a) => (
            <div key={a.title} className={styles.stripItem}>
              <IconBox name={a.icon} />
              <b>{a.title}</b>
              <span>{a.text}</span>
            </div>
          ))}
          <div className={styles.stripItem}>
            <IconBox name="user" />
            <b>Работаю один</b>
            <span>отвечаю лично</span>
          </div>
        </section>

        {/* --- решения --- */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.h2}>Готовые решения</h2>
              <p className={styles.panelLead}>
                Комплекты под площадь: расчёт мощности и три модели на выбор.
              </p>
            </div>
            <span className={styles.ghostPill}>
              Смотреть все <ArrowRight size={16} aria-hidden />
            </span>
          </div>

          <div className={styles.solGrid}>
            {solutions.map((s) => {
              const price = getSolutionPriceFrom(s.areaTo, s.types);
              return (
                <div key={s.slug} className={styles.solCard}>
                  <span className={styles.solArea}>{areaLabel(s)}</span>
                  <b className={styles.solRoom}>{s.room}</b>
                  <span className={styles.solShort}>{s.short}</span>
                  {price && (
                    <span className={styles.solPrice}>
                      от {formatPrice(price)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* --- услуги --- */}
        <section className={styles.services}>
          <p className={styles.eyebrow}>
            <span />
            Что я делаю
            <span />
          </p>

          <div className={styles.srvGrid}>
            {services.map((s) => (
              <div key={s.slug} className={styles.srvCard}>
                <IconBox name={s.icon} />
                <b>{s.title}</b>
                <span>{s.short}</span>
                <span className={styles.srvMore}>
                  Подробнее <ArrowRight size={15} aria-hidden />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* --- как работаю --- */}
        <section className={styles.stepsBlock}>
          <h2 className={styles.h2}>Как проходит работа</h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNum}>{i + 1}</span>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- призыв --- */}
        <section className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>Замер и консультация бесплатно</h2>
            <p className={styles.ctaLead}>
              Назовите площадь и этаж — посчитаю мощность и стоимость под ключ.
              Отвечаю лично, без колл-центра.
            </p>
            <ul className={styles.ctaList}>
              {[
                "Выезд в день обращения",
                "Смета до начала работ",
                "Гарантия до 5 лет",
              ].map((t) => (
                <li key={t}>
                  <Check size={16} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.ctaBox}>
            <span className={styles.ctaLabel}>Позвоните прямо сейчас</span>
            <a className={styles.ctaPhone} href={site.phoneHref}>
              <Phone size={20} aria-hidden />
              {site.phone}
            </a>
            <span className={styles.ctaHours}>{site.workHours}</span>
            <span className={`${styles.pill} ${styles.pillLg}`}>
              Оставить заявку
            </span>
          </div>
        </section>

        <footer className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} Климат Лайн · {site.city}
          </span>
          <Link to="/" className={styles.back}>
            Вернуться на текущую версию сайта
          </Link>
        </footer>
      </div>
    </div>
  );
}
