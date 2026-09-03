import { User, Wallet, Wrench, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Advantage = {
  title: string;
  text: string;
  icon: LucideIcon;
};

/** Полоса под hero. */
export const advantages: Advantage[] = [
  { title: "Один специалист", text: "от подбора до установки", icon: User },
  { title: "Честные цены", text: "без скрытых наценок", icon: Wallet },
  { title: "Качественный монтаж", text: "с гарантией", icon: Wrench },
  { title: "Поддержка и сервис", text: "после установки", icon: Headphones },
];

/** Подпункты синего баннера «Работаю один». */
export const brandPoints: Advantage[] = [
  {
    title: "Прямая связь",
    text: "общаетесь со мной, без менеджеров",
    icon: Headphones,
  },
  {
    title: "Честные цены",
    text: "без наценки посредников",
    icon: Wallet,
  },
  {
    title: "Ответственность",
    text: "за результат отвечаю лично",
    icon: User,
  },
  {
    title: "Гарантия качества",
    text: "на работы и оборудование",
    icon: Wrench,
  },
];
