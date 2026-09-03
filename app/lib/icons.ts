import {
  Snowflake,
  Wrench,
  SprayCan,
  ShieldCheck,
  User,
  Wallet,
  Headphones,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Данные хранят имя иконки строкой, а не компонент.
 *
 * Так файлы в `data/` остаются сериализуемыми: их можно отдать из loader-а,
 * положить в JSON и позже заменить на строки из Supabase. Компонент внутрь
 * данных не положишь.
 */
export const icons = {
  snowflake: Snowflake,
  wrench: Wrench,
  spray: SprayCan,
  shield: ShieldCheck,
  user: User,
  wallet: Wallet,
  headphones: Headphones,
  sparkles: Sparkles,
  timer: Timer,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
