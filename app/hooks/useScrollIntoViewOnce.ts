import { useEffect, useRef, type RefObject } from "react";

/**
 * Прокручивает к элементу в тот момент, когда `done` впервые становится
 * истиной — и ровно один раз.
 *
 * Придумано для результата подбора, но случай общий: показать человека
 * итог работы, которую он только что закончил.
 *
 * Главное здесь — чего хук НЕ делает. Он не прокручивает, если `done`
 * истинно уже на первом рендере: так бывает, когда человек пришёл
 * по готовой ссылке со всеми ответами в адресе. Он подбор не проходил,
 * прыжка не ждёт, и увозить ему страницу вниз — то же самое, что
 * встретить гостя, утащив его из прихожей в дальнюю комнату.
 *
 * Системное «меньше движения» уважается: плавная прокрутка становится
 * мгновенной, но происходит — иначе итог просто не покажется.
 */
export function useScrollIntoViewOnce(
  done: boolean,
  ref: RefObject<HTMLElement | null>,
): void {
  // null — эффект ещё не отработал ни разу. Первый проход только запоминает
  // состояние, поэтому «пришёл с готовым ответом» не считается переходом.
  const wasDone = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasDone.current === null) {
      wasDone.current = done;
      return;
    }

    if (done && !wasDone.current) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      ref.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    }

    wasDone.current = done;
  }, [done, ref]);
}
