import { useCallback, useRef, useState } from "react";
import type { ApiError, ApiResponse } from "~/lib/api";

/**
 * Сохранение одного поля с отложенной отправкой.
 *
 * Правки в админке точечные: поменял цену, переключил галочку, дописал
 * заметку. Кнопка «Сохранить» на каждую такую мелочь — лишний клик и лишний
 * повод забыть нажать. Поэтому сохраняем сами, но не на каждую нажатую
 * клавишу: пауза в 600 мс превращает набранную строку в один запрос вместо
 * двадцати.
 *
 * Подтверждение показывается три секунды и гаснет: постоянная надпись
 * «сохранено» перестаёт значить что-либо через минуту работы.
 */
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const timer = useRef<number | undefined>(undefined);
  const hide = useRef<number | undefined>(undefined);

  const run = useCallback(async (send: () => Promise<ApiResponse<unknown>>) => {
    setSaving(true);
    const result = await send();
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return false;
    }

    setError(null);
    setSaved(true);
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setSaved(false), 3000);
    return true;
  }, []);

  /** Отложенное сохранение: для полей, которые набирают с клавиатуры. */
  const save = useCallback(
    (send: () => Promise<ApiResponse<unknown>>, delay = 600) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void run(send), delay);
    },
    [run]
  );

  /** Немедленное: для галочек и выпадающих списков, где паузы не нужно. */
  const saveNow = useCallback(
    (send: () => Promise<ApiResponse<unknown>>) => void run(send),
    [run]
  );

  return { save, saveNow, saving, saved, error };
}
