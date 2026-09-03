import type { IconName } from "~/lib/icons";

export type Advantage = {
  title: string;
  text: string;
  icon: IconName;
};

/**
 * Компактная полоса под hero. Подписи короткие в две строки:
 * заголовок и уточнение — так они не спорят с H1 за внимание.
 */
export const advantages: Advantage[] = [
  { title: "Официальная гарантия", text: "до 5 лет", icon: "shield" },
  { title: "Быстрая установка", text: "от 1 дня", icon: "timer" },
  { title: "Честные цены", text: "без переплат", icon: "wallet" },
];

/** Подпункты синего баннера «Работаю один». */
export const brandPoints: Advantage[] = [
  {
    title: "Прямая связь",
    text: "общаетесь со мной, без менеджеров",
    icon: "headphones",
  },
  {
    title: "Честные цены",
    text: "без наценки посредников",
    icon: "wallet",
  },
  {
    title: "Ответственность",
    text: "за результат отвечаю лично",
    icon: "user",
  },
  {
    title: "Гарантия качества",
    text: "на работы и оборудование",
    icon: "shield",
  },
];
