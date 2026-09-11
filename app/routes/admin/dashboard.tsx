import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Images,
  Inbox,
  Package,
  RefreshCw,
  Star,
  Wallet,
} from "lucide-react";
import {
  getSummary,
  listLeads,
  listSettings,
  updateSetting,
  type LeadRow,
  type SettingRow,
  type Summary,
} from "~/lib/admin-api";
import {
  daysAgo,
  getTraffic,
  leadsByDay,
  leadsBySource,
  type Traffic,
} from "~/lib/analytics-api";
import { useSave } from "~/hooks/useSave";
import { useAuth } from "~/hooks/authContext";
import { Bars, eachDay, type BarPoint } from "~/components/admin/Bars";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  PageHead,
  Saved,
  Subhead,
  Textarea,
} from "~/components/admin/ui";
import type { ApiError } from "~/lib/api";
import styles from "./dashboard.module.scss";

/**
 * Главная админки.
 *
 * Отвечает на три вопроса, с которыми сюда заходят: что нового, как идут
 * дела и что нужно доделать. Всё остальное — по разделам.
 *
 * Раньше на этом месте сразу открывался список заявок. Это удобно ровно
 * до тех пор, пока заявок мало: длинный список не отвечает ни на «сколько
 * их было за месяц», ни на «что на сайте ещё не готово», а именно эти
 * вопросы возникают у владельца чаще, чем «покажи двести строк».
 */

// Цвета графиков. Два разных, потому что графики про разное, и оба должны
// читаться на белой карточке: фиолетовый — фирменный, красно-коричневый
// достаточно от него отличается, в том числе при дальтонизме.
const VISITS = "#49527e";
const LEADS = "#b8322f";

const RANGES = [
  { days: 7, label: "7 дней" },
  { days: 30, label: "30 дней" },
  { days: 90, label: "90 дней" },
];

const SOURCES: Record<string, string> = {
  hero: "первый экран",
  quiz: "подбор",
  product: "карточка товара",
  solution: "готовое решение",
  footer: "форма внизу",
  modal: "обратный звонок",
  home: "главная",
  "не указан": "не указан",
};

