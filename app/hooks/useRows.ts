import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, ApiResponse } from "~/lib/api";

export interface RowsResult<T> {
  rows: T[];
  /** Первая загрузка: показывать нечего, на экране заглушка. */
  loading: boolean;
  /**
   * Перезагрузка по кнопке: данные на экране есть, но идёт новый запрос.
   *
   * Отдельно от `loading`, и это главное здесь. Поднять `loading` на
   * обновлении значило бы стереть список и заменить его словом «Загружаю…»,
   * а потом вернуть почти то же самое — экран моргает, место прокрутки
   * теряется. Список остаётся на месте, а признак работы живёт на кнопке,
   * которую нажали.
   */
  refreshing: boolean;
  error: ApiError | null;
  refresh: () => void;
  /** Правка строки на месте, без похода в базу — для мгновенного отклика. */
  patch: (id: string, fields: Partial<T>) => void;
}

/**
 * Загрузка списка из базы.
 *
 * Один хук на все разделы: заявки, цены, товары, отзывы и работы читаются
 * одинаково — запрос, список, ошибка, перезагрузка. Отдельный хук на таблицу
 * означал бы пять копий одного и того же с разными именами.
 *
 * Ни постраничной выдачи, ни подписки на изменения здесь нет и не нужно:
 * данных сотни строк, а правит их один человек за раз.
 */
export function useRows<T extends { id: string }>(
  load: () => Promise<ApiResponse<T[]>>
): RowsResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Номер запроса: пока идёт медленный, человек мог нажать «обновить»
  // ещё раз. Без этого ответ первого приходит последним и затирает свежие
  // данные старыми.
  const requestId = useRef(0);

  const run = useCallback(async (byHand = false) => {
    const id = ++requestId.current;
    if (byHand) setRefreshing(true);

    const result = await load();

    // Ответ устаревшего запроса. Признак работы не снимаем: его снимет
    // тот запрос, который его и поднял, — более свежий, он ещё в пути.
    if (id !== requestId.current) return;

    if (result.error) {
      setError(result.error);
    } else {
      setRows(result.data);
      setError(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    void run();
  }, [run]);

  const patch = useCallback((id: string, fields: Partial<T>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...fields } : row))
    );
  }, []);

  return {
    rows,
    loading,
    refreshing,
    error,
    refresh: () => void run(true),
    patch,
  };
}
