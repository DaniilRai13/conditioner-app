import type { IconName } from "~/lib/icons";

export type Advantage = {
  title: string;
  text: string;
  icon: IconName;
};

/** Полоса под hero. */
export const advantages: Advantage[] = [
  { title: "Один специалист", text: "от подбора до установки", icon: "user" },
  { title: "Честные цены", text: "без скрытых наценок", icon: "wallet" },
  { title: "Качественный монтаж", text: "с гарантией", icon: "wrench" },
  {
    title: "Поддержка и сервис",
    text: "после установки",
    icon: "headphones",
  },
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
