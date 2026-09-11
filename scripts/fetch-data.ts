import { writeFile } from "node:fs/promises";
import { credentials, rest } from "./lib/rest.ts";
import type { Product } from "../app/types/product.ts";

/**
 * Забирает данные из Supabase и кладёт снимком в app/data.
 *
 * Запускается перед сборкой. Посетитель в базу не ходит: он получает
 * готовый HTML, а Supabase дёргается один раз, на сборке. Это сохраняет
 * и скорость, и SEO — поисковик видит каталог в разметке, а не пустой
 * контейнер, который наполнится когда-нибудь потом.
 *
 * Пишем в те же файлы и в той же форме, что были раньше в коде. Поэтому
 * ни один компонент, ни queries.ts, ни react-router.config.ts не знают,
 * что данные теперь из базы: они как читали JSON, так и читают. Сделать
 * загрузку асинхронной внутри приложения было бы куда дороже — список
 * слагов для пререндера нужен ещё до того, как React вообще запустится.
 *
 * Снимок коммитится. Он же служит двум вещам сразу: сборка работает
 * без сети, а если база когда-нибудь пропадёт — из него её поднимут
 * заново (npm run seed:make).
 *
 * Запуск: npm run data:pull (сам по себе) или автоматически в npm run build.
 */

const PRODUCTS_OUT = "app/data/products.json";
const SITE_OUT = "app/data/site-data.json";

const creds = await credentials();

async function select<T>(path: string): Promise<T[]> {
  const res = await rest(creds, path);

  if (!res.ok) {
    console.error(`Supabase ответил ${res.status} на ${path}:`);
    console.error(await res.text());
    process.exit(1);
  }

  return (await res.json()) as T[];
}

// --- товары ------------------------------------------------------------

type ProductRow = {
  source_id: number | null;
  slug: string;
  name: string;
  brand: string;
  model: string;
  type: Product["type"];
  price: number;
  in_stock: boolean;
  image: string | null;
  specs: Product["specs"];
  description: string;
  tier: Product["tier"];
  featured: boolean;
  sort_order: number;
  source_url: string | null;
  updated_at: string;
};

const rows = await select<ProductRow>(
  "products?select=*&order=sort_order.asc,name.asc"
);

/**
 * Пустой каталог — это отказ, а не результат.
 *
 * Выкатить сайт без единого товара хуже, чем не выкатить вовсе: страницы
 * соберутся, поисковик их переобойдёт и увидит пустоту, а восстановится
 * это не сборкой, а месяцами. Поэтому падаем.
 */
if (rows.length === 0) {
  console.error(
    "Из базы не пришло ни одного товара. Сборка остановлена.\n" +
      "Проверьте, что накачен database/seed.sql и что у товаров\n" +
      "стоит is_published = true: анонимный ключ видит только их."
  );
  process.exit(1);
}

// Форма ровно та же, что писал импорт из выгрузки: она уже разошлась
// по коду, и менять её ради красоты значит трогать всё сразу.
const products: Product[] = rows.map((r) => ({
  sourceId: r.source_id ?? 0,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
  model: r.model,
  type: r.type,
  price: r.price,
  inStock: r.in_stock,
  image: r.image,
  specs: r.specs,
  description: r.description,
  tier: r.tier,
  featured: r.featured,
  sortOrder: r.sort_order,
  // Анонимный ключ видит только опубликованные — непубличные до сборки
  // просто не доезжают, и это правильнее любого флага в файле.
  isPublished: true,
  // Пустая строка, а не undefined: JSON.stringify выбрасывает undefined,
  // и поле молча исчезло бы из снимка, оставшись обязательным в типе.
  sourceUrl: r.source_url ?? "",
  updatedAt: r.updated_at,
}));

await writeFile(PRODUCTS_OUT, JSON.stringify(products, null, 2) + "\n", "utf8");

// --- цены и настройки --------------------------------------------------

type PriceRow = {
  btu: string;
  kw: string;
  area: string;
  area_to: number;
  price: number;
  is_confirmed: boolean;
};

