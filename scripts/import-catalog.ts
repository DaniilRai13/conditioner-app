import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { slugify } from "./lib/translit.ts";
import {
  attributeValue,
  normalizeSpecs,
  stripSupplierPitch,
  typeFromCategory,
} from "./lib/normalize.ts";
import { initCodecs, decodeImage, writeVariants } from "./lib/images.ts";
import { MARKUP } from "../app/config/pricing.ts";
import type { Product, ProductTier } from "../app/types/product.ts";

/**
 * Выгрузка каталога с swcomfortair.by.
 *
 * Запускается вручную и редко: `npm run import:catalog`.
 * Флаг `--dry-run` показывает, что получилось бы, ничего не записывая.
 *
 * Почему не тянем всё: у поставщика 4284 позиции, но карточки с копипастой
 * характеристик на молодом домене не ранжируются, а цены на них протухнут.
 * Берём 44 модели по квотам (PLAN.md §5).
 */

const API = "https://swcomfortair.by/wp-json/wc/store/v1/products";
const OUT = "app/data/products.json";

const QUOTAS = [
  { id: 33, quota: 20, label: "сплит-системы" },
  { id: 14646, quota: 8, label: "мульти-сплит" },
  { id: 34, quota: 8, label: "мобильные" },
  { id: 28512, quota: 8, label: "полупромышленные" },
];

/** Меньше брендов — выше доверие к подборке. */
const BRANDS = [
  "gree",
  "haier",
  "tcl",
  "electrolux",
  "ballu",
  "royal clima",
  "dantex",
  "mitsubishi",
];

/** Классы площади для равномерного покрытия. */
const AREA_CLASSES = [20, 25, 35, 50, 70];

/**
 * Добор по большим площадям.
 *
 * Основные квоты дали каталог, заканчивающийся на 79 м², а квиз с поправкой
 * на окна и офис доходит до 94 м² — на таких ответах выдача была пуста.
 * У поставщика линейка прыгает с 24 BTU (около 70 м²) сразу на 36 (около 100),
 * поэтому промежутка 80–96 нет ни у кого; для подбора этого хватает —
 * расчётным 84 м² подходит блок на 97.
 */
const AREA_FILL = {
  categories: [33, 28512],
  minArea: 80,
  quota: 6,
  label: "большие площади",
};

/**
 * Потолок на бренд по всему каталогу.
 *
 * Без него отбор по цене внутри класса площади сваливается в одну марку:
 * на первом прогоне Royal Clima занял 26 позиций из 44. Каталог тогда
 * выглядит витриной одного производителя, а не подборкой мастера.
 */
const MAX_PER_BRAND = 8;

type ApiProduct = {
  id: number;
  name: string;
  permalink: string;
  short_description: string;
  is_in_stock: boolean;
  prices: { price: string; currency_minor_unit: number };
  images: { src: string }[];
  attributes: { name: string; terms: { name: string }[] }[];
};

/**
 * Картинки кладём в `public/catalog`, а не в `app/assets`: их 88 штук
 * с именами, известными только в рантайме — статических импортов
 * под них не написать.
 */
const IMAGE_DIR = "public/catalog";
const IMAGE_WIDTHS = [400, 800];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Слаг товара.
 *
 * Обычно хватает бренда с моделью, но у поставщика атрибут «Модель» бывает
 * обрезан: у трёх мобильных Electrolux он равен просто «EACM», и слаги
 * схлопывались в один — товары затирали картинки друг друга и делили
 * бы один URL. Поэтому при столкновении берём название, отбросив
 * родовые слова, а в крайнем случае добавляем id поставщика.
 */
function buildSlug(
  brand: string,
  model: string,
  name: string,
  sourceId: number,
  used: Set<string>
): string {
  const fromName = () =>
    slugify(name.replace(/^[а-яё]*\s*кондиционер\s+/i, ""));

  const base = slugify(`${brand} ${model}`);
  const named = fromName();

  // Если слаг из модели — лишь начало слага из названия, модель обрезана
  // поставщиком. Берём более полный вариант, даже когда столкновения нет:
  // «electrolux-eacm» рядом с «electrolux-eacm-15-cl-n3» выглядит опечаткой.
  const preferred = named.startsWith(base) && named !== base ? named : base;

  const candidates = [preferred, named, `${named}-${sourceId}`].filter(Boolean);

  for (const candidate of candidates) {
    if (!used.has(candidate)) return candidate;
  }
  return `${slugify(brand)}-${sourceId}`;
}

/**
 * Качает главное фото товара и раскладывает в avif+webp двух ширин.
 * Возвращает базовый путь без размера и расширения, либо null.
 *
 * Хотлинк на чужой домен не используем: имена файлов у поставщика
 * кириллические, и их в любой момент могут переименовать или убрать.
 */
