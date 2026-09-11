import type { LeadInput } from "./lead-schema";
// С расширением: этот модуль запускает и Node напрямую (scripts/check-lead.ts,
// lead-handler.ts), а он импорт без расширения не находит. Соседний импорт
// типа обходится без него только потому, что типы Node стирает, не разрешая.
import { shortPage } from "./format.ts";

/**
 * Заявка в текст для телеграма.
 *
 * Отдельно от обработчика и без обращений к сети — чистая функция, которую
 * можно прогнать скриптом (`npm run check:lead`). Форматирование ломается
 * тихо: телеграм на кривую разметку отвечает ошибкой, а узнаёшь ты об этом
 * от заказчика, который не дождался заявки.
 *
 * Разметка HTML, а не Markdown: в Markdown пришлось бы экранировать
 * полтора десятка символов, включая точку и минус, — то есть почти любой
 * текст из поля «сообщение».
 *
 * Макет выбран из семи (черновик — `scripts/lead-layouts.ts`): значки
 * вместо ярлыков. Заявку читают, когда человек за рулём или на объекте,
 * боковым зрением — значки различают строки без чтения, а подписи
 * «Имя:», «Телефон:» отнимают ширину у самих значений.
 */

/** Откуда пришла заявка — человеческим языком, а не ключом из формы. */
const SOURCES: Record<LeadInput["source"], string> = {
  hero: "первый экран",
  quiz: "подбор",
  product: "карточка товара",
  solution: "готовое решение",
  footer: "форма внизу страницы",
  modal: "обратный звонок",
  home: "главная",
};

/**
 * Ответы подбора в короткие обороты: они идут одной строкой через
 * разделитель, и подписи вида «Обогрев зимой: нужен» её бы разорвали.
 *
 * Ключи составные, «вопрос:ответ»: «yes» встречается в разных вопросах
 * и в каждом значит своё. Чего нет в словаре, показываем как есть —
 * сырой ключ в сообщении лучше молча потерянного ответа.
 */
const QUIZ_SHORT: Record<string, string> = {
  "place:flat": "квартира",
  "place:house": "частный дом",
  "place:office": "офис",
  "place:other": "помещение",
  "heat:yes": "с обогревом",
  "heat:no": "без обогрева",
  "heat:unknown": "обогрев не решил",
  "windows:1": "одно окно",
  "windows:2": "два окна",
  "windows:3": "три окна и больше",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");


/** Минское время: сервер стоит неизвестно где, а звонить будут отсюда. */
function minskTime(now: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

/** Ответы подбора одной строкой, в порядке вопросов. */
function shortAnswers(answers: Record<string, string>): string {
  const order = ["area", "place", "heat", "windows"];
  const parts: string[] = [];

  for (const key of order) {
    const value = answers[key];
    if (!value) continue;
    if (key === "area") {
      parts.push(/^\d+$/.test(value) ? `до ${value} м²` : value);
      continue;
    }
    parts.push(QUIZ_SHORT[`${key}:${value}`] ?? value);
  }

  // Ключи вне известного порядка: подбор мог обзавестись новым вопросом,
  // а сюда его добавить забыли. Молча терять ответ нельзя.
  for (const [key, value] of Object.entries(answers)) {
    if (!order.includes(key)) parts.push(`${key}: ${value}`);
  }

  return parts.map(escape).join(" · ");
}

export function formatLeadMessage(
  lead: LeadInput,
  siteUrl: string,
  now: Date = new Date(),
): string {
  const lines: string[] = [];

  lines.push("🔔 <b>Новая заявка</b>");
  lines.push("");

  // Имя и телефон первыми: по заявке нужно перезвонить, остальное
  // читается уже во время разговора.
  lines.push(`👤 <b>${escape(lead.name)}</b>`);
  lines.push(
    `📞 <a href="tel:${lead.phone.replace(/\D/g, "")}">${lead.phone}</a>`,
  );

  const answers = lead.quizAnswers ?? {};
  if (Object.keys(answers).length) {
    lines.push(`📐 ${shortAnswers(answers)}`);
  }

  if (lead.message) {
    lines.push(`💬 ${escape(lead.message)}`);
  }

  lines.push("");

  if (lead.productSlug) {
    const url = `${siteUrl.replace(/\/$/, "")}/product/${lead.productSlug}`;
    lines.push(`🛒 <a href="${escape(url)}">${escape(lead.productSlug)}</a>`);
  }

  if (lead.page) {
    lines.push(
      `📄 <a href="${escape(lead.page)}">${escape(shortPage(lead.page))}</a>`,
    );
  }

  lines.push(
    `🕒 ${minskTime(now)} · ${escape(SOURCES[lead.source] ?? lead.source)}`,
  );

  return lines.join("\n");
}
