// Все цифры, влияющие на цену. Меняются здесь и нигде больше.

/**
 * Наценка на оборудование. Заказчик решил продавать по цене поставщика
 * и зарабатывать на монтаже — но коэффициент вынесен, чтобы при желании
 * добавить процент правкой одного числа (PLAN.md §11).
 */
export const MARKUP = 1.0;

/**
 * TODO: заглушка. В API поставщика цены монтажа нет — проверено,
 * `prices` отдаёт только оборудование. Нужны реальные цифры от заказчика.
 *
 * Пока они не подтверждены, на карточке показываем цену оборудования
 * и отдельной строкой «+ монтаж от N р.». Как появится настоящий прайс —
 * переключаем PRICE_MODE на "turnkey" и показываем слитое «от X р. под ключ».
 */
export const INSTALL_PRICE = {
  upTo25m2: 450,
  upTo50m2: 600,
  over50m2: 800,
} as const;

export const PRICE_MODE: "split" | "turnkey" = "split";

/**
 * Пока false — на странице цен вместо чисел стоит «по запросу».
 * Публиковать выдуманный прайс нельзя: клиент приедет с этой цифрой,
 * а она ничем не подтверждена. Включаем, когда заказчик пришлёт реальный.
 */
export const PRICES_CONFIRMED = false;

/** Строки прайса на монтаж. Мощность в BTU — так их маркируют производители. */
export const installRows = [
  { btu: "07", kw: "2,0", area: "до 20 м²", price: INSTALL_PRICE.upTo25m2 },
  { btu: "09", kw: "2,6", area: "до 25 м²", price: INSTALL_PRICE.upTo25m2 },
  { btu: "12", kw: "3,5", area: "до 35 м²", price: INSTALL_PRICE.upTo50m2 },
  { btu: "18", kw: "5,3", area: "до 50 м²", price: INSTALL_PRICE.upTo50m2 },
  { btu: "24", kw: "7,0", area: "до 70 м²", price: INSTALL_PRICE.over50m2 },
] as const;

/** Округление цены «от» вверх, до кратного. */
export const PRICE_ROUNDING = 50;

/** Состав стандартного монтажа. Один источник для всех страниц решений. */
export const STANDARD_INSTALL_INCLUDES = [
  "Трасса до 3 метров",
  "Кронштейны для наружного блока",
  "Вакуумирование магистрали",
  "Пусконаладка и проверка",
] as const;

/** Что оплачивается отдельно. Честный список снимает споры на объекте. */
export const EXTRA_CHARGES = [
  "Штробление стен",
  "Трасса свыше 3 метров",
  "Работа с автовышки",
  "Демонтаж старого блока",
] as const;

export function installPriceFor(areaM2: number): number {
  if (areaM2 <= 25) return INSTALL_PRICE.upTo25m2;
  if (areaM2 <= 50) return INSTALL_PRICE.upTo50m2;
  return INSTALL_PRICE.over50m2;
}

export function roundPrice(value: number): number {
  return Math.ceil(value / PRICE_ROUNDING) * PRICE_ROUNDING;
}
