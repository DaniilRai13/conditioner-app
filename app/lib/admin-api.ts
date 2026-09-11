import type { Session } from "@supabase/supabase-js";
import { fail, ok, type ApiError, type ApiResponse } from "./api";
import { getSupabase, toApiError } from "./supabase";
import type { ProductSpecs, ProductTier, ProductType } from "~/types/product";

/**
 * Всё, что админка спрашивает у базы.
 *
 * Здесь же формы строк. Они в snake_case, как в Postgres: переименование
 * в camelCase по дороге означало бы мэппинг на каждый запрос и невозможность
 * найти колонку в SQL Editor по имени из кода. Общие с сайтом перечисления
 * (`ProductType`, `ProductTier`) берутся из `~/types/product` — ради этого
 * админка и живёт внутри сайта, а не отдельным приложением.
 */

// --- формы строк -------------------------------------------------------

export interface Profile {
  id: string;
  name: string;
  role: "owner" | "dev";
}

export interface User extends Profile {
  email: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  type: ProductType;
  price: number;
  image: string | null;
  // Тот же тип, что у товара на сайте: колонка одна, jsonb один, и вторая
  // её форма означала бы, что одни и те же данные описаны дважды.
  specs: ProductSpecs;

  // Наши поля: импорт их не трогает, ведутся здесь.
  description: string;
  tier: ProductTier;
  featured: boolean;
  sort_order: number;
  is_published: boolean;
}

export interface InstallPriceRow {
  id: string;
  btu: string;
  kw: string;
  area: string;
  area_to: number;
  price: number;
  is_confirmed: boolean;
  sort_order: number;
}

export interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  label: string;
}

export interface ReviewRow {
  id: string;
  author: string;
  text: string;
  rating: number | null;
  date: string;
  is_published: boolean;
  sort_order: number;
}

export interface PortfolioImageRow {
  id: string;
  project_id: string;
  storage_path: string;
  sort_order: number;
  is_preview: boolean;
  /** Считается на клиенте: бакет публичный, подписывать ссылку не нужно. */
  url: string;
}

export interface PortfolioRow {
  id: string;
  title: string;
  description: string;
  area: string;
  date: string;
  is_published: boolean;
  sort_order: number;
  images: PortfolioImageRow[];
}

export type LeadStatus = "new" | "called" | "in_work" | "done" | "rejected";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "called", label: "Перезвонил" },
  { value: "in_work", label: "В работе" },
  { value: "done", label: "Закрыта" },
  { value: "rejected", label: "Отказ" },
];

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  message: string;
  source: string;
  page: string;
  product_slug: string | null;
  quiz_answers: Record<string, string>;
  status: LeadStatus;
  note: string;
  created_at: string;
}

// --- вход --------------------------------------------------------------

/**
 * Профиль вошедшего. Сессия даёт только почту: `auth.users` из браузера
 * не читается. Имя и роль лежат в `profiles`, и строка там обязана быть —
 * без неё админкой пользоваться нельзя, поэтому это ошибка, а не пустота.
 */
async function loadUser(session: Session): Promise<ApiResponse<User>> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, name, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) return fail(toApiError(error, "Не удалось загрузить профиль."));

  if (!data) {
    return fail({
      code: "auth/no-profile",
      message:
        "У этой учётной записи нет профиля. Добавьте строку в таблицу profiles — " +
        "как это сделать, написано в конце database/seed.sql.",
    });
  }

  return ok({ ...(data as Profile), email: session.user.email ?? "" });
}

export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse<User>> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });

  if (error) return fail(toApiError(error, "Не удалось войти."));
  if (!data.session) {
    return fail({ code: "auth/no-session", message: "Сессия не создана." });
  }
  return loadUser(data.session);
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function currentUser(): Promise<ApiResponse<User | null>> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) return fail(toApiError(error, "Не удалось проверить сессию."));
  if (!data.session) return ok(null);
  return loadUser(data.session);
}

/** Вход и выход в других вкладках: без подписки они остаются «вошедшими». */
export function onAuthChange(handler: () => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange(() => handler());
  return () => data.subscription.unsubscribe();
}

