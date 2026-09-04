import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { NavLink, useLocation } from "react-router";
import { Menu, X, Phone } from "lucide-react";
import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import { Logo } from "../Logo/Logo";
import { headerNav, site } from "~/config/site";
import {
  overlayVariants,
  menuVariants,
  navVariants,
  navItemVariants,
} from "~/lib/animations";
import styles from "./Header.module.scss";

export function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Портал бьёт в document.body, которого нет во время пререндера.
  useEffect(() => setMounted(true), []);

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

  /**
   * Управление фокусом. При открытии он уходит внутрь шторки, при закрытии
   * возвращается на кнопку — иначе после Escape человек с клавиатуры
   * оказывается в начале страницы и не понимает, где он был.
   *
   * Плюс ловушка: Tab не должен уводить на страницу, скрытую под шторкой.
   */
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      // На первом рендере шторка и так закрыта, возвращать фокус неоткуда.
      // Без этой проверки при загрузке страницы фокус молча уезжает на бургер.
      if (wasOpen.current) burgerRef.current?.focus();
      return;
    }
    wasOpen.current = true;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );

    focusable()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Logo />

        {/* Меню и кнопка — одна группа справа, как в макете.
            Раньше они стояли по разным краям и визуально не связывались. */}
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Основное меню">
            {headerNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button to="/contacts" className={styles.cta}>
            Связаться
          </Button>

          <button
            ref={burgerRef}
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

      {/* Шторка уезжает в body, а не остаётся внутри <header>.
          У шапки backdrop-filter, а он создаёт containing block для
          position: fixed — внутри неё inset: 0 меряется от шапки,
          и меню схлопывается в полоску высотой 4.5rem.

          AnimatePresence должен быть смонтирован постоянно, иначе он не
          успеет проиграть выход. Поэтому в портал уходит он сам,
          а не результат проверки open. */}
      {mounted &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {open && (
                <>
                  {/* Затемнение кликабельно: закрыть промахом мимо панели —
                      привычный жест, и он быстрее, чем целиться в крестик. */}
                  <motion.div
                    className={styles.overlay}
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={() => setOpen(false)}
                    aria-hidden
                  />

                  <motion.div
                    ref={dialogRef}
                    className={styles.panel}
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Меню"
                  >
                    <button
                      type="button"
                      className={styles.close}
                      aria-label="Закрыть меню"
                      onClick={() => setOpen(false)}
                    >
                      <X size={30} aria-hidden />
                    </button>

                    <motion.div
                      className={styles.panelInner}
                      variants={navVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <nav
                        className={styles.mobileNav}
                        aria-label="Основное меню"
                      >
                        {headerNav.map((item) => (
                          <motion.div key={item.to} variants={navItemVariants}>
                            <NavLink
                              to={item.to}
                              end={item.to === "/"}
                              className={({ isActive }) =>
                                isActive
                                  ? `${styles.mobileLink} ${styles.mobileActive}`
                                  : styles.mobileLink
                              }
                            >
                              {item.label}
                            </NavLink>
                          </motion.div>
                        ))}
                      </nav>

                      <motion.div
                        className={styles.mobileActions}
                        variants={navItemVariants}
                      >
                        <Button
                          to="/contacts"
                          size="lg"
                          className={styles.mobileCta}
                        >
                          Связаться
                        </Button>
                        {/* Телефон оставлен, хотя в alex-build его нет: там
                            сайт ведёт в форму, а тут звонок — основной
                            способ оставить заявку. */}
                        <a className={styles.call} href={site.phoneHref}>
                          <Phone size={18} aria-hidden />
                          {site.phone}
                        </a>
                        <span className={styles.hours}>{site.workHours}</span>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </MotionConfig>,
          document.body,
        )}
    </header>
  );
}