function when(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const percent = (part: number, whole: number) =>
  whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`;

/** Плитка с числом. */
function Tile({
  value,
  label,
  hint,
  to,
  accent,
}: {
  value: string;
  label: string;
  hint: string;
  to?: string;
  /** Главное число дашборда: тёмная плитка вместо белой. */
  accent?: boolean;
}) {
  const cls = accent ? `${styles.tile} ${styles.tileAccent}` : styles.tile;
  const body = (
    <>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileHint}>{hint}</span>
    </>
  );

  // Плитка со ссылкой — ссылка, а не div с обработчиком: работает средняя
  // кнопка мыши, «открыть в новой вкладке» и переход с клавиатуры.
  return to ? (
    <Link to={to} className={`${cls} ${styles.tileLink}`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Заметка на главной.
 *
 * Блокнот, а не система задач: список дел с галочками, сроками и статусами
 * пришлось бы вести, а здесь достаточно места, где записывают «позвонить
 * Сергею по Гомелю» и стирают, когда позвонили.
 */
function NoteCard({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const { save, saved, error } = useSave();

  return (
    <Card tone="accent">
      <Field label="Заметка" hint="Видна всем, кто заходит в админку">
        <Textarea
          rows={3}
          placeholder="Что не забыть: позвонить, уточнить, доделать…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            save(() => updateSetting("dashboard_note", e.target.value));
          }}
        />
      </Field>
      <Saved show={saved} />
      {error && <p className={styles.error}>{error.message}</p>}
    </Card>
  );
}

/**
 * Поля одной настройки-объекта: контакты, реквизиты, первый экран.
 *
 * Значение в базе — объект целиком, поэтому сохраняем его целиком, подменив
 * одно поле. Отдельная строка настройки на каждое поле дала бы десяток строк
 * вместо одной и десять запросов вместо одного.
 */
function FieldsCard({
  setting,
  fields,
}: {
  setting: SettingRow;
  fields: { key: string; label: string; hint?: string; long?: boolean }[];
}) {
  const initial = (setting.value ?? {}) as Record<string, string>;
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ?? ""]))
  );
  const { save, saved, error } = useSave();

  function change(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    save(() => updateSetting(setting.key, next));
  }

  return (
    <Card>
      <div className={styles.fields}>
        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            {f.long ? (
              <Textarea
                rows={3}
                value={values[f.key]}
                onChange={(e) => change(f.key, e.target.value)}
              />
            ) : (
              <Input
                value={values[f.key]}
                onChange={(e) => change(f.key, e.target.value)}
              />
            )}
          </Field>
        ))}
      </div>
      <Saved show={saved} />
      {error && <p className={styles.error}>{error.message}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  // Отдельно от loading: при обновлении по кнопке числа остаются на экране,
  // а признак работы живёт на самой кнопке. Поднять loading значило бы
  // заменить все плитки многоточиями и вернуть почти те же числа — экран
  // моргает без всякой пользы.
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async (byHand = false) => {
    if (byHand) setRefreshing(true);

    const [s, l, st, tr] = await Promise.all([
      getSummary(),
      // Заявки целиком, а не последние пять: из них же считаются график
      // по дням и разбивка по источникам. Их сотни, не миллионы, и второй
      // запрос ради тех же строк был бы лишним.
      listLeads(),
      listSettings(),
      getTraffic(range),
    ]);

    if (s.error) setError(s.error);
    else {
      setSummary(s.data);
      setError(null);
    }

    if (!l.error) setLeads(l.data);
    if (!st.error) setSettings(st.data);

    // Посещения могут быть недоступны, и это не ошибка страницы: счётчик
    // заработает вместе с хостингом, а заявки от него не зависят.
    setTraffic(tr.error ? null : tr.data);

    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Настройка по ключу — или пустая заготовка, если строки ещё нет.
   *
   * Строки заводятся сидом, но настройка может появиться и позже, вместе
   * с новой возможностью в админке. Без заготовки карточка просто не
   * отрисовалась бы: поле есть в коде, на экране его нет, и понять почему
   * нельзя ничем, кроме похода в SQL Editor. Сохранение делает upsert,
   * поэтому первая же правка создаёт строку по-настоящему.
   */
  const setting = (key: string, label: string): SettingRow =>
    settings.find((s) => s.key === key) ?? { id: key, key, value: {}, label };

  const note = setting("dashboard_note", "Заметка");
  const contacts = setting("contacts", "Контакты");
  const legal = setting("legal", "Реквизиты");
  const hero = setting("hero", "Первый экран");

  // Ряды графиков строятся по всем дням периода, включая пустые: график
  // из одних дней с данными молча смыкает промежутки и превращает тихую
  // неделю в оживлённую.
  const days = eachDay(range);

  const visitPoints: BarPoint[] = days.map((day) => {
    const found = traffic?.days.find((r) => r.day === day);
    return {
      day,
      value: found?.visitors ?? 0,
      detail: `${found?.hits ?? 0} просмотров`,
    };
  });

  const leadDays = leadsByDay(leads, daysAgo(range));
  const leadSources = leadsBySource(leads);

  const leadPoints: BarPoint[] = days.map((day) => {
    const found = leadDays.find((r) => r.day === day);
    return {
      day,
      value: found?.total ?? 0,
      detail: found?.done ? `${found.done} закрыто` : "в работе",
    };
  });

  // Счётчик считается работающим, если в базе есть хоть один день с данными.
  // Это не то же самое, что «ноль за период»: ноль — факт, а пустая таблица
  // значит, что /api/track ещё не развёрнут, и показывать ноль как результат
  // было бы враньём.
  const tracking = (traffic?.days.length ?? 0) > 0 || (traffic?.totalVisits ?? 0) > 0;

  const visits = visitPoints.reduce((sum, p) => sum + p.value, 0);
  const leadsInRange = leadPoints.reduce((sum, p) => sum + p.value, 0);

  // Что требует внимания. Список собирается из фактов, а не пишется руками:
  // пункт исчезает ровно тогда, когда дело сделано, и «доделать» перестаёт
  // быть вопросом памяти.
  const todo = [
    summary?.leadsNew
      ? {
          to: "/admin/leads",
          icon: Inbox,
          title: `Необработанных заявок: ${summary.leadsNew}`,
          note: "Люди ждут ответа",
        }
      : null,
    summary?.pricesUnconfirmed
      ? {
          to: "/admin/prices",
          icon: Wallet,
          title: `Не подтверждено строк прайса: ${summary.pricesUnconfirmed}`,
          note: "На сайте вместо цен стоит «по запросу»",
        }
      : null,
    summary?.productsNoDescription
      ? {
          to: "/admin/products?nodesc=1",
          icon: Package,
          title: `Товаров без описания: ${summary.productsNoDescription}`,
          note: "Поиск показывает такие карточки хуже остальных",
        }
      : null,
    summary && summary.reviewsTotal > 0 && summary.reviewsPublished === 0
      ? {
          to: "/admin/reviews",
          icon: Star,
          title: "Ни один отзыв не опубликован",
          note: "Блок отзывов на сайте скрыт",
        }
      : null,
    summary && summary.projectsTotal > 0 && summary.projectsPublished === 0
      ? {
          to: "/admin/portfolio",
          icon: Images,
          title: "Ни одна работа не опубликована",
          note: "Блок с работами на сайте скрыт",
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <>
      <PageHead
        title={user ? `Здравствуйте, ${user.name}` : "Главная"}
        text="Что нового, как идут дела и что осталось доделать. Правки на этой странице попадут на сайт после ближайшей пересборки."
      >
        <Button
          variant="ghost"
          small
          busy={refreshing}
          onClick={() => void load(true)}
        >
          <RefreshCw aria-hidden />
          {refreshing ? "Обновляю…" : "Обновить"}
        </Button>
      </PageHead>

      {error && <Notice tone="warn">{error.message}</Notice>}

      <NoteCard initial={typeof note.value === "string" ? note.value : ""} />

      {/* --- числа --- */}

      <div className={styles.head}>
        <Subhead>Сводка</Subhead>

        <div className={styles.ranges} role="group" aria-label="Период">
          {RANGES.map((option) => (
            <button
              key={option.days}
              type="button"
              className={
                range === option.days
                  ? `${styles.range} ${styles.rangeOn}`
                  : styles.range
              }
              aria-pressed={range === option.days}
              onClick={() => setRange(option.days)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tiles}>
        {/* Тёмная — одна на весь экран. Это число, ради которого сюда
            заходят: сколько людей ждут ответа. Остальные плитки рядом
            с ним справка, и белый цвет говорит именно это. */}
        <Tile
          accent
          value={loading ? "…" : String(summary?.leadsNew ?? 0)}
          label="Новых заявок"
          hint={`всего ${summary?.leadsTotal ?? 0}`}
          to="/admin/leads"
        />
        <Tile
          value={loading ? "…" : String(leadsInRange)}
          label="Заявок за период"
          hint={`за ${range} дней`}
          to="/admin/leads"
        />
        <Tile
          value={loading ? "…" : tracking ? String(visits) : "—"}
          label="Посещений"
          hint={tracking ? `за ${range} дней` : "счётчик не подключён"}
        />
        <Tile
          value={
            loading ? "…" : tracking ? percent(leadsInRange, visits) : "—"
          }
          label="Конверсия"
          hint={
            tracking ? "заявок от посещений" : "нужен счётчик посещений"
          }
        />
      </div>

      {/* Пока счётчик не развёрнут, честнее сказать это прямо, чем показать
          нули: ноль — это факт, а отсутствие данных им притворяться не должно. */}
      {!loading && !tracking && (
        <Notice>
          Счётчик посещений ещё не считает. Он включится, когда сайт выложат
          на хостинг с рабочим <code>/api/track</code> — до тех пор цифры
          по трафику пустые, а заявки считаются как обычно.
        </Notice>
      )}

      <div className={styles.charts}>
        <Card>
          <h3 className={styles.chartTitle}>Заявки по дням</h3>
          <Bars
            points={leadPoints}
            color={LEADS}
            label="заявок"
            empty="Заявок за этот период не было."
          />
        </Card>

        <Card>
          <h3 className={styles.chartTitle}>Посещения по дням</h3>
          {tracking ? (
            <Bars
              points={visitPoints}
              color={VISITS}
              label="посещений"
              empty="Посещений за этот период не было."
            />
          ) : (
            <p className={styles.placeholder}>
              Появится, когда заработает счётчик.
            </p>
          )}
        </Card>
      </div>

      {/* --- откуда заявки и что доделать --- */}

      <div className={styles.columns}>
        <section>
          <Subhead>Откуда приходят заявки</Subhead>
          <Card>
            {leadSources.length > 0 ? (
              <ul className={styles.sources}>
                {leadSources.map((s) => (
                  <li key={s.source} className={styles.source}>
                    <span>{SOURCES[s.source] ?? s.source}</span>
                    <b>{s.total}</b>
                    <span className={styles.sourceHint}>
                      {s.last30} за 30 дней
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>
                Пока не с чего считать — заявок не было.
              </p>
            )}
          </Card>
        </section>

        <section>
          <Subhead>Требует внимания</Subhead>
          <Card tone="accent">
            {todo.length > 0 ? (
              <ul className={styles.todo}>
                {todo.map(({ to, icon: Icon, title, note }) => (
                  <li key={to}>
                    <Link to={to} className={styles.todoLink}>
                      {/* Значок раздела, а не общий восклицательный знак:
                          по нему видно, куда ведёт пункт, ещё до чтения. */}
                      <span className={styles.todoIcon}>
                        <Icon aria-hidden />
                      </span>

                      <span className={styles.todoText}>
                        <b>{title}</b>
                        <span>{note}</span>
                      </span>

                      <ArrowRight className={styles.todoArrow} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>
                Всё на месте: прайс подтверждён, описания написаны,
                необработанных заявок нет.
              </p>
            )}
          </Card>
        </section>
      </div>

      {/* --- последние заявки --- */}

      {leads.length > 0 && (
        <>
          <div className={styles.head}>
            <Subhead>Последние заявки</Subhead>
            <Link to="/admin/leads" className={styles.more}>
              Все заявки
              <ArrowRight aria-hidden />
            </Link>
          </div>

          <Card>
            <ul className={styles.leads}>
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id} className={styles.lead}>
                  <span className={styles.leadWhen}>{when(lead.created_at)}</span>
                  <span className={styles.leadWho}>
                    <b>{lead.name}</b>
                    <a href={`tel:${lead.phone.replace(/\D/g, "")}`}>
                      {lead.phone}
                    </a>
                  </span>
                  <span className={styles.leadFrom}>
                    {SOURCES[lead.source] ?? lead.source}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* --- тексты сайта --- */}

      <Subhead>Тексты сайта</Subhead>

      <Notice>
        Эти поля стоят на сайте в подвале, на странице контактов и в первом
        экране. Пока они не заполнены, там видны заглушки вроде
        «+375 (00) 000-00-00» — так задумано: пустое место читалось бы как
        готовый сайт без телефона.
      </Notice>

      <div className={styles.texts}>
        <section>
            <h3 className={styles.cardTitle}>Контакты</h3>
            <FieldsCard
              setting={contacts}
              fields={[
                { key: "phone", label: "Телефон", hint: "+375 (29) 123-45-67" },
                { key: "workHours", label: "Часы работы" },
                { key: "telegram", label: "Telegram", hint: "адрес или @имя" },
                { key: "viber", label: "Viber", hint: "ссылка, если есть" },
                { key: "whatsapp", label: "WhatsApp", hint: "ссылка, если есть" },
                { key: "email", label: "Почта" },
              ]}
            />
        </section>

        <section>
            <h3 className={styles.cardTitle}>Реквизиты</h3>
            <FieldsCard
              setting={legal}
              fields={[
                { key: "entity", label: "Кто оказывает услуги", hint: "ИП Иванов И. И." },
                { key: "unp", label: "УНП" },
                { key: "address", label: "Адрес" },
              ]}
            />
        </section>

        <section className={styles.wide}>
            <h3 className={styles.cardTitle}>Первый экран главной</h3>
            <FieldsCard
              setting={hero}
              fields={[
                {
                  key: "title",
                  label: "Заголовок",
                  hint: "Главный текст страницы для поиска. Пустое поле вернёт текст по умолчанию",
                  long: true,
                },
                { key: "subtitle", label: "Подзаголовок", long: true },
              ]}
          />
        </section>
      </div>
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Главная — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
