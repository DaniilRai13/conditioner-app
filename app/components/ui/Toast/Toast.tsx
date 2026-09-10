import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useMounted } from "~/hooks/useMounted";
import { toastVariants } from "~/lib/animations";
import styles from "./Toast.module.scss";

type Props = {
  open: boolean;
  title: string;
  text?: string;
  onClose: () => void;
  /** Через сколько закрыть само, мс. 0 — не закрывать. */
  duration?: number;
};

/**
 * Всплывающее уведомление в правом нижнем углу.
 *
 * Через портал в body — как мобильная шторка, и по той же причине:
 * `position: fixed` внутри предка с `backdrop-filter` отсчитывается
 * от этого предка, а не от окна. Формы у нас стоят и в стеклянных
 * панелях тоже, и уведомление уехало бы внутрь панели.
 *
 * `role="status"` с `aria-live="polite"` — экранный диктор произнесёт
 * текст, не перебивая себя и не забирая фокус. Фокус здесь трогать
 * нельзя: человек только что нажал «отправить», и увести его курсор
 * в уведомление — значит потерять место, где он работал.
 *
 * Закрывается само через `duration`, но кнопка есть всегда: автозакрытие
 * без ручного оставляет тех, кто читает медленно, ни с чем.
 */
export function Toast({ open, title, text, onClose, duration = 6000 }: Props) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open || duration === 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  // Escape закрывает — привычка из любого модального окна.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.toast}
            role="status"
            aria-live="polite"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span className={styles.icon} aria-hidden>
              <Check size={18} />
            </span>

            <span className={styles.body}>
              <b className={styles.title}>{title}</b>
              {text && <span className={styles.text}>{text}</span>}
            </span>

            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Закрыть уведомление"
            >
              <X size={16} aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