async function importImage(
  src: string | undefined,
  slug: string
): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const image = await decodeImage(buffer);
    await writeVariants(image, {
      outDir: IMAGE_DIR,
      base: slug,
      widths: IMAGE_WIDTHS,
    });
    return `/catalog/${slug}`;
  } catch (e) {
    // Не глушим молча: без этого товар просто оказывается без картинки,
    // и причину приходится искать вручную.
    const reason = e instanceof Error ? e.message : String(e);
    console.warn(`  ! ${slug}: картинка не сохранена — ${reason.slice(0, 70)}`);
    return null;
  }
}

async function fetchPage(categoryId: number, page: number): Promise<ApiProduct[]> {
  const url = `${API}?per_page=100&page=${page}&category=${categoryId}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

function priceOf(p: ApiProduct): number | null {
  const raw = Number(p.prices?.price);
  if (!Number.isFinite(raw)) return null;
  const rubles = raw / 10 ** (p.prices.currency_minor_unit ?? 2);
  return rubles > 0 ? Math.round(rubles * MARKUP) : null;
}

function areaClass(area: number | undefined): number | null {
  if (!area) return null;
  // Ближайший класс сверху: модель на 22 м² попадает в класс 25.
  return AREA_CLASSES.find((c) => area <= c) ?? AREA_CLASSES.at(-1)!;
}

/**
 * Отбор внутри категории.
 *
 * Раскладываем кандидатов по классам площади и берём по кругу, чередуя
 * инверторные и обычные. Без этого квота уходит в один популярный класс,
 * и квиз упирается в пустую выдачу на половине комбинаций.
 */
function select(
  candidates: ApiProduct[],
  quota: number,
  brandCount: Map<string, number>
): ApiProduct[] {
  const brandOf = (p: ApiProduct) =>
    (attributeValue(p.attributes, "Бренд") ?? "").trim();

  const buckets = new Map<number, ApiProduct[]>();

  for (const p of candidates) {
    const specs = normalizeSpecs(p.attributes);
    const cls = areaClass(specs.areaM2);
    if (cls === null) continue;
    if (!buckets.has(cls)) buckets.set(cls, []);
    buckets.get(cls)!.push(p);
  }

  // Внутри класса: сначала в наличии, потом дешевле.
  for (const list of buckets.values()) {
    list.sort((a, b) => {
      if (a.is_in_stock !== b.is_in_stock) return a.is_in_stock ? -1 : 1;
      return (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity);
    });
  }

  const picked: ApiProduct[] = [];
  const classes = [...buckets.keys()].sort((a, b) => a - b);
  let wantInverter = true;

  while (picked.length < quota) {
    let addedThisRound = false;

    for (const cls of classes) {
      if (picked.length >= quota) break;
      const list = buckets.get(cls)!;
      if (list.length === 0) continue;

      const underCap = (p: ApiProduct) =>
        (brandCount.get(brandOf(p)) ?? 0) < MAX_PER_BRAND;

      // Идеальный кандидат: нужный тип компрессора и бренд не выбрал квоту.
      let index = list.findIndex(
        (p) =>
          normalizeSpecs(p.attributes).isInverter === wantInverter && underCap(p)
      );
      // Дальше ослабляем требования по очереди: сперва тип компрессора,
      // и только в последнюю очередь — потолок на бренд.
      if (index === -1) index = list.findIndex(underCap);
      if (index === -1) index = 0;

      const chosen = list.splice(index, 1)[0];
      const brand = brandOf(chosen);
      brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1);
      picked.push(chosen);
      addedThisRound = true;
    }

    wantInverter = !wantInverter;
    if (!addedThisRound) break; // кандидаты кончились
  }

  return picked;
}

/** Цены внутри категории делим на трети — это стартовое значение tier. */
function assignTiers(products: Product[]): void {
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const third = Math.ceil(sorted.length / 3);
  sorted.forEach((p, i) => {
    p.tier = (i < third ? "budget" : i < third * 2 ? "optimum" : "premium") as ProductTier;
  });
}

async function loadExisting(): Promise<Map<number, Product>> {
  if (!existsSync(OUT)) return new Map();
  const raw = JSON.parse(await readFile(OUT, "utf8")) as Product[];
  return new Map(raw.map((p) => [p.sourceId, p]));
}

/** Кандидаты категории: бренд из белого списка и есть цена. */
async function collect(categoryId: number, limit: number): Promise<ApiProduct[]> {
  const out: ApiProduct[] = [];

  for (let page = 1; page <= 6; page++) {
    const batch = await fetchPage(categoryId, page);
    if (batch.length === 0) break;

    for (const p of batch) {
      const brand = attributeValue(p.attributes, "Бренд")?.toLowerCase() ?? "";
      if (!BRANDS.some((b) => brand.includes(b))) continue;
      if (priceOf(p) === null) continue;
      out.push(p);
    }

    if (out.length >= limit) break;
    await sleep(300); // не долбим чужой сервер
  }

  return out;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const skipImages = dryRun || process.argv.includes("--skip-images");
  if (!skipImages) await initCodecs();

  const existing = await loadExisting();
  const brandCount = new Map<string, number>();
  const usedSlugs = new Set<string>();
  const result: Product[] = [];

  for (const { id, quota, label } of QUOTAS) {
    const candidates = await collect(id, quota * 6);

    const picked = select(candidates, quota, brandCount);
    console.log(
      `${label}: кандидатов ${candidates.length}, отобрано ${picked.length} из ${quota}`
    );

    for (const p of picked) {
      result.push(await toProduct(p, id));
    }
  }

  /**
   * Добор по большим площадям. Идёт после основных квот и пропускает уже
   * отобранное: иначе те же полупромышленные попали бы в каталог дважды.
   */
  const already = new Set(result.map((p) => p.sourceId));

  // Категорию несём рядом с товаром: тип оборудования определяется ею,
  // а по названию или ссылке его не угадать.
  const large: { product: ApiProduct; categoryId: number }[] = [];

  for (const categoryId of AREA_FILL.categories) {
    const candidates = await collect(categoryId, 400);
    for (const product of candidates) {
      if (already.has(product.id)) continue;
      already.add(product.id); // одна модель может лежать в двух категориях
      const area = normalizeSpecs(product.attributes).areaM2;
      if (!area || area < AREA_FILL.minArea) continue;
      large.push({ product, categoryId });
    }
  }

  // Сначала в наличии, потом дешевле — как и в основном отборе.
  large.sort((a, b) => {
    if (a.product.is_in_stock !== b.product.is_in_stock) {
      return a.product.is_in_stock ? -1 : 1;
    }
    return (priceOf(a.product) ?? Infinity) - (priceOf(b.product) ?? Infinity);
  });

  const fill: typeof large = [];
  for (const entry of large) {
    if (fill.length >= AREA_FILL.quota) break;
    const brand = (attributeValue(entry.product.attributes, "Бренд") ?? "").trim();
    if ((brandCount.get(brand) ?? 0) >= MAX_PER_BRAND) continue;
    brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1);
    fill.push(entry);
  }

  console.log(
    `${AREA_FILL.label}: кандидатов ${large.length}, отобрано ${fill.length} из ${AREA_FILL.quota}`
  );

  for (const entry of fill) {
    result.push(await toProduct(entry.product, entry.categoryId));
  }

  async function toProduct(p: ApiProduct, categoryId: number): Promise<Product> {
    const brand = attributeValue(p.attributes, "Бренд") ?? "";
    const model =
      attributeValue(p.attributes, "Модель") ??
      attributeValue(p.attributes, "Модель общая") ??
      "";
    const prev = existing.get(p.id);
    // Слаг фиксируется при первом импорте: смена URL стоит позиций.
    const slug = prev?.slug ?? buildSlug(brand, model, p.name, p.id, usedSlugs);
    usedSlugs.add(slug);

    // Уже скачанное не перекачиваем: повторный прогон ради обновления цен
    // не должен упираться в час перекодирования картинок.
    const image =
      skipImages || prev?.image
        ? (prev?.image ?? null)
        : await importImage(p.images?.[0]?.src, slug);

    return {
      sourceId: p.id,
      slug,
      name: p.name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      type: typeFromCategory(categoryId),
      price: priceOf(p)!,
      inStock: p.is_in_stock,
      image,
      specs: normalizeSpecs(p.attributes),

      // Поля, которые ведём руками: импорт их не перезаписывает.
      description: prev?.description ?? stripSupplierPitch(p.short_description),
      tier: prev?.tier ?? "optimum",
      featured: prev?.featured ?? false,
      sortOrder: prev?.sortOrder ?? 0,
      isPublished: prev?.isPublished ?? true,

      sourceUrl: p.permalink,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  }

  // tier назначаем только тем, у кого его ещё не вели руками.
  const fresh = result.filter((p) => !existing.has(p.sourceId));
  assignTiers(fresh);

  console.log(`\nВсего: ${result.length} моделей`);
  const byBrand = new Map<string, number>();
  for (const p of result) byBrand.set(p.brand, (byBrand.get(p.brand) ?? 0) + 1);
  console.log("Бренды: " + [...byBrand].map(([b, n]) => `${b} ${n}`).join(", "));

  const areas = result.map((p) => p.specs.areaM2).filter(Boolean) as number[];
  console.log(`Площади: от ${Math.min(...areas)} до ${Math.max(...areas)} м²`);
  console.log(`В наличии: ${result.filter((p) => p.inStock).length}`);
  console.log(`Инверторных: ${result.filter((p) => p.specs.isInverter).length}`);

  if (dryRun) {
    console.log("\n--dry-run: файл не записан");
    return;
  }

  await mkdir("app/data", { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 2), "utf8");
  console.log(`\nЗаписано в ${OUT}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
