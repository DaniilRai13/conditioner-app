/** 1890 → «1 890 р.» */
export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} р.`;
}

/**
 * Короткое имя товара для <title>.
 *
 * Имена из выгрузки поставщика доходят до 80 символов, потому что содержат
 * весь артикул: «Кондиционер Royal Clima COMPETENZA Inverter 2024 CO-4C
 * 12HNBI/CO-E 12HNBI/pan 8D1». С добавкой «Купить … в Минске — Климат Лайн»
 * выходило 111 символов при бюджете поиска около 60 — больше половины
 * заголовка никто никогда не видел.
 *
 * Берём бренд и серию: слова модели до первого артикульного токена (те
 * содержат «/»). Площадь добавляется не для красоты — она разводит между
 * собой модели одной серии, у которых серия совпадает, и заодно попадает
 * в запросы вида «кондиционер на 25 м²». Голова урезается по словам,
 * пока строка не уложится в бюджет.
 */
export function seoProductName(
  brand: string,
  model: string,
  areaM2: number | undefined,
  budget: number
): string {
  const words = model.split(/\s+/);
  const cut = words.findIndex((w) => w.includes("/"));
  const series = (
    cut === 0
      ? // Артикул стоит первым — серии нет, оставляем его одного.
        words.slice(0, 1)
      : cut < 0
        ? // Слеша нет вовсе: модель целиком читается как имя, но длинные
          // обрежем по словам ниже.
          words.slice(0, 4)
        : words.slice(0, cut)
  )
    .join(" ")
    .replace(/[/\s]+$/, "");

  const area = areaM2 ? ` до ${areaM2} м²` : "";
  const head = `${brand} ${series}`.split(" ");

  // Бренд и первое слово серии не трогаем: без них имя перестаёт быть именем.
  while (head.length > 2 && (head.join(" ") + area).length > budget) {
    head.pop();
  }

  return head.join(" ") + area;
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