// --- публикация --------------------------------------------------------

/**
 * Запуск сборки на хостинге.
 *
 * Адрес сборки секретный и лежит на сервере — сюда он не приходит и прийти
 * не может: всё, что попало в бандл, публично. Отсюда уходит только токен
 * вошедшего, чтобы обработчик убедился, что кнопку нажал свой.
 */
export async function publish(): Promise<ApiResponse<{ at: string }>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return fail({ code: "auth/no-session", message: "Сессия истекла — войдите заново." });
  }

  let res: Response;
  try {
    res = await fetch("/api/publish", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return fail({
      code: "publish/offline",
      message: "Не получилось связаться с сервером. Проверьте интернет.",
    });
  }

  if (res.ok) return ok((await res.json()) as { at: string });

  // Причины разные, и человеку нужна именно причина, а не «ошибка 503».
  // От неё зависит, что делать: ждать, звать программиста или войти заново.
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    waitSeconds?: number;
  };

  const known: Record<string, ApiError> = {
    no_hook: {
      code: "publish/no-hook",
      message:
        "Публикация не настроена: хостинг ещё не выбран, и запускать сборку негде. " +
        "Правки сохранены и попадут на сайт со следующей сборкой.",
    },
    not_configured: {
      code: "publish/not-configured",
      message: "На сервере не хватает ключей Supabase. Это к разработчику.",
    },
    unauthorized: {
      code: "publish/unauthorized",
      message: "Сессия истекла — войдите заново.",
    },
    too_soon: {
      code: "publish/too-soon",
      message: `Сборка уже запускалась только что. Подождите ${body.waitSeconds ?? 60} секунд.`,
    },
    hook_failed: {
      code: "publish/failed",
      message: "Хостинг отказался запускать сборку. Попробуйте позже.",
    },
    hook_unreachable: {
      code: "publish/failed",
      message: "Хостинг не отвечает. Попробуйте позже.",
    },
  };

  return fail(
    known[body.error ?? ""] ?? {
      code: "publish/failed",
      message: "Не удалось запустить сборку.",
      details: String(res.status),
    }
  );
}

/**
 * Когда сайт собирался последний раз.
 *
 * Файл лежит рядом со статикой и обновляется на каждой сборке. Спрашиваем
 * его у живого сайта, а не у базы: база знает, когда нажали кнопку, а этот
 * файл — когда сборка на самом деле прошла. Между этими событиями бывает
 * неудача, и врать про неё нельзя.
 *
 * `no-store` и метка времени в адресе: без них браузер и CDN отдадут
 * закешированный ответ, и сайт будет «вечно неопубликованным».
 */
