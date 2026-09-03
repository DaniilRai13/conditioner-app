import { Wrench, Snowflake, ShieldCheck, SprayCan } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  short: string;
  icon: LucideIcon;
};

export const services: Service[] = [
  {
    slug: "prodazha",
    title: "Продажа кондиционеров",
    short:
      "Помогу подобрать кондиционер под ваши задачи и бюджет. Работаю с проверенными производителями.",
    icon: Snowflake,
  },
  {
    slug: "ustanovka",
    title: "Установка кондиционеров",
    short:
      "Профессиональный монтаж с соблюдением всех норм и требований. Аккуратно и в срок.",
    icon: Wrench,
  },
  {
    slug: "obsluzhivanie",
    title: "Обслуживание",
    short:
      "Чистка, проверка и настройка кондиционера для стабильной и долговечной работы.",
    icon: SprayCan,
  },
  {
    slug: "remont",
    title: "Ремонт",
    short: "Диагностика и ремонт кондиционеров любой сложности.",
    icon: ShieldCheck,
  },
];
