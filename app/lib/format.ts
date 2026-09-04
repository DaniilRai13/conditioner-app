/** 1890 → «1 890 р.» */
export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} р.`;
}

/** Площадь одной строкой: «до 25 м²». */
export function formatArea(areaM2?: number): string | null {
  return areaM2 ? `до ${areaM2} м²` : null;
}

/** 2.2 → «2,2 кВт». Дробная часть только если она есть. */
export function formatKw(value?: number): string | null {
  if (!value) return null;
  return `${value.toLocaleString("ru-RU")} кВт`;
}
