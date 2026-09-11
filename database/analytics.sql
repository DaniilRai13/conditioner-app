-- =============================================================================
-- Климат Лайн — аналитика сайта
--
-- Сколько людей заходит, какие страницы открывают и сколько из них пишут.
-- Выполнять ПОСЛЕ schema.sql, в SQL Editor. Повторный запуск безопасен.
--
-- Из браузера сюда никто не пишет. Сайт — статика на CDN; он стучится
-- в /api/track, а тот обращается к базе сервисным ключом. Поэтому ниже
-- нет ни одной политики на запись: service_role обходит RLS, а анонимный
-- ключ не может ни читать эти таблицы, ни добавлять в них строки.
--
-- Персональных данных здесь нет намеренно:
--   * адрес не хранится — только его отпечаток, посоленный сегодняшней
--     датой; обратно в адрес он не превращается;
--   * что человек написал, лежит в public.leads и показывается в админке,
--     а здесь только факт обращения.
-- Поэтому сайту не нужен баннер про куки: на устройство посетителя ничего
-- не записывается, а опознать его по сохранённому нельзя.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- page_views
--
-- Строка на каждое открытие страницы. Считаем на чтении, а не храним один
-- счётчик: число «всего посещений» не ответит ни на «сколько было на той
-- неделе», ни на «какая страница популярна», ни на «не накрутил ли это
-- робот» — и починить его задним числом уже нельзя.
-- -----------------------------------------------------------------------------
create table if not exists public.page_views (
  id            bigint generated always as identity primary key,

  -- Только путь, без строки запроса: '/', '/catalog', '/product/<slug>'.
  -- Именно в параметрах случайно оказываются персональные данные (?phone=…),
  -- и обработчик отрезает их до того, как они сюда доедут.
  path          text not null check (path ~ '^/' and length(path) <= 200),

  -- sha256(адрес + браузер + дата + соль), считается на сервере. Один
  -- человек за день даёт один и тот же отпечаток, поэтому обновление
  -- страницы не считается дважды. Соль меняется в полночь — проследить
  -- за кем-то из вчера в сегодня по этому отпечатку нельзя, в этом и смысл.
  visitor_hash  text not null check (length(visitor_hash) = 64),

  -- Только хост: 'google.com', 'yandex.by'. null — зашли напрямую.
  referrer_host text check (length(referrer_host) <= 253),

  device        text not null default 'desktop'
    check (device in ('mobile', 'tablet', 'desktop')),

  -- Роботов записываем, а не отбрасываем: отсев на записи выкинул бы
  -- единственное доказательство, что всплеск был обходом поисковика.
  is_bot        boolean not null default false,

  created_at    timestamptz not null default now()
);

-- Любой отчёт — это «свежие строки, новые сверху»; второй индекс отдаёт
-- разбивку по страницам без повторного прохода по таблице.
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path, created_at desc);

-- Отпечаток посетителя на заявке: по нему заявка связывается с посещениями
-- того же дня — видно, с какой страницы человек начал, а не только с какой
-- отправил форму. Колонкой, а не отдельной таблицей: заявок мало.
alter table public.leads
  add column if not exists visitor_hash text
    check (visitor_hash is null or length(visitor_hash) = 64);

-- =============================================================================
-- Row Level Security
--
-- Чтение — вошедшему в админку. Запись делает /api/track сервисным ключом,
-- а тот RLS не подчиняется, поэтому разрешать здесь нечего: анонимному
-- ключу не остаётся ни одного пути внутрь.
-- =============================================================================

alter table public.page_views enable row level security;

drop policy if exists page_views_read_auth on public.page_views;
create policy page_views_read_auth
  on public.page_views for select to authenticated using (true);

-- =============================================================================
-- Отчёты
--
-- Представления, а не запросы в приложении: что считать посетителем,
-- описано в одном месте, и админка не может случайно посчитать роботов.
--
-- security_invoker заставляет представление работать с правами того, кто
-- из него читает, — значит политики выше продолжают действовать. Без него
-- представление радостно отдало бы анонимному ключу всё, что под ним.
--
-- Сутки минские. Группировка по UTC разрезала бы каждый вечер пополам.
-- =============================================================================

create or replace view public.page_views_daily
with (security_invoker = true) as
select
  (created_at at time zone 'Europe/Minsk')::date as day,
  count(*)                                       as hits,
  count(distinct visitor_hash)                   as visitors
from public.page_views
where not is_bot
group by 1;

create or replace view public.page_views_by_path
with (security_invoker = true) as
select
  path,
  count(*)                     as hits,
  count(distinct visitor_hash) as visitors,
  max(created_at)              as last_seen
from public.page_views
where not is_bot
  and created_at >= now() - interval '30 days'
group by path;

create or replace view public.page_views_by_referrer
with (security_invoker = true) as
select
  coalesce(referrer_host, '(напрямую)') as source,
  count(*)                              as hits,
  count(distinct visitor_hash)          as visitors
from public.page_views
where not is_bot
  and created_at >= now() - interval '30 days'
group by 1;

-- Представлений по заявкам здесь нет намеренно.
--
-- Заявок сотни, а не миллионы, и админка всё равно загружает их списком.
-- Считать их ещё и в базе значило бы завести второе определение того, что
-- такое заявка: представление и список на экране разошлись бы при первом
-- же изменении статусов, и оба выглядели бы правдой. Разбивка по дням
-- и по источникам считается в app/lib/analytics-api.ts из тех же строк.
--
-- Побочная выгода важнее: раздел заявок работает, даже если этот файл
-- ещё не накачен, — а он понадобится только вместе с хостингом.

-- =============================================================================
-- Хранение
--
-- Строка весит около полусотни байт: год трафика небольшого сайта — это
-- несколько мегабайт, спешить некуда. И всё же сырые строки теряют смысл,
-- как только от них остаётся только тренд.
--
--   select public.prune_page_views();       -- оставит примерно 13 месяцев
--
-- Запускать руками время от времени или из pg_cron, если он включён.
-- =============================================================================
create or replace function public.prune_page_views(keep_days integer default 400)
returns integer
language plpgsql
security definer
set search_path = public
as $prune$
declare
  removed integer;
begin
  delete from public.page_views
  where created_at < now() - make_interval(days => keep_days);

  get diagnostics removed = row_count;
  return removed;
end;
$prune$;

revoke all on function public.prune_page_views(integer) from anon, authenticated;
