import { Link } from "react-router";
import { Phone, Clock, MapPin } from "lucide-react";
import { Container } from "~/components/ui/Container";
import { Logo } from "./Logo";
import { nav, site, FEATURES } from "~/config/site";
import styles from "./Footer.module.scss";

// Подвал — полная карта сайта: сюда уходит то, чему не хватило места
// в меню из пяти пунктов (PLAN.md §4).
const extraLinks = [
  { to: "/price", label: "Цены на монтаж" },
  { to: "/articles", label: "Полезное" },
  ...(FEATURES.showPortfolio ? [{ to: "/portfolio", label: "Портфолио" }] : []),
  ...(FEATURES.showReviews ? [{ to: "/reviews", label: "Отзывы" }] : []),
  { to: "/privacy", label: "Политика обработки данных" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Logo />
            <p className={styles.about}>
              Продажа, установка и обслуживание кондиционеров в {site.region}.
              Работаю один — отвечаю за результат лично.
            </p>
          </div>

          <nav className={styles.col} aria-label="Разделы сайта">
            <h2 className={styles.colTitle}>Разделы</h2>
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className={styles.link}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className={styles.col} aria-label="Дополнительно">
            <h2 className={styles.colTitle}>Ещё</h2>
            {extraLinks.map((item) => (
              <Link key={item.to} to={item.to} className={styles.link}>
                {item.label}
              </Link>
            ))}
          </nav>

          <address className={styles.col}>
            <h2 className={styles.colTitle}>Контакты</h2>
            <a className={styles.contact} href={site.phoneHref}>
              <Phone size={16} aria-hidden />
              {site.phone}
            </a>
            <span className={styles.contact}>
              <Clock size={16} aria-hidden />
              {site.workHours}
            </span>
            <span className={styles.contact}>
              <MapPin size={16} aria-hidden />
              {site.region}
            </span>
          </address>
        </div>

        <div className={styles.bottom}>
          <span>
            {site.legal.entity}, УНП {site.legal.unp}
          </span>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </Container>
    </footer>
  );
}
