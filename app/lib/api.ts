/**
 * Ответ операции с базой: либо данные, либо ошибка, никогда не оба.
 *
 * Исключений здесь нет намеренно. В админке почти каждая ошибка — не сбой
 * программы, а сообщение человеку: «нет прав», «сессия истекла», «не дозвонились
 * до сервера». Через throw такое приходится ловить в каждом обработчике,
 * и один забытый catch роняет страницу вместо одной кнопки.
 */

export type ApiErrorCode =
  | "unknown"
  | "network"
  | "validation"
  | "not-found"
  | "permission-denied"
  | "auth/no-session"
  | "auth/no-profile"
  | "auth/invalid-credentials"
  // Публикация: у неё несколько разных причин отказа, и от причины
  // зависит, что делать человеку — подождать, войти заново или позвать
  // разработчика. Одним «unknown» их не различить.
  | "publish/offline"
  | "publish/no-hook"
  | "publish/not-configured"
  | "publish/unauthorized"
  | "publish/too-soon"
  | "publish/failed";

export interface ApiError {
  code: ApiErrorCode;
  /** Текст для человека: показывается как есть. */
  message: string;
  /** Код Postgres или HTTP-статус — для консоли, не для экрана. */
  details?: string;
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export const ok = <T>(data: T): ApiResponse<T> => ({ data, error: null });
export const fail = <T>(error: ApiError): ApiResponse<T> => ({
  data: null,
  error,
});
