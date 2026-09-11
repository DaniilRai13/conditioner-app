import { createContext, useContext } from "react";
import type { ApiError } from "~/lib/api";
import type { User } from "~/lib/admin-api";

export interface AuthValue {
  user: User | null;
  loading: boolean;
  error: ApiError | null;
  signIn: (email: string, password: string) => Promise<ApiError | null>;
  signOut: () => Promise<void>;
}

/**
 * Контекст лежит отдельно от провайдера: иначе файл экспортирует и компонент,
 * и обычное значение, а быстрая перезагрузка Vite такой модуль не умеет
 * обновлять — правка провайдера роняла бы состояние всего приложения.
 */
export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth вызван вне AuthProvider.");
  }
  return value;
}
