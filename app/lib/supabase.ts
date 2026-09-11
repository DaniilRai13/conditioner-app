import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ApiError } from "./api";

/**
 * Клиент Supabase для админки.
 *
 * Создаётся при первом обращении, а не при загрузке модуля. Сайт статический
 * и пререндерится целиком: модуль, который падает без переменных окружения,
 * уронил бы сборку публичных страниц из-за инструмента, к которому они
 * отношения не имеют.
 *
 * Anon-ключ попадает в клиентский бандл — так и задумано, но только при
 * включённом RLS. Ключ service_role сюда не кладётся никогда: он обходит
 * RLS полностью и живёт только в серверной функции приёма заявок.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Сообщение вместо «Invalid URL» из недр клиента: иначе причину ищут
    // в коде запроса, а она в незаполненном .env.
    throw new Error(
      "Нет VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY. " +
        "Скопируйте .env.example в .env и подставьте значения из Supabase → " +
        "Project Settings → API."
    );
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Ссылок с токеном в адресе у нас нет: вход только по почте и паролю.
      detectSessionInUrl: false,
    },
  });

  return client;
}

/** Общая форма PostgrestError и AuthError — по ней и различаем. */
interface SupabaseLikeError {
  message: string;
  code?: string;
  status?: number;
}

function isSupabaseLikeError(v: unknown): v is SupabaseLikeError {
  return typeof v === "object" && v !== null && "message" in v;
}

/**
 * Ошибка Supabase в ApiError с текстом, который не стыдно показать.
 *
 * `fallback` — что увидит человек, если ошибка незнакомая. Пишите в нём
 * действие, а не «что-то пошло не так»: «Не удалось сохранить цену».
 */
export function toApiError(error: unknown, fallback: string): ApiError {
  if (!isSupabaseLikeError(error)) {
    return { code: "unknown", message: fallback };
  }

  const details =
    error.code ?? (error.status === undefined ? undefined : String(error.status));
  const raw = error.message.toLowerCase();

  // Отказ RLS. Postgres отдаёт 42501, PostgREST иногда просто 403
  // со словами про row-level security в тексте.
  if (
    error.code === "42501" ||
    error.status === 403 ||
    raw.includes("row-level security")
  ) {
    return {
      code: "permission-denied",
      message: "Нет прав на это действие. Проверьте, что вы вошли.",
      details,
    };
  }

  if (error.code === "PGRST116" || error.status === 404) {
    return { code: "not-found", message: "Запись больше не существует.", details };
  }

  // CHECK или NOT NULL: значение не прошло схему.
  if (error.code === "23514" || error.code === "23502") {
    return { code: "validation", message: "Значения не подходят.", details };
  }

  if (
    error.status === 401 ||
    raw.includes("jwt") ||
    raw.includes("not authenticated")
  ) {
    return {
      code: "auth/no-session",
      message: "Сессия истекла. Войдите заново.",
      details,
    };
  }

  if (raw.includes("invalid login credentials")) {
    return {
      code: "auth/invalid-credentials",
      message: "Неверная почта или пароль.",
      details,
    };
  }

  if (
    raw.includes("failed to fetch") ||
    raw.includes("networkerror") ||
    raw.includes("load failed")
  ) {
    return {
      code: "network",
      message: "Не удалось связаться с сервером. Проверьте интернет.",
      details,
    };
  }

  return { code: "unknown", message: fallback, details };
}
