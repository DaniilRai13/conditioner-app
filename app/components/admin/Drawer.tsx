import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useLockBodyScroll } from "~/hooks/useLockBodyScroll";
import styles from "./Drawer.module.scss";

/**
 * Панель, выезжающая справа.
 *
 * Нужна там, где правок у одной записи много, а записей на экране должно
 * помещаться сразу много. Развёрнутая форма у каждой карточки — это
 * пятьдесят форм, из которых работают с одной; список превращается
 * в километр, и найти в нём нужное можно только прокруткой.
 *
 * Справа, а не по центру: список за панелью остаётся виден, и после правки
 * не приходится заново искать, где ты был. Модальное окно посередине
 * закрывает именно то место, к которому вернёшься.
 */
export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  onExited,
  restoreTo,
  children,
  footer,
}: {
  /** false включает уход; разметку убирает уже вызывающая сторона по onExited. */
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  /** Анимация ухода доиграла — можно забыть, что редактировали. */
  onExited?: () => void;
  /** Куда вернуть фокус после закрытия — карточка, которую открыли. */
  restoreTo?: RefObject<HTMLElement | null>;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(open);
  useFocusTrap(open, panelRef, { restoreTo, onEscape: onClose });

  /**
   * Страховка: убрать разметку, даже если событие анимации не придёт.
   *
   * Цена промаха здесь несоразмерна. Затемнение — прозрачный слой во весь
   * экран: он не виден, но нажатия принимает, и застрявший поверх страницы
   * означает, что админка перестала отзываться совсем, без единого следа
   * в консоли. Таймер длиннее самой анимации и в норме не срабатывает.
   */
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => onExited?.(), 600);
    return () => clearTimeout(timer);
  }, [open, onExited]);

  return (
    <div className={styles.layer} role="presentation">
      {/* Затемнение кликабельно: промах мимо панели — самый частый способ
          закрыть такое окно, и человек ждёт, что он сработает. */}
      <button
        type="button"
        className={open ? styles.backdrop : `${styles.backdrop} ${styles.out}`}
        aria-label="Закрыть"
        tabIndex={-1}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={open ? styles.panel : `${styles.panel} ${styles.out}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={(e) => {
          // Только собственная анимация панели: события анимаций всплывают,
          // и любой мигающий значок внутри закрывал бы окно за компанию.
          if (e.target === e.currentTarget && !open) onExited?.();
        }}
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Закрыть"
            title="Закрыть"
          >
            <X aria-hidden />
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.foot}>{footer}</footer>}
      </div>
    </div>
  );
}

/**
 * Состояние панели: что редактируем и уезжает ли она сейчас.
 *
 * Два состояния, а не одно, потому что анимация ухода длится дольше самого
 * закрытия: `value` держит запись, пока панель ещё на экране, `open` уже
 * false. Сбросить value сразу — панель успела бы моргнуть пустой.
 */
export function useDrawer<T>() {
  const [value, setValue] = useState<T | null>(null);
  const [open, setOpen] = useState(false);

  // Колбэки стабильные: `forget` уходит в зависимости эффекта со страховочным
  // таймером, и новая функция на каждый рендер перезапускала бы этот таймер
  // без конца — панель осталась бы в разметке ровно до тех пор, пока
  // страница перерисовывается.
  const show = useCallback((next: T) => {
    setValue(next);
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  /** Отдаётся в onExited. */
  const forget = useCallback(() => setValue(null), []);

  return { value, open, show, hide, forget };
}
