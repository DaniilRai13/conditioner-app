import { useEffect, useRef, type RefObject } from "react";

/**
 * Ловушка фокуса для слоя поверх страницы.
 *
 * Делает три вещи, и все три нужны человеку с клавиатуры:
 *
 * 1. При открытии уводит фокус внутрь слоя — иначе Tab продолжит ходить
 *    по странице, скрытой под ним.
 * 2. Держит фокус в кольце: с последнего элемента Tab возвращает
 *    на первый, Shift+Tab с первого — на последний.
 * 3. При закрытии возвращает фокус туда, откуда слой открыли. Без этого
 *    после Escape человек оказывается в начале страницы и не понимает,
 *    где он был.
 *
 * Escape отдаётся наружу колбэком, а не закрывает сам: закрытие — дело
 * владельца состояния, хук про фокус.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  options: {
    /** Куда вернуть фокус после закрытия — обычно кнопка, открывшая слой. */
    restoreTo?: RefObject<HTMLElement | null>;
    onEscape?: () => void;
  } = {},
): void {
  const { restoreTo, onEscape } = options;

  // Колбэк в ref, чтобы его пересоздание не перевешивало обработчик:
  // иначе каждый рендер родителя снимал и вешал слушатель заново.
  // Присваивание в эффекте, а не в теле: во время рендера ref трогать
  // нельзя, а обработчик всё равно сработает позже любого рендера.
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  // Открывался ли слой хоть раз. На первом рендере он закрыт, и возвращать
  // фокус неоткуда — без этой проверки при загрузке страницы фокус молча
  // уезжает на кнопку.
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      if (wasActive.current) restoreTo?.current?.focus();
      return;
    }
    wasActive.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Список считается заново на каждое нажатие: содержимое слоя может
    // меняться, а сохранённый при открытии список этого не заметит.
    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );

    focusable()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        escapeRef.current?.();
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
  }, [active, containerRef, restoreTo]);
}
