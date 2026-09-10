import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";

/**
 * Навигация стрелками внутри группы — как в нативном radiogroup.
 *
 * В настоящей группе радиокнопок стрелки переключают вариант, а Tab
 * перепрыгивает группу целиком. У нас варианты сделаны кнопками, и без
 * этого хука стрелки не делали бы ничего: человек с клавиатуры получил бы
 * поведение, отличное от того, к которому его приучила любая другая форма.
 *
 * Возвращает обработчик для контейнера и ref, который на него вешают.
 * Внутри — обычные `<button>`; хук находит их сам, поэтому список вариантов
 * может меняться от шага к шагу.
 */
export function useRovingFocus<T extends HTMLElement>(options: {
  /** Номер текущего шага: на его смену фокус переезжает на первый вариант. */
  step: number;
  /** Пока истинно, фокус не трогаем — группы на экране больше нет. */
  disabled?: boolean;
}): {
  ref: RefObject<T | null>;
  onKeyDown: (e: KeyboardEvent<T>) => void;
} {
  const { step, disabled = false } = options;
  const ref = useRef<T>(null);

  // Первый рендер фокус не забирает: иначе страница, открытая с нуля, сама
  // уводила бы экран к группе, мимо заголовка.
  const started = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (!started.current) {
      started.current = true;
      return;
    }
    // Без этого после ответа приходится табать через всю панель заново.
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [step, disabled]);

  function onKeyDown(e: KeyboardEvent<T>) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(e.key)) return;

    const items = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    e.preventDefault();
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    // По кругу: с последнего вниз — на первый. Так же ведёт себя нативная
    // группа радиокнопок.
    const next = (index + (forward ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return { ref, onKeyDown };
}