export async function getBuildTime(): Promise<string | null> {
  try {
    const res = await fetch(`/build-info.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { builtAt?: string };
    return body.builtAt ?? null;
  } catch {
    return null;
  }
}

// --- заявки ------------------------------------------------------------

/**
 * Сводка для главной: по одному числу на раздел.
 *
 * Считает база, а не браузер: `head: true` с `count` не тянет ни одной
 * строки — приходит только число. Тянуть полсотни товаров, чтобы показать
 * «50», значит гонять по сети мегабайт ради двух знаков.
 *
 * Запросы параллельно: они независимы, а по очереди главная открывалась бы
 * за сумму задержек до Франкфурта и обратно, восемь раз подряд.
 */
export interface Summary {
  leadsNew: number;
  leadsTotal: number;
  productsPublished: number;
  productsHidden: number;
  productsNoDescription: number;
  reviewsTotal: number;
  reviewsPublished: number;
  projectsTotal: number;
  projectsPublished: number;
  pricesUnconfirmed: number;
}

export async function getSummary(): Promise<ApiResponse<Summary>> {
  const db = getSupabase();
  const count = { count: "exact" as const, head: true };

  const [
    leadsNew,
    leadsTotal,
    published,
    hidden,
    noDescription,
    reviews,
    reviewsOn,
    projects,
    projectsOn,
    prices,
  ] = await Promise.all([
    db.from("leads").select("id", count).eq("status", "new"),
    db.from("leads").select("id", count),
    db.from("products").select("id", count).eq("is_published", true),
    db.from("products").select("id", count).eq("is_published", false),
    db.from("products").select("id", count).eq("description", ""),
    db.from("reviews").select("id", count),
    db.from("reviews").select("id", count).eq("is_published", true),
    db.from("portfolio_projects").select("id", count),
    db.from("portfolio_projects").select("id", count).eq("is_published", true),
    db.from("install_prices").select("id", count).eq("is_confirmed", false),
  ]);

  const failed = [
    leadsNew,
    leadsTotal,
    published,
    hidden,
    noDescription,
    reviews,
    reviewsOn,
    projects,
    projectsOn,
    prices,
  ].find((r) => r.error)?.error;

  if (failed) return fail(toApiError(failed, "Не удалось загрузить сводку."));

  return ok({
    leadsNew: leadsNew.count ?? 0,
    leadsTotal: leadsTotal.count ?? 0,
    productsPublished: published.count ?? 0,
    productsHidden: hidden.count ?? 0,
    productsNoDescription: noDescription.count ?? 0,
    reviewsTotal: reviews.count ?? 0,
    reviewsPublished: reviewsOn.count ?? 0,
    projectsTotal: projects.count ?? 0,
    projectsPublished: projectsOn.count ?? 0,
    pricesUnconfirmed: prices.count ?? 0,
  });
}


/**
 * Когда в базе последний раз что-то меняли.
 *
 * Сравнивается с временем сборки из /build-info.json: новее здесь —
 * значит, есть неопубликованные правки.
 *
 * Заявки в расчёт не берём намеренно, и это важно. Они приходят с сайта
 * сами, круглые сутки, и ни одна из них на сайте ничего не меняет.
 * Учитывай мы их, кнопка «Опубликовать» загоралась бы после каждого
 * обращения клиента — и очень быстро перестала бы что-либо значить.
 *
 * По той же причине здесь нет и отметки самой публикации (last_publish):
 * она пишется в settings, и без исключения нажатие кнопки тут же
 * объявляло бы себя новой неопубликованной правкой.
 */
export async function getLastChange(): Promise<ApiResponse<string | null>> {
  const db = getSupabase();
  const newest = { ascending: false } as const;

  const [products, prices, settings, projects, reviews] = await Promise.all([
    db.from("products").select("updated_at").order("updated_at", newest).limit(1),
    db.from("install_prices").select("updated_at").order("updated_at", newest).limit(1),
    db
      .from("settings")
      .select("updated_at")
      .neq("key", "last_publish")
      .order("updated_at", newest)
      .limit(1),
    db
      .from("portfolio_projects")
      .select("updated_at")
      .order("updated_at", newest)
      .limit(1),
    // У отзывов нет updated_at: правка не отличается от создания, и для
    // вопроса «есть ли что публиковать» этого достаточно.
    db.from("reviews").select("created_at").order("created_at", newest).limit(1),
  ]);

  const failed = [products, prices, settings, projects, reviews].find(
    (r) => r.error
  )?.error;

  if (failed) {
    return fail(toApiError(failed, "Не удалось проверить правки."));
  }

  const times = [
    (products.data?.[0] as { updated_at?: string } | undefined)?.updated_at,
    (prices.data?.[0] as { updated_at?: string } | undefined)?.updated_at,
    (settings.data?.[0] as { updated_at?: string } | undefined)?.updated_at,
    (projects.data?.[0] as { updated_at?: string } | undefined)?.updated_at,
    (reviews.data?.[0] as { created_at?: string } | undefined)?.created_at,
  ].filter((t): t is string => Boolean(t));

  if (times.length === 0) return ok(null);

  // Строки ISO сравниваются как строки: формат с ведущими нулями и
  // фиксированной длиной для этого и придуман.
  return ok(times.reduce((a, b) => (a > b ? a : b)));
}

export async function listLeads(): Promise<ApiResponse<LeadRow[]>> {
  const { data, error } = await getSupabase()
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return fail(toApiError(error, "Не удалось загрузить заявки."));
  return ok(data as LeadRow[]);
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; note?: string }
): Promise<ApiResponse<null>> {
  const { error } = await getSupabase().from("leads").update(patch).eq("id", id);
  if (error) return fail(toApiError(error, "Не удалось сохранить заявку."));
  return ok(null);
}

// --- цены --------------------------------------------------------------

export async function listPrices(): Promise<ApiResponse<InstallPriceRow[]>> {
  const { data, error } = await getSupabase()
    .from("install_prices")
    .select("*")
    .order("sort_order");

  if (error) return fail(toApiError(error, "Не удалось загрузить цены."));
  return ok(data as InstallPriceRow[]);
}

export async function updatePrice(
  id: string,
  patch: Partial<Pick<InstallPriceRow, "price" | "is_confirmed">>
): Promise<ApiResponse<null>> {
  const { error } = await getSupabase()
    .from("install_prices")
    .update(patch)
    .eq("id", id);

  if (error) return fail(toApiError(error, "Не удалось сохранить цену."));
  return ok(null);
}

// --- настройки ---------------------------------------------------------

export async function listSettings(): Promise<ApiResponse<SettingRow[]>> {
  const { data, error } = await getSupabase()
    .from("settings")
    .select("*")
    .order("key");

  if (error) return fail(toApiError(error, "Не удалось загрузить настройки."));
  // У таблицы первичный ключ — key; useRows требует id, подставляем его.
  return ok((data as Omit<SettingRow, "id">[]).map((s) => ({ ...s, id: s.key })));
}

/**
 * Сохранение настройки. Upsert, а не update.
 *
 * Настройки заводятся сидом, но появляются и позже — вместе с новой
 * возможностью в админке. UPDATE по несуществующему ключу возвращает
 * успех и ноль изменённых строк: человек правит поле, видит «сохранено»,
 * а в базе ничего нет. Эта ошибка не показывает себя вообще ничем,
 * и найти её можно только по тому, что на сайте старый текст.
 *
 * onConflict по ключу — он первичный, и другой строки с тем же ключом
 * быть не может.
 */
export async function updateSetting(
  key: string,
  value: unknown
): Promise<ApiResponse<null>> {
  const { error } = await getSupabase()
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return fail(toApiError(error, "Не удалось сохранить настройку."));
  return ok(null);
}

// --- товары ------------------------------------------------------------

export async function listProducts(): Promise<ApiResponse<ProductRow[]>> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) return fail(toApiError(error, "Не удалось загрузить товары."));
  return ok(data as ProductRow[]);
}

/**
 * Обновление товара. Тип разрешает только наши поля: цена, характеристики
 * и наличие принадлежат поставщику и перезаписываются импортом — правка
 * их отсюда прожила бы до следующей выгрузки.
 */
export async function updateProduct(
  id: string,
  patch: Partial<
    Pick<
      ProductRow,
      "description" | "tier" | "featured" | "sort_order" | "is_published"
    >
  >
): Promise<ApiResponse<null>> {
  const { error } = await getSupabase().from("products").update(patch).eq("id", id);
  if (error) return fail(toApiError(error, "Не удалось сохранить товар."));
  return ok(null);
}

// --- отзывы ------------------------------------------------------------

export async function listReviews(): Promise<ApiResponse<ReviewRow[]>> {
  const { data, error } = await getSupabase()
    .from("reviews")
    .select("*")
    .order("sort_order")
    .order("date", { ascending: false });

  if (error) return fail(toApiError(error, "Не удалось загрузить отзывы."));
  return ok(data as ReviewRow[]);
}

export async function saveReview(
  review: Partial<ReviewRow> & { id?: string }
): Promise<ApiResponse<null>> {
  const { id, ...fields } = review;
  const db = getSupabase();
  const { error } = id
    ? await db.from("reviews").update(fields).eq("id", id)
    : await db.from("reviews").insert(fields);

  if (error) return fail(toApiError(error, "Не удалось сохранить отзыв."));
  return ok(null);
}

export async function deleteReview(id: string): Promise<ApiResponse<null>> {
  const { error } = await getSupabase().from("reviews").delete().eq("id", id);
  if (error) return fail(toApiError(error, "Не удалось удалить отзыв."));
  return ok(null);
}

// --- работы ------------------------------------------------------------

export const PORTFOLIO_BUCKET = "portfolio";

function publicUrl(storagePath: string): string {
  return getSupabase().storage.from(PORTFOLIO_BUCKET).getPublicUrl(storagePath).data
    .publicUrl;
}

export async function listProjects(): Promise<ApiResponse<PortfolioRow[]>> {
  const { data, error } = await getSupabase()
    .from("portfolio_projects")
    .select("*, portfolio_images (*)")
    .order("sort_order");

  if (error) return fail(toApiError(error, "Не удалось загрузить работы."));

  type Row = Omit<PortfolioRow, "images"> & {
    portfolio_images: Omit<PortfolioImageRow, "url">[];
  };

  return ok(
    (data as Row[]).map(({ portfolio_images, ...project }) => ({
      ...project,
      // PostgREST не сортирует вложенную таблицу — порядок восстанавливаем здесь.
      images: portfolio_images
        .map((img) => ({ ...img, url: publicUrl(img.storage_path) }))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  );
}

export async function saveProject(
  project: Partial<PortfolioRow> & { id?: string }
): Promise<ApiResponse<string>> {
  const { id, images: _images, ...fields } = project;
  const db = getSupabase();

  if (id) {
    const { error } = await db.from("portfolio_projects").update(fields).eq("id", id);
    if (error) return fail(toApiError(error, "Не удалось сохранить работу."));
    return ok(id);
  }

  const { data, error } = await db
    .from("portfolio_projects")
    .insert(fields)
    .select("id")
    .single();

  if (error) return fail(toApiError(error, "Не удалось создать работу."));
  return ok((data as { id: string }).id);
}

export async function deleteProject(id: string): Promise<ApiResponse<null>> {
  const db = getSupabase();

  // Строки фотографий уходят каскадом, файлы в Storage — нет. Удаляем явно,
  // иначе бакет копит мусор, на который уже ничто не ссылается.
  const { data: images } = await db
    .from("portfolio_images")
    .select("storage_path")
    .eq("project_id", id);

  const paths = (images ?? []).map(
    (i) => (i as { storage_path: string }).storage_path
  );
  if (paths.length) await db.storage.from(PORTFOLIO_BUCKET).remove(paths);

  const { error } = await db.from("portfolio_projects").delete().eq("id", id);
  if (error) return fail(toApiError(error, "Не удалось удалить работу."));
  return ok(null);
}

export async function uploadImage(
  projectId: string,
  file: File,
  sortOrder: number
): Promise<ApiResponse<null>> {
  const db = getSupabase();

  // Имя из времени и случайного хвоста: у двух снимков с телефона легко
  // совпадают имена, а перезапись чужой фотографии замечают не сразу.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${projectId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const upload = await db.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (upload.error) {
    return fail(toApiError(upload.error, "Не удалось загрузить фотографию."));
  }

  const { error } = await db
    .from("portfolio_images")
    .insert({ project_id: projectId, storage_path: path, sort_order: sortOrder });

  if (error) {
    // Строка не создалась — файл остался бы сиротой.
    await db.storage.from(PORTFOLIO_BUCKET).remove([path]);
    return fail(toApiError(error, "Не удалось сохранить фотографию."));
  }

  return ok(null);
}

export async function deleteImage(
  id: string,
  storagePath: string
): Promise<ApiResponse<null>> {
  const db = getSupabase();
  const { error } = await db.from("portfolio_images").delete().eq("id", id);
  if (error) return fail(toApiError(error, "Не удалось удалить фотографию."));

  await db.storage.from(PORTFOLIO_BUCKET).remove([storagePath]);
  return ok(null);
}
