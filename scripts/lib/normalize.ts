import type { ProductSpecs, ProductType } from "../../app/types/product.ts";

type Attribute = { name: string; terms: { name: string }[] };

/** Первое число из строки вида «7кВт», «34 — 42дБ», «51-70 м2». */
export function firstNumber(value: string): number | undefined {
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

/** Поставщик пишет «есть» / «нет». */
export function yesNo(value: string): boolean | undefined {
  const v = value.trim().toLowerCase();
  if (v.startsWith("есть") || v === "да") return true;
  if (v.startsWith("нет")) return false;
  return undefined;
}

function byName(attrs: Attribute[], name: string): string | undefined {
  const found = attrs.find((a) => a.name.trim().toLowerCase() === name.toLowerCase());
  return found?.terms?.[0]?.name;
}

/** Атрибуты, которые раскладываем в типизированные поля. Остальные — в extra. */
const KNOWN = new Set([
  "бренд",
  "модель",
  "модель общая",
  "тип кондиционера",
  "обслуживаемая площадь",
  "мощность охлаждения",
  "мощность обогрева",
  "инверторная технология",
  "wi-fi",
  "хладагент(фреон)",
  "шум внутреннего блока",
  "энергоэффективность при охлаждении",
  "энергоэффективность при обогреве",
  "рабочая температура при обогреве",
]);

/**
 * Фильтровые дубли поставщика: «Площадь(фильтр)», «Мощность(фильтр)» и прочие
 * служебные атрибуты для их же каталога. В таблицу характеристик им не место.
 */
function isServiceAttribute(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("фильтр") || n.includes("каталог");
}

export function normalizeSpecs(attributes: Attribute[]): ProductSpecs {
  const get = (name: string) => byName(attributes, name);

  const extra: Record<string, string> = {};
  for (const attr of attributes) {
    const name = attr.name.trim();
    if (KNOWN.has(name.toLowerCase())) continue;
    if (isServiceAttribute(name)) continue;
    const value = attr.terms?.map((t) => t.name).join(", ");
    if (value) extra[name] = value;
  }

  return {
    areaM2: firstNumber(get("Обслуживаемая площадь") ?? ""),
    coolingKw: firstNumber(get("Мощность охлаждения") ?? ""),
    heatingKw: firstNumber(get("Мощность обогрева") ?? ""),
    isInverter: yesNo(get("Инверторная технология") ?? ""),
    hasWifi: yesNo(get("Wi-Fi") ?? ""),
    refrigerant: get("Хладагент(фреон)"),
    noiseDb: firstNumber(get("Шум внутреннего блока") ?? ""),
    eer: firstNumber(get("Энергоэффективность при охлаждении") ?? ""),
    cop: firstNumber(get("Энергоэффективность при обогреве") ?? ""),
    minHeatTemp: firstNumber(get("Рабочая температура при обогреве") ?? ""),
    extra,
  };
}

export function attributeValue(
  attributes: Attribute[],
  name: string
): string | undefined {
  return byName(attributes, name);
}

const TYPE_BY_CATEGORY: Record<number, ProductType> = {
  33: "split",
  14646: "multi-split",
  34: "mobile",
  28512: "semi-industrial",
};

export function typeFromCategory(categoryId: number): ProductType {
  return TYPE_BY_CATEGORY[categoryId] ?? "split";
}

/**
 * У поставщика короткое описание склеено из двух частей: характеристики
 * и его собственный маркетинг — «Купите с установкой ПОД КЛЮЧ! Рассрочка 0%,
 * Лизинг и Кредит». Хвост режем: это чужие условия продажи, мы рассрочку
 * не даём (PLAN.md §5).
 */
export function stripSupplierPitch(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8220;|&#8221;|&quot;/g, "\"")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cut = text.search(/Купите|Рассрочка|Лизинг|Кредит|Работаем с НДС/i);
  return (cut > 0 ? text.slice(0, cut) : text).replace(/[\s.,]+$/, "");
}
