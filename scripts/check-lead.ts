import { leadSchema, type LeadInput } from "../app/lib/lead-schema.ts";
import { formatLeadMessage } from "../app/lib/lead-message.ts";

/**
 * Проверка приёма заявки без сети и без телеграма.
 *
 * Тестового рантайма в проекте нет, а ломается тут тихо: телеграм на кривую
 * разметку отвечает ошибкой, и узнаёшь об этом от заказчика, который не
 * дождался заявки. Проверяем две вещи — что схема отсекает мусор и что
 * сообщение собирается валидным HTML.
 *
 * Запуск: npm run check:lead
 */

let failed = 0;
const ok = (name: string, condition: boolean) => {
  console.log((condition ? "  + " : "  ! ") + name);
  if (!condition) failed++;
};

const base: LeadInput = {
  name: "Иван",
  phone: "+375 (29) 123-45-67",
  consent: true,
  source: "home",
};

console.log("Схема:");
ok("нормальная заявка проходит", leadSchema.safeParse(base).success);
ok(
  "телефон не по маске отклоняется",
  !leadSchema.safeParse({ ...base, phone: "+375291234567" }).success
);
ok(
  "без согласия отклоняется",
  !leadSchema.safeParse({ ...base, consent: false }).success
);
ok(
  "короткое имя отклоняется",
  !leadSchema.safeParse({ ...base, name: "И" }).success
);
ok(
  "чужой источник отклоняется",
  !leadSchema.safeParse({ ...base, source: "spam" }).success
);
ok(
  "заполненная ловушка отклоняется",
  !leadSchema.safeParse({ ...base, company: "ООО Рога" }).success
);

console.log("\nСообщение:");
const full = formatLeadMessage(
  {
    ...base,
    name: "Иван <b>",
    message: "Спальня 18 м², 5 этаж & окна на юг",
    source: "product",
    productSlug: "electrolux-monaco-eacs-i-07hm-n8",
    quizAnswers: { area: "35", place: "flat", heat: "yes", windows: "2" },
    page: "https://example.by/solutions/bedroom-20?utm_source=vk",
  },
  "https://example.by",
  new Date("2026-09-10T09:30:00Z")
);

ok("угловые скобки в имени экранированы", full.includes("Иван &lt;b&gt;"));
ok("амперсанд в сообщении экранирован", full.includes("&amp; окна"));
ok("площадь с единицей измерения", full.includes("до 35 м²"));
ok("ответы подбора одной строкой", full.includes("📐 до 35 м² · квартира · с обогревом · два окна"));
ok("значки на месте", ["🔔","👤","📞","📐","💬","🛒","📄","🕒"].every((e) => full.includes(e)));
ok("телефон кликабельный", full.includes('href="tel:375291234567"'));
ok("ссылка на товар есть", full.includes("/product/electrolux-monaco"));
ok("источник подписан", full.includes("карточка товара"));
ok("страница показана путём", full.includes(">/solutions/bedroom-20?utm_source=vk<"));
ok("ссылка на страницу полная", full.includes(`href="https://example.by/solutions/bedroom-20`));
ok("время по Минску", full.includes("12:30"));

// Парность тегов: телеграм не прощает незакрытых и вернёт «can't parse
// entities», а сообщение просто не придёт.
const tags = full.match(/<\/?[a-z]+/g) ?? [];
const open = tags.filter((t) => !t.startsWith("</")).length;
const close = tags.filter((t) => t.startsWith("</")).length;
ok(`теги парные (${open} открывающих, ${close} закрывающих)`, open === close);

// Локальный адрес подписываем с портом: только по нему и видно,
// с какого из двух локальных серверов пришла проверка.
const local = formatLeadMessage(
  { ...base, page: "http://localhost:5173/price" },
  "https://example.by"
);
ok("локальный адрес с портом", local.includes(">localhost:5173/price<"));

const short = formatLeadMessage(base, "https://example.by");
ok("минимальная заявка собирается", short.includes("+375 (29) 123-45-67"));
ok("без подбора строки с площадью нет", !short.includes("📐"));
ok("без адреса строки «Страница» нет", !short.includes("Страница:"));

console.log("\n--- пример сообщения ---\n");
console.log(full);

if (failed) {
  console.error(`\nПровалено проверок: ${failed}`);
  process.exit(1);
}
console.log("\nВсе проверки пройдены");
