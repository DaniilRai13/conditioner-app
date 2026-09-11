import { credentials, rest } from "./lib/rest.ts";

/**
 * Проверка базы: доходят ли запросы админки и держит ли RLS.
 *
 * Запросы берутся те же, что в app/lib/admin-api.ts, — с теми же полями
 * и той же сортировкой. Смысл в том, что опечатка в имени колонки в
 * браузере видна только когда откроешь нужный раздел и дождёшься ответа;
 * здесь она видна за секунду и до сборки.
 *
 * Ключ анонимный — тот самый, что уезжает в браузер. Из этого следует
 * и вторая половина проверки: всё, что anon сумеет записать, сумеет
 * записать и случайный посетитель.
 *
 * Почему без входа. Пароль администратора в скрипте не нужен и не должен
 * быть нужен: запрос с опечаткой в колонке ломается на разборе, до всяких
 * политик, и отвечает 42703 или PGRST204 одинаково любому. А права мы
 * проверяем ровно наоборот — что запись анониму запрещена. Ответ 42501
 * «нет прав» означает, что запрос дошёл до политики целым: имя таблицы,
 * имена полей и типы в порядке, не пустили только по правам.
 *
 * Запуск: npm run check:db
 */

const creds = await credentials();

let failed = 0;

function report(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "  ok " : "  ХХ "} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failed++;
}

/** Ошибка PostgREST: код и текст. У неудач формат один и тот же. */
async function errorOf(res: Response): Promise<{ code: string; message: string }> {
  try {
    const body = (await res.json()) as { code?: string; message?: string };
    return { code: body.code ?? String(res.status), message: body.message ?? "" };
  } catch {
    return { code: String(res.status), message: res.statusText };
  }
}

// --- чтение ------------------------------------------------------------
//
// Пути повторяют admin-api.ts. Расходятся они только в объёме: там select=*,
// здесь тоже — иначе проверка не заметила бы пропажу колонки, которую код
// потом прочитает из ответа.

console.log("\nЧтение (запросы админки)\n");

/**
 * Сколько строк ждём.
 *
 * `needed` — без них сайт не собирается: каталог, прайс, настройки.
 * `may-be-empty` — отзывы и работы: их ещё не завели, и пустой ответ
 * говорит только об этом, а не о поломке.
 * `closed` — заявки и профили: строк быть не должно, они закрыты
 * от анонима, и любая строка здесь означала бы утечку в браузер.
 */
type Expect = "needed" | "may-be-empty" | "closed";

const READS: { name: string; path: string; expect: Expect }[] = [
  { name: "товары", path: "products?select=*&order=sort_order.asc,name.asc", expect: "needed" },
  { name: "цены монтажа", path: "install_prices?select=*&order=sort_order.asc", expect: "needed" },
  { name: "настройки", path: "settings?select=*&order=key.asc", expect: "needed" },
  { name: "отзывы", path: "reviews?select=*&order=sort_order.asc,date.desc", expect: "may-be-empty" },
  {
    name: "работы с фотографиями",
    path: "portfolio_projects?select=*,portfolio_images(*)&order=sort_order.asc",
    expect: "may-be-empty",
  },
  { name: "фотографии работ", path: "portfolio_images?select=*", expect: "may-be-empty" },
  { name: "заявки", path: "leads?select=*&order=created_at.desc&limit=500", expect: "closed" },
  { name: "профили", path: "profiles?select=id,name,role", expect: "closed" },
];

for (const { name, path, expect } of READS) {
  const res = await rest(creds, path);

  if (!res.ok) {
    const err = await errorOf(res);
    report(name, false, `${err.code}: ${err.message}`);
    continue;
  }

  const rows = (await res.json()) as unknown[];

  if (expect === "closed") {
    report(name, rows.length === 0, "закрыто для анонима, как и задумано");
  } else if (expect === "needed") {
    report(name, rows.length > 0, `строк: ${rows.length}`);
  } else {
    report(
      name,
      true,
      rows.length > 0 ? `строк: ${rows.length}` : "запрос работает, строк пока нет"
    );
  }
}

