import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import { ExternalLink, LogOut, type LucideIcon } from "lucide-react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useLockBodyScroll } from "~/hooks/useLockBodyScroll";
import { Publish } from "./Publish";
import styles from "./MobileMenu.module.scss";

/**
 * Шторка меню на телефоне.
 *
 * В нижней панели помещается четыре раздела и кнопка посередине; разделов
 * шесть, а кроме них есть публикация, ссылка на сайт и выход. Всё это
 * в полосу шириной с телефон не встаёт — попытка втиснуть кончается
 * подписями в шесть точек, по которым нельзя попасть пальцем.
 *
 * Поэтому в полосе — четыре самых частых раздела, а кнопка посередине
 * открывает то же меню целиком. Разделы в ней продублированы намеренно:
 * человек, открывший шторку, ищет список разделов, а не «остальные два».
 *
 * Снизу вверх, а не сверху вниз: шторка выезжает оттуда же, где палец,
 * и закрывается тем же движением.
 */

export type Section = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export function MobileMenu({
  open,
  sections,
  user,
  onClose,
  onSignOut,
}: {
  open: boolean;
  sections: Section[];
  user: { name: string; role: string };
  onClose: () => void;
  onSignOut: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Уход с задержкой на анимацию. Шторка занимает пол-экрана, и мгновенное
   * исчезновение читается как сбой, а не как закрытие.
   */
  const [leaving, setLeaving] = useState(false);
  const mounted = open || leaving;

  /*
   * Признак ухода поднимается ПРЯМО В РЕНДЕРЕ, а не в эффекте.
   *
   * Эффект выполняется после рендера, и на том кадре, где `open` стал
   * false, `leaving` ещё false — значит `mounted` тоже false, и шторка
   * успевала исчезнуть мгновенно. Следом эффект поднимал `leaving`,
   * шторка возвращалась и только тогда играла уход. Отсюда и рывок:
   * пропала — появилась — уехала.
   *
   * Сравнение с предыдущим значением в теле компонента — приём из самой
   * документации React для таких случаев: лишний рендер он вызывает
   * до отрисовки, поэтому на экране промежуточное состояние не появляется.
   * Тем же способом сбрасывается счётчик показанных карточек в каталоге.
   */
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setLeaving(!open);
  }

  useLockBodyScroll(mounted);
  useFocusTrap(open, panelRef, { onEscape: onClose });

  // Страховка: убрать разметку, даже если событие анимации не придёт.
  // Затемнение — прозрачный слой во весь экран, и застрявший поверх
  // страницы означает, что админка перестала отзываться совсем.
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(false), 600);
    return () => clearTimeout(timer);
  }, [leaving]);

  if (!mounted) return null;

  const out = !open;

  return (
    <div className={styles.layer} role="presentation">
      <button
        type="button"
        className={out ? `${styles.backdrop} ${styles.out}` : styles.backdrop}
        aria-label="Закрыть меню"
        tabIndex={-1}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={out ? `${styles.sheet} ${styles.out}` : styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Меню админки"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && out) setLeaving(false);
        }}
      >
        {/* Полоска-ручка: показывает, что шторку можно закрыть, и задаёт
            верхнюю границу — без неё панель сливается с краем экрана. */}
        <span className={styles.grip} aria-hidden />

        <nav className={styles.links}>
          {sections.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={onClose}
            >
              <Icon aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.publish}>
          <Publish />
        </div>

        <div className={styles.foot}>
          <span className={styles.avatar} aria-hidden>
            {user.name.trim().charAt(0).toUpperCase() || "?"}
          </span>

          <span className={styles.who}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.role}>{user.role}</span>
          </span>

          <a
            className={styles.action}
            href="/"
            target="_blank"
            rel="noreferrer"
            title="Открыть сайт в новой вкладке"
            aria-label="Открыть сайт в новой вкладке"
          >
            <ExternalLink aria-hidden />
          </a>

          <button
            type="button"
            className={`${styles.action} ${styles.exit}`}
            onClick={onSignOut}
            title="Выйти"
            aria-label="Выйти"
          >
            <LogOut aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
