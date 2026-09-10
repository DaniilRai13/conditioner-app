import { useState } from "react";
import type { LeadInput } from "~/lib/lead-schema";

export type LeadStatus = "idle" | "sending" | "sent" | "error";

/**
 * Отправка заявки на сервер.
 *
 * Вынесено из формы, чтобы та занималась полями и разметкой: адрес
 * обработчика, состояние отправки и сбор служебных данных — это не про
 * вёрстку, а поменять их придётся при первом же переезде на другой хостинг.
 *
 * Ошибку наружу отдаём одним состоянием без подробностей. Разбор ответа
 * человеку ничего не даёт: что 500 у нас, что оборванная сеть у него —
 * действие одно, позвонить. Подробности остаются в логах сервера.
 */
export function useLeadSubmit() {
  const [status, setStatus] = useState<LeadStatus>("idle");

  async function submit(values: LeadInput): Promise<boolean> {
    setStatus("sending");
    try {
      // Адрес страницы добавляем в момент отправки, а не в значения
      // по умолчанию: форма рендерится и на пререндере, где window нет.
      // Хеш отбрасываем — «#lead» в сообщении ничего не сообщает.
      const page =
        typeof window === "undefined"
          ? undefined
          : window.location.origin +
            window.location.pathname +
            window.location.search;

      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, page }),
      });

      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  return { status, submit, reset: () => setStatus("idle") };
}
