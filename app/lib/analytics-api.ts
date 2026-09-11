import { fail, ok, type ApiResponse } from "./api";
import { getSupabase, toApiError } from "./supabase";
import type { LeadRow } from "./admin-api";

/**
 * Цифры для главной админки.
 *
 * Разделены на две независимые половины, и это главное решение в файле.
 *
 * Заявки считаются здесь, в браузере, из тех же строк, что показывает
 * раздел «Заявки». Это работает сразу, без единой правки в базе, и не даёт
 * второго определения того, что такое заявка: представление в SQL и список
 * на экране разошлись бы при первом же изменении статусов.
 *
 * Посещения читаются из представлений (database/analytics.sql). Их может
 * не быть вовсе — пока сайт не выложен и /api/track не работает, таблицы
 * пустые или не созданы. Поэтому неудача здесь не считается ошибкой
 * страницы: заявки от этого не зависят и показываются как обычно.
 *
 * Ни одна строка отсюда не пишется. Посещения кладёт /api/track сервисным
 * ключом, заявки — /api/lead; оба живут на сервере. Анонимному ключу эти
 * таблицы недоступны, вошедшему — только чтение.
 */

export interface DayPoint {
  /** Минская дата, `YYYY-MM-DD`. */
  day: string;
  hits: number;
  visitors: number;
}

export interface PathStat {
  path: string;
  hits: number;
  visitors: number;
}

export interface SourceStat {
  source: string;
  hits: number;
  visitors: number;
}

export interface Traffic {
  days: DayPoint[];
  paths: PathStat[];
  referrers: SourceStat[];
  /**
   * Посещений за всё время.
   *
   * Не «уникальных людей»: отпечаток посетителя содержит дату и перестаёт
   * совпадать в полночь — именно это и позволяет считать без единой куки.
   * Один человек в два дня — два отпечатка, и никакая сумма не сведёт их
   * обратно. Значит, сумма по дням — это в точности число посещений,
   * и называть её иначе нельзя.
   */
  totalVisits: number;
  /** Первый день с трафиком или null, пока его не было. */
  since: string | null;
}

/** `YYYY-MM-DD` за `days` дней до сегодня. */
function since(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Посещения. Может не получиться — и это нормальное состояние, а не сбой:
 * счётчик заработает вместе с хостингом.
 */
export async function getTraffic(days = 30): Promise<ApiResponse<Traffic>> {
  const from = since(days);
  const db = getSupabase();

  // Посещения по дням приходят целиком, а не за период: строка на день —
  // это несколько сотен строк за годы, зато сумма за всё время достаётся
  // без второго запроса.
  const [daily, paths, referrers] = await Promise.all([
    db.from("page_views_daily").select("day, hits, visitors"),
    db
      .from("page_views_by_path")
      .select("path, hits, visitors")
      .order("visitors", { ascending: false })
      .limit(12),
    db
      .from("page_views_by_referrer")
      .select("source, hits, visitors")
      .order("visitors", { ascending: false })
      .limit(8),
  ]);

  const failed = daily.error ?? paths.error ?? referrers.error;
  if (failed) {
    return fail(toApiError(failed, "Статистика посещений недоступна."));
  }

  // По возрастанию дня: график читается слева направо, а представления
  // порядок не гарантируют.
  const allDays = [...((daily.data ?? []) as DayPoint[])].sort((a, b) =>
    a.day.localeCompare(b.day)
  );

  return ok({
    days: allDays.filter((row) => row.day >= from),
    paths: (paths.data ?? []) as PathStat[],
    referrers: (referrers.data ?? []) as SourceStat[],
    totalVisits: allDays.reduce((sum, row) => sum + row.visitors, 0),
    since: allDays[0]?.day ?? null,
  });
}

// --- заявки: считаем из строк, которые и так загружены -------------------

export interface LeadDay {
  day: string;
  total: number;
  done: number;
}

export interface LeadSource {
  source: string;
  total: number;
  last30: number;
}

/**
 * Минская дата строки заявки.
 *
 * Именно минская, а не UTC: заявка, оставленная в одиннадцать вечера,
 * по Гринвичу относится к следующему дню, и в графике «вчера» и «сегодня»
 * менялись бы местами каждый вечер.
 */
function minskDay(iso: string): string {
  // sv-SE даёт ровно YYYY-MM-DD — единственная локаль, у которой формат
  // по умолчанию совпадает с ISO.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Minsk" }).format(
    new Date(iso)
  );
}

/** Заявки по дням за период. */
export function leadsByDay(leads: LeadRow[], from: string): LeadDay[] {
  const map = new Map<string, LeadDay>();

  for (const lead of leads) {
    const day = minskDay(lead.created_at);
    if (day < from) continue;

    const point = map.get(day) ?? { day, total: 0, done: 0 };
    point.total += 1;
    if (lead.status === "done") point.done += 1;
    map.set(day, point);
  }

  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Откуда приходят заявки: форма первого экрана, подбор, карточка товара.
 *
 * Это ответ на «какой блок сайта работает». Посещения отвечают только
 * на «куда смотрят», а деньги приносит второе.
 */
export function leadsBySource(leads: LeadRow[]): LeadSource[] {
  const from = since(30);
  const map = new Map<string, LeadSource>();

  for (const lead of leads) {
    const key = lead.source || "не указан";
    const row = map.get(key) ?? { source: key, total: 0, last30: 0 };
    row.total += 1;
    if (minskDay(lead.created_at) >= from) row.last30 += 1;
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export { since as daysAgo };
