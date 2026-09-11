-- =============================================================================
-- Климат Лайн — схема Supabase
--
-- Выполнить целиком один раз: Supabase → SQL Editor → New query → Run.
-- Файл идемпотентный: повторный запуск не удаляет данные.
--
-- Порядок важен: сначала таблицы, потом RLS, потом политики.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Кто может входить в админку
--
-- Одна строка на пользователя auth. Нужна потому, что auth.users из браузера
-- не читается, а показать «вы вошли как…» и проверить право на запись надо.
--
-- Пользователей здесь двое: мастер (владелец сайта) и разработчик. Роль
-- различает их только в интерфейсе — писать в таблицы может любой вошедший.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  role       text not null default 'owner' check (role in ('owner', 'dev')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Профиль заводится сам при создании пользователя
--
-- Иначе после каждого «Add user» в панели нужно копировать UUID и руками
-- вставлять строку. Шаг лишний, а забыть его легко: вход при этом пройдёт,
-- и админка встретит человека сообщением про отсутствующий профиль.
--
-- security definer обязателен: триггер срабатывает в контексте схемы auth,
-- а пишет в public.profiles, куда у него иначе нет прав.
--
-- ВАЖНО: триггер выдаёт доступ КАЖДОМУ созданному пользователю. Это
-- безопасно ровно до тех пор, пока регистрация закрыта — Authentication →
-- Sign In / Providers → Email → выключить «Allow new users to sign up».
-- Включите её, и любой желающий заведёт себе админку сам.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    -- Имя из метаданных, иначе часть почты до собаки: «ivan@mail.by» → «ivan».
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    -- Роль тоже из метаданных, но только знакомая: чужое значение
    -- не прошло бы проверку в таблице и уронило бы создание пользователя.
    case when new.raw_user_meta_data ->> 'role' = 'dev' then 'dev' else 'owner' end
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Товары
--
-- Разделение полей — главное в этой таблице:
--
--   поля поставщика  source_id, name, brand, model, type, price, in_stock,
--                    specs, image
--                    перезаписываются импортом (scripts/import-catalog.ts)
--
--   наши поля        description, tier, featured, sort_order, is_published
--                    импорт их НЕ ТРОГАЕТ, ведутся руками и через админку
--
-- Перепутать нельзя: импорт затрёт описание, которое кто-то писал полдня.
-- Поэтому он делает upsert только по колонкам поставщика, явным списком.
--
-- specs лежит целиком в jsonb: у выгрузки полтора десятка характеристик,
-- набор которых меняется от типа техники, и раскладывать их по колонкам
-- значит менять схему при каждом новом поле.
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  source_id   integer unique,
  slug        text not null unique,
  name        text not null,
  brand       text not null default '',
  model       text not null default '',
  type        text not null check (type in ('split', 'multi-split', 'mobile', 'semi-industrial')),
  price       integer not null check (price >= 0),
  in_stock    boolean not null default false,
  image       text,
  specs       jsonb not null default '{}'::jsonb,

  description text not null default '',
  tier        text not null default 'optimum' check (tier in ('budget', 'optimum', 'premium')),
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  is_published boolean not null default true,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Ссылка на карточку у поставщика: не показывается, но по ней находят
-- первоисточник, когда данные вызывают сомнения. Отдельным alter, потому
-- что create table if not exists не добавляет колонку в уже созданную
-- таблицу — при повторном накате её иначе не появится.
alter table public.products
  add column if not exists source_url text not null default '';

create index if not exists products_type_idx on public.products (type);
create index if not exists products_published_idx on public.products (is_published);

-- -----------------------------------------------------------------------------
-- Цены на монтаж
--
-- Строка на класс мощности. area_to — верхняя граница площади: по ней
-- страница цен подбирает оборудование из каталога, и она же уезжает
-- в ссылку на фильтр.
--
-- Пока is_confirmed = false хотя бы у одной строки, сайт пишет «по запросу»
-- вместо числа. Публиковать выдуманный прайс нельзя: человек приедет
-- с этой цифрой, а подтвердить её нечем.
-- -----------------------------------------------------------------------------
create table if not exists public.install_prices (
  id           uuid primary key default gen_random_uuid(),
  btu          text not null,
  kw           text not null,
  area         text not null,
  area_to      integer not null,
  price        integer not null check (price >= 0),
  is_confirmed boolean not null default false,
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Настройки сайта
--
-- Ключ-значение вместо колонок: сюда попадают разнородные мелочи —
-- срок поставки, состав монтажа, что оплачивается отдельно, флаги показа
-- портфолио и отзывов. Заводить колонку под каждую значит ходить в схему
-- ради строчки текста.
--
-- value — jsonb, чтобы хранить и строку, и число, и список.
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  label      text not null default '',
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Отзывы
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  author       text not null check (length(btrim(author)) between 1 and 120),
  text         text not null check (length(btrim(text)) between 1 and 2000),
  rating       integer check (rating between 1 and 5),
  date         date not null default current_date,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Портфолио: работы с фотографиями
--
-- Фотографии отдельной таблицей, а не массивом путей: у них свой порядок
-- и признак обложки, а порядок в массиве нечем менять из интерфейса,
-- не переписывая массив целиком.
-- -----------------------------------------------------------------------------
create table if not exists public.portfolio_projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(btrim(title)) between 1 and 200),
  description  text not null default '',
  area         text not null default '',
  date         date not null default current_date,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.portfolio_projects (id) on delete cascade,
  storage_path text not null,
  sort_order   integer not null default 0,
  is_preview   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists portfolio_images_project_idx
  on public.portfolio_images (project_id);

-- -----------------------------------------------------------------------------
-- Заявки
--
-- История сверх телеграма: в переписке заявка теряется через неделю,
-- а здесь её видно вместе со статусом.
--
-- Пишет сюда только серверная функция с service_role. Из браузера в эту
-- таблицу нельзя ни писать, ни читать анонимно: тут персональные данные.
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text not null,
  message      text not null default '',
  source       text not null default '',
  page         text not null default '',
  product_slug text,
  quiz_answers jsonb not null default '{}'::jsonb,
  status       text not null default 'new'
    check (status in ('new', 'called', 'in_work', 'done', 'rejected')),
  note         text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

-- -----------------------------------------------------------------------------
-- updated_at сам по себе
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $touch$
begin
  new.updated_at = now();
  return new;
end;
$touch$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists portfolio_touch on public.portfolio_projects;
create trigger portfolio_touch before update on public.portfolio_projects
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- RLS
--
-- Включается на всех таблицах без исключения. Anon-ключ лежит в клиентском
-- бандле и виден любому — без RLS это открытая база на запись.
--
-- Правило чтения: анонимному видно только опубликованное. Правило записи:
-- писать может любой вошедший. Раздельных прав по ролям нет намеренно —
-- пользователей двое, и городить матрицу прав ради этого незачем.
-- =============================================================================

alter table public.profiles           enable row level security;
alter table public.products           enable row level security;
alter table public.install_prices     enable row level security;
alter table public.settings           enable row level security;
alter table public.reviews            enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images   enable row level security;
alter table public.leads              enable row level security;

-- profiles: своя строка видна себе, вошедшим видны все (для подписи автора)
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

-- products
drop policy if exists products_read_anon on public.products;
create policy products_read_anon on public.products
  for select to anon using (is_published);

drop policy if exists products_all_auth on public.products;
create policy products_all_auth on public.products
  for all to authenticated using (true) with check (true);

-- install_prices: цены нужны сайту на сборке всегда, даже неподтверждённые —
-- решение «показывать или писать по запросу» принимает сайт, а не база
drop policy if exists prices_read_anon on public.install_prices;
create policy prices_read_anon on public.install_prices
  for select to anon using (true);

drop policy if exists prices_all_auth on public.install_prices;
create policy prices_all_auth on public.install_prices
  for all to authenticated using (true) with check (true);

-- settings
drop policy if exists settings_read_anon on public.settings;
create policy settings_read_anon on public.settings
  for select to anon using (true);

drop policy if exists settings_all_auth on public.settings;
create policy settings_all_auth on public.settings
  for all to authenticated using (true) with check (true);

-- reviews
drop policy if exists reviews_read_anon on public.reviews;
create policy reviews_read_anon on public.reviews
  for select to anon using (is_published);

drop policy if exists reviews_all_auth on public.reviews;
create policy reviews_all_auth on public.reviews
  for all to authenticated using (true) with check (true);

-- portfolio
drop policy if exists portfolio_read_anon on public.portfolio_projects;
create policy portfolio_read_anon on public.portfolio_projects
  for select to anon using (is_published);

drop policy if exists portfolio_all_auth on public.portfolio_projects;
create policy portfolio_all_auth on public.portfolio_projects
  for all to authenticated using (true) with check (true);

drop policy if exists portfolio_images_read_anon on public.portfolio_images;
create policy portfolio_images_read_anon on public.portfolio_images
  for select to anon using (
    exists (
      select 1 from public.portfolio_projects p
      where p.id = project_id and p.is_published
    )
  );

drop policy if exists portfolio_images_all_auth on public.portfolio_images;
create policy portfolio_images_all_auth on public.portfolio_images
  for all to authenticated using (true) with check (true);

-- leads: анонимному ничего. Запись — только service_role, он RLS обходит.
drop policy if exists leads_read_auth on public.leads;
create policy leads_read_auth on public.leads
  for select to authenticated using (true);

drop policy if exists leads_update_auth on public.leads;
create policy leads_update_auth on public.leads
  for update to authenticated using (true) with check (true);

-- =============================================================================
-- Storage
--
-- Бакеты создаются здесь же, чтобы не кликать в панели и не забыть про
-- публичное чтение. Картинки товаров и фото работ открыты всем: они и так
-- показываются на сайте, а подписанные ссылки на статике невозможны —
-- HTML отдаётся из кэша CDN и ссылка в нём протухнет.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists storage_read_public on storage.objects;
create policy storage_read_public on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('products', 'portfolio'));

drop policy if exists storage_write_auth on storage.objects;
create policy storage_write_auth on storage.objects
  for all to authenticated
  using (bucket_id in ('products', 'portfolio'))
  with check (bucket_id in ('products', 'portfolio'));
