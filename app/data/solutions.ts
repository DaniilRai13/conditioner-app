export type SolutionPreview = {
  slug: string;
  title: string;
  room: string;
  areaFrom: number;
  areaTo: number;
  priceFrom: number;
};

/**
 * TODO: заглушка. Переедет в Supabase на этапе 3 (PLAN.md §5.2).
 * Цены условные — настоящие «от» ждём от заказчика вместе с прайсом
 * на монтаж (PLAN.md §11).
 */
export const solutions: SolutionPreview[] = [
  {
    slug: "bedroom-20",
    title: "Кондиционер для спальни",
    room: "Спальня",
    areaFrom: 0,
    areaTo: 20,
    priceFrom: 1400,
  },
  {
    slug: "living-room-35",
    title: "Кондиционер для гостиной",
    room: "Гостиная",
    areaFrom: 25,
    areaTo: 35,
    priceFrom: 1900,
  },
  {
    slug: "studio-50",
    title: "Кондиционер для студии",
    room: "Квартира-студия",
    areaFrom: 40,
    areaTo: 50,
    priceFrom: 2400,
  },
  {
    slug: "office-70",
    title: "Кондиционер для офиса",
    room: "Офис",
    areaFrom: 50,
    areaTo: 70,
    priceFrom: 3100,
  },
];

export function areaLabel(s: SolutionPreview): string {
  return s.areaFrom === 0 ? `до ${s.areaTo} м²` : `${s.areaFrom}–${s.areaTo} м²`;
}
