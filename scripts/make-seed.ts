import { readFile, writeFile } from "node:fs/promises";
import type { Product } from "../app/types/product.ts";

/**
 * Собирает database/seed.sql из снимков в app/data.
 *
 * Первый раз он собрал базу из данных, которые лежали в коде. Теперь
 * направление обратное: данные живут в Supabase, npm run data:pull кладёт
 * их снимком в app/data, а этот скрипт превращает снимок обратно в SQL.
 *
 * Смысл в том, что сид перестаёт устаревать. Заказчик правит цены в
 * админке, сборка забирает свежее, и seed.sql пересобирается из того же
 * файла — если базу придётся поднять заново (переезд, авария, вторая среда
 * для проверок), схема плюс сид дают состояние на день последней сборки,
 * а не на день заведения базы.
 *
 * Читаем именно снимок, а не app/config/pricing.ts: тот сам читает снимок,
 * и импорт замкнул бы круг — сид собирался бы из того, что в него же
 * когда-то попало, через лишний слой.
 *
 * Генерируем SQL, а не пишем напрямую в базу: файл можно прочитать глазами
 * перед выполнением и вставить в SQL Editor, не заводя ключей и не давая
 * скрипту прав на запись.
 *
 * Запуск: npm run seed:make
 */

type SiteData = {
  installRows: {
    btu: string;
    kw: string;
    area: string;
    areaTo: number;
    price: number;
    isConfirmed: boolean;
  }[];
  installIncludes: string[];
  extraCharges: string[];
  deliveryDays: string;
  showPortfolio: boolean;
  showReviews: boolean;
  contacts: Record<string, string>;
  legal: Record<string, string>;
  hero: Record<string, string>;
  dashboardNote: string;
};

/** Строка для SQL. Одинарные кавычки удваиваются — иначе строка рвёт запрос. */
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;

/** jsonb-литерал. Тот же приём: JSON уходит строкой и кастуется на месте. */
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const products = JSON.parse(
  await readFile("app/data/products.json", "utf8")
) as Product[];

const siteData = JSON.parse(
  await readFile("app/data/site-data.json", "utf8")
) as SiteData;

const lines: string[] = [];

lines.push(`-- =============================================================================
-- Климат Лайн — первичное заполнение
--
-- Выполнять ПОСЛЕ database/schema.sql. Файл идемпотентный: повторный запуск
-- обновляет строки, а не плодит дубли.
--
-- Собран автоматически: npm run seed:make. Руками не править — правки
-- затрёт следующая генерация; меняйте исходные данные в app/.
-- =============================================================================
`);

// --- товары --------------------------------------------------------------
lines.push(`
-- Товары: ${products.length} позиций из выгрузки поставщика.
--
-- on conflict обновляет только колонки поставщика. description, tier,
-- featured, sort_order и is_published не тронуты специально: их ведут
-- руками, и повторный сид не должен стирать чужую работу.`);

for (const [i, p] of products.entries()) {
  lines.push(
    `insert into public.products
  (source_id, slug, name, brand, model, type, price, in_stock, image, specs, description, tier, featured, sort_order, is_published, source_url)
values
  (${p.sourceId ?? "null"}, ${q(p.slug)}, ${q(p.name)}, ${q(p.brand)}, ${q(p.model)}, ${q(p.type)}, ${p.price}, ${p.inStock}, ${p.image ? q(p.image) : "null"}, ${j(p.specs)}, ${q(p.description ?? "")}, ${q(p.tier)}, ${p.featured}, ${p.sortOrder ?? i}, ${p.isPublished !== false}, ${q(p.sourceUrl ?? "")})
on conflict (slug) do update set
  source_id  = excluded.source_id,
  name       = excluded.name,
  brand      = excluded.brand,
  model      = excluded.model,
  type       = excluded.type,
  price      = excluded.price,
  in_stock   = excluded.in_stock,
  image      = excluded.image,
  specs      = excluded.specs,
  source_url = excluded.source_url;`
  );
}

// --- цены монтажа --------------------------------------------------------
const confirmed = siteData.installRows.filter((r) => r.isConfirmed).length;

lines.push(`
-- Цены на монтаж. Подтверждено строк: ${confirmed} из ${siteData.installRows.length}.
-- Пока подтверждены не все, страница цен пишет «по запросу»: неподтверждённое
-- число опаснее его отсутствия — клиент приедет с ним, а оно ничем не обещано.`);

for (const [i, r] of siteData.installRows.entries()) {
  lines.push(
    `insert into public.install_prices (btu, kw, area, area_to, price, is_confirmed, sort_order)
values (${q(r.btu)}, ${q(r.kw)}, ${q(r.area)}, ${r.areaTo}, ${r.price}, ${r.isConfirmed}, ${i})
on conflict do nothing;`
  );
}

// --- настройки -----------------------------------------------------------
lines.push(`
-- Настройки. Ключ-значение: сюда попадают разнородные мелочи, ради которых
-- незачем заводить колонки.`);

const settings: [string, unknown, string][] = [
  ["install_includes", siteData.installIncludes, "Что входит в стандартный монтаж"],
  ["extra_charges", siteData.extraCharges, "Что оплачивается отдельно"],
  ["delivery_days", siteData.deliveryDays, "Срок поставки под заказ"],
  ["show_portfolio", siteData.showPortfolio, "Показывать блок работ на сайте"],
  ["show_reviews", siteData.showReviews, "Показывать отзывы на сайте"],

  // Тексты сайта. До этого они лежали заглушками в config/site.ts, и замена
  // телефона требовала программиста и пересборки из его рук. Теперь правятся
  // на главной админки, а на сайт уезжают со снимком.
  ["contacts", siteData.contacts, "Телефон, мессенджеры, часы работы"],
  ["legal", siteData.legal, "Реквизиты для подвала и политики"],
  ["hero", siteData.hero, "Заголовок и подзаголовок первого экрана"],
  ["dashboard_note", siteData.dashboardNote, "Заметка на главной админки"],
];

for (const [key, value, label] of settings) {
  lines.push(
    `insert into public.settings (key, value, label)
values (${q(key)}, ${j(value)}, ${q(label)})
on conflict (key) do update set label = excluded.label;`
  );
}

lines.push(`
-- =============================================================================
-- Что нужно сделать руками после этого файла
--
-- 1. Authentication → Users → Add user: почта и пароль для входа в админку.
--    Профиль заведётся сам — триггером из schema.sql. Так же добавляются
--    второй и третий администратор.
--
-- 2. Authentication → Sign In / Providers → Email: выключить
--    «Allow new users to sign up». Триггер выдаёт доступ каждому созданному
--    пользователю, и при открытой регистрации админку заведёт себе любой.
--
-- Подробнее — database/README.md.
-- =============================================================================`);

await writeFile("database/seed.sql", lines.join("\n\n") + "\n", "utf8");

console.log(
  `database/seed.sql готов: ${products.length} товаров, ${siteData.installRows.length} строк цен, ${settings.length} настроек`
);
