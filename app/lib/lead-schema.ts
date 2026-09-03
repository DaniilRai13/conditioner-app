import { z } from "zod";

/**
 * Одна схема на клиент и на сервер. В `api/lead.ts` тот же parse:
 * клиентскую валидацию обходят curl-ом за секунду, а через эту форму
 * мы пишем в базу и шлём в телеграм (PLAN.md §8).
 */
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Как к вам обращаться?")
    .max(80, "Слишком длинное имя"),

  // Маска на вводе даёт ровно 19 символов: +375 (29) 123-45-67
  phone: z
    .string()
    .trim()
    .regex(/^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/, "Введите телефон полностью"),

  message: z.string().trim().max(1000, "Слишком длинное сообщение").optional(),

  consent: z.literal(true, {
    message: "Без согласия я не смогу обработать заявку",
  }),

  source: z.enum(["hero", "quiz", "product", "solution", "footer", "modal", "home"]),
  productSlug: z.string().optional(),
  quizAnswers: z.record(z.string(), z.string()).optional(),

  // Ловушка для ботов: поле спрятано от людей и должно остаться пустым.
  company: z.string().max(0).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Приводит любой ввод к виду +375 (29) 123-45-67. */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("375")) digits = digits.slice(3);
  else if (digits.startsWith("80")) digits = digits.slice(2);

  digits = digits.slice(0, 9);

  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ];

  let out = "+375";
  if (parts[0]) out += ` (${parts[0]}`;
  if (parts[0].length === 2) out += ")";
  if (parts[1]) out += ` ${parts[1]}`;
  if (parts[2]) out += `-${parts[2]}`;
  if (parts[3]) out += `-${parts[3]}`;

  return out;
}
