import type { IconName } from "~/lib/icons";

export type Advantage = {
  title: string;
  text: string;
  icon: IconName;
};

/** Полоса под hero — три пункта. */
export const advantages: Advantage[] = [
  {
    title: "Индивидуальный подход",
    text: "Я работаю один — лично отвечаю за качество на каждом этапе",
    icon: "user",
  },
  {
    title: "Качественный монтаж",
    text: "Установка по всем стандартам и с гарантией",
    icon: "wrench",
  },
  {
    title: "Честные цены",
    text: "Без наценок и посредников. Платите только за результат",
    icon: "wallet",
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