type SettingRow = { key: string; value: unknown };

const priceRows = await select<PriceRow>(
  "install_prices?select=*&order=sort_order.asc"
);
const settingRows = await select<SettingRow>("settings?select=key,value");

const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

/**
 * Текстовая настройка со значением по умолчанию.
 *
 * Заглушки остаются в коде запасным вариантом, а не исчезают: пока заказчик
 * не заполнил телефон, на сайте должен стоять заметный «+375 (00) 000-00-00»,
 * по которому видно, что поле не заполнено. Пустая строка вместо него дала бы
 * подвал без телефона — сайт выглядел бы готовым и молча не работал.
 */
const asText = (value: unknown, fallback: string): string => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
};

/** Объект настройки: поля по одному, каждое со своим запасным значением. */
function asFields<T extends Record<string, string>>(
  value: unknown,
  defaults: T
): T {
  const source = (value ?? {}) as Record<string, unknown>;
  const result = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof T)[]) {
    result[key] = asText(source[key as string], defaults[key]) as T[keyof T];
  }

  return result;
}

const siteData = {
  installRows: priceRows.map((r) => ({
    btu: r.btu,
    kw: r.kw,
    area: r.area,
    areaTo: r.area_to,
    price: r.price,
    isConfirmed: r.is_confirmed,
  })),

  /**
   * Цены показываются, только когда подтверждены ВСЕ строки. Половина
   * прайса с числами и половина с «по запросу» выглядит так, будто часть
   * работ скрывают, — а это ровно то впечатление, которого мы избегаем.
   */
  pricesConfirmed:
    priceRows.length > 0 && priceRows.every((r) => r.is_confirmed),

  installIncludes: asList(settings.install_includes),
  extraCharges: asList(settings.extra_charges),
  deliveryDays: asText(settings.delivery_days, "5–10 дней"),
  showPortfolio: settings.show_portfolio === true,
  showReviews: settings.show_reviews === true,

  // Тексты, которые заказчик правит в админке. Значения по умолчанию — те же
  // заглушки, что стояли в config/site.ts: пока поле не заполнено, на сайте
  // видно, что оно не заполнено, а не пустота на месте телефона.
  contacts: asFields(settings.contacts, {
    phone: "+375 (00) 000-00-00",
    telegram: "",
    viber: "",
    whatsapp: "",
    email: "",
    workHours: "Пн–Вс, 8:00–21:00",
  }),

  legal: asFields(settings.legal, {
    entity: "ИП Фамилия И. О.",
    unp: "000000000",
    address: "г. Минск",
  }),

  hero: asFields(settings.hero, {
    title: "",
    subtitle: "",
  }),

  // В сайт не уходит — нужна только админке, но лежит в том же снимке,
  // чтобы не заводить второй способ доставки настроек.
  dashboardNote: asText(settings.dashboard_note, ""),
};

await writeFile(SITE_OUT, JSON.stringify(siteData, null, 2) + "\n", "utf8");

/**
 * Отметка о сборке — рядом со статикой, а не в бандле.
 *
 * По ней админка отвечает на единственный вопрос, который у заказчика
 * возникает после каждой правки: попало это на сайт или ещё нет. Она
 * запрашивает файл у живого сайта и сравнивает его время с самой свежей
 * правкой в базе. Новее в базе — значит, есть что публиковать.
 *
 * Отдельным файлом, а не полем в site-data.json: тот уезжает в бандл
 * и достаётся только через загрузку страницы целиком, а этот лежит
 * обычным файлом и стоит один короткий запрос.
 */
await writeFile(
  "public/build-info.json",
  JSON.stringify({ builtAt: new Date().toISOString() }, null, 2) + "\n",
  "utf8"
);

console.log(
  `Данные получены: ${products.length} товаров, ` +
    `${siteData.installRows.length} строк цен` +
    `${siteData.pricesConfirmed ? "" : " (не подтверждены — на сайте «по запросу»)"}, ` +
    `${settingRows.length} настроек`
);