// --- запись ------------------------------------------------------------
//
// Пробуем вставить строку в каждую таблицу анонимным ключом. Ждём отказа.
//
// Insert, а не update: update по несуществующей строке возвращает 204 и
// ноль изменений — тот же ответ, что и при запрете, и отличить одно от
// другого нельзя. Insert отвечает однозначно.

console.log("\nЗапись анонимным ключом (везде ожидается отказ)\n");

const WRITES: { name: string; table: string; row: Record<string, unknown> }[] = [
  { name: "товары", table: "products", row: { slug: "rls-probe", name: "x", type: "split", price: 1 } },
  { name: "цены монтажа", table: "install_prices", row: { btu: "00", kw: "0", area: "x", area_to: 1, price: 1 } },
  { name: "настройки", table: "settings", row: { key: "rls_probe", value: 1 } },
  { name: "отзывы", table: "reviews", row: { author: "x", text: "x" } },
  { name: "работы", table: "portfolio_projects", row: { title: "x" } },
  { name: "заявки", table: "leads", row: { name: "x", phone: "x" } },
  { name: "профили", table: "profiles", row: { id: "00000000-0000-0000-0000-000000000000", name: "x" } },
];

for (const { name, table, row } of WRITES) {
  const res = await rest(creds, table, {
    method: "POST",
    body: JSON.stringify(row),
    headers: { Prefer: "return=representation" },
  });

  if (res.ok) {
    report(name, false, "СТРОКА СОЗДАНА — таблица открыта на запись всему интернету");
    continue;
  }

  const err = await errorOf(res);

  // 42501 — «нет прав»: политика сработала, а до неё запрос дошёл целым.
  // 42703 (нет колонки) или PGRST204 значили бы, что сломан сам запрос,
  // и тогда про права мы так ничего и не узнали.
  if (err.code === "42501" || res.status === 401 || res.status === 403) {
    report(name, true, "нет прав, запрос разобран");
  } else {
    report(name, false, `${err.code}: ${err.message}`);
  }
}

// --- Storage -----------------------------------------------------------

console.log("\nХранилище файлов\n");

for (const bucket of ["products", "portfolio"]) {
  // Публичный список файлов: бакет обязан быть public, иначе фотографии
  // работ не откроются у посетителя — админка кладёт в разметку прямые
  // ссылки, а не подписанные.
  const res = await fetch(`${creds.url}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: creds.key,
      Authorization: `Bearer ${creds.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix: "", limit: 1 }),
  });

  if (res.ok) {
    const files = (await res.json()) as unknown[];
    report(`бакет ${bucket}`, true, `доступен, файлов найдено: ${files.length}`);
  } else {
    report(`бакет ${bucket}`, false, `${res.status} ${res.statusText}`);
  }
}

// --- сходится ли снимок с базой ---------------------------------------

console.log("\nСнимок в app/data\n");

const snapshot = JSON.parse(
  await (await import("node:fs/promises")).readFile("app/data/products.json", "utf8")
) as { slug: string }[];

const live = await (await rest(creds, "products?select=slug")).json();
const liveSlugs = new Set((live as { slug: string }[]).map((p) => p.slug));
const missing = snapshot.filter((p) => !liveSlugs.has(p.slug));

report(
  "снимок и база совпадают",
  missing.length === 0 && snapshot.length === liveSlugs.size,
  missing.length
    ? `в снимке есть, в базе нет: ${missing.length}`
    : `${snapshot.length} товаров с обеих сторон`
);

// --- итог --------------------------------------------------------------

if (failed > 0) {
  console.error(`\nПроверок не прошло: ${failed}\n`);
  process.exit(1);
}

console.log("\nВсе проверки пройдены\n");
