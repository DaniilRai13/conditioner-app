import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Menu, X, Phone } from "lucide-react";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import { Logo } from "./Logo";
import { nav, site } from "~/config/site";
import styles from "./Header.module.scss";

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Закрываем меню при переходе: без этого после клика по пункту
  // остаётся открытая шторка поверх новой страницы.
  useEffect(() => setOpen(false), [location.pathname]);

  // Блокируем прокрутку под открытым меню.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Logo />

        <nav className={styles.nav} aria-label="Основное меню">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Button to="/contacts" className={styles.cta}>
            Связаться
          </Button>
          <button
            type="button"
            className={styles.burger}
            aria-label="Открыть меню"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
        </div>
      </Container>

      {open && (
        <div className={styles.mobile} role="dialog" aria-label="Меню">
          <Container className={styles.mobileInner}>
            <button
              type="button"
              className={styles.close}
              aria-label="Закрыть меню"
              onClick={() => setOpen(false)}
            >
              <X size={24} aria-hidden />
            </button>

            <nav className={styles.mobileNav} aria-label="Основное меню">
              {nav.map((item) => (
                <NavLink key={item.to} to={item.to} className={styles.mobileLink}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <a className={styles.call} href={site.phoneHref}>
              <Phone size={18} aria-hidden />
              {site.phone}
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}
