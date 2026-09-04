export type ProductType =
  | "split"
  | "multi-split"
  | "mobile"
  | "semi-industrial";

export type ProductTier = "budget" | "optimum" | "premium";

export type ProductSpecs = {
  areaM2?: number;
  coolingKw?: number;
  heatingKw?: number;
  isInverter?: boolean;
  hasWifi?: boolean;
  refrigerant?: string;
  noiseDb?: number;
  eer?: number;
  cop?: number;
  minHeatTemp?: number;
  /** Остальные характеристики поставщика — в полную таблицу на карточке. */
  extra: Record<string, string>;
};

export type Product = {
  /** id у поставщика. По нему скрипт импорта находит запись при повторном запуске. */
  sourceId: number;
  slug: string;
  name: string;
  brand: string;
  model: string;
  type: ProductType;

  /** Цена оборудования в рублях, с наценкой из config/pricing.ts. */
  price: number;
  inStock: boolean;

  /** Базовый путь картинки без размера и расширения: `/catalog/gree-pular-09`. */
  image: string | null;

  specs: ProductSpecs;

  // --- поля, которые ведём вручную; импорт их не перезаписывает ---
  description: string;
  tier: ProductTier;
  featured: boolean;
  sortOrder: number;
  isPublished: boolean;

  sourceUrl: string;
  updatedAt: string;
};
