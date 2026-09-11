import type { MetaFunction } from "react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Phone, RefreshCw } from "lucide-react";
import { listLeads, updateLead } from "~/lib/admin-api";
import { useRows } from "~/hooks/useRows";
import { useSave } from "~/hooks/useSave";
import { Drawer, useDrawer } from "~/components/admin/Drawer";
import {
  Badge,
  Button,
  Field,
  PageHead,
  Saved,
  Select,
  State,
  Textarea,
} from "~/components/admin/ui";
import { LEAD_STATUSES, type LeadRow, type LeadStatus } from "~/lib/admin-api";
import { shortPage } from "~/lib/format";
import styles from "./leads.module.scss";

/**
 * Заявки. Главный раздел: телеграм показывает заявку один раз, а здесь
 * видно всю историю вместе со статусом — кому перезвонили, кто в работе,
 * кто отказался.
 *
 * Только чтение и два поля: статус и заметка. Ни создания, ни удаления
 * намеренно — заявки приходят с сайта, и правка их задним числом означала бы,
 * что списку нельзя доверять.
 *
 * Карточки, а не таблица. У заявки семь полей, из них два редактируются:
 * в строке таблицы это пять колонок, две из которых — выпадающий список
 * и поле заметки. На ноутбуке они сминают друг друга, на телефоне не
 * помещаются вовсе. Карточка показывает то, по чему заявку узнают — когда,
 * кто, откуда, — а правка открывается панелью, как у товаров.
 */

const SOURCES: Record<string, string> = {
  hero: "первый экран",
  quiz: "подбор",
  product: "карточка товара",
  solution: "готовое решение",
  footer: "форма внизу",
  modal: "обратный звонок",
  home: "главная",
};

/** Цвет статуса. Список из полусотни заявок читается пятном, а не построчно. */
const STATUS_CLASS: Record<LeadStatus, string> = {
  new: styles.stNew,
  called: styles.stCalled,
  in_work: styles.stWork,
  done: styles.stDone,
  rejected: styles.stRejected,
};

const statusLabel = (status: LeadStatus) =>
  LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;

function when(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function answers(quiz: Record<string, string>): string {
  return Object.entries(quiz)
    .map(([k, v]) => (k === "area" ? `до ${v} м²` : v))
    .join(" · ");
}

/** Карточка в списке. Ничего не редактирует — только показывает и открывает. */
function LeadCard({
  lead,
  onOpen,
}: {
  lead: LeadRow;
  onOpen: (lead: LeadRow, trigger: HTMLElement) => void;
}) {
  const quiz = Object.keys(lead.quiz_answers).length > 0;

  return (
    <button
      type="button"
      className={
        lead.status === "new" ? `${styles.card} ${styles.fresh}` : styles.card
      }
      onClick={(e) => onOpen(lead, e.currentTarget)}
    >
      <span className={styles.cardTop}>
        <span className={styles.when}>{when(lead.created_at)}</span>
        <span className={`${styles.status} ${STATUS_CLASS[lead.status]}`}>
          {statusLabel(lead.status)}
        </span>
      </span>

      <span className={styles.name}>{lead.name}</span>
      <span className={styles.phone}>{lead.phone}</span>

      {/* Что человек написал — две строки. Больше в карточке не нужно:
          по ним заявку узнают, а читают её целиком уже в панели. */}
      {lead.message && <span className={styles.message}>{lead.message}</span>}
      {!lead.message && quiz && (
        <span className={styles.message}>{answers(lead.quiz_answers)}</span>
      )}

      <span className={styles.cardFoot}>
        <Badge>{SOURCES[lead.source] ?? lead.source}</Badge>
        {lead.note && <span className={styles.hasNote}>есть заметка</span>}
      </span>
    </button>
  );
}

/**
 * Правка заявки в панели.
 *
 * Отдельный компонент с ключом по id: поле заметки хранит своё состояние,
 * и без пересоздания при переходе к другой заявке в нём остался бы
 * предыдущий текст.
 */
function LeadEditor({
  lead,
  onPatch,
}: {
  lead: LeadRow;
  onPatch: (id: string, fields: Partial<LeadRow>) => void;
}) {
  const { save, saveNow, saved, error } = useSave();
  const [note, setNote] = useState(lead.note);

  const quiz = Object.keys(lead.quiz_answers).length > 0;

  return (
    <>
      {/*
        Сводка: всё, что только читают, собрано в одну плашку парами
        «поле — значение». Ниже — только то, что правят. Пока они шли
        вперемешку, глаз каждый раз заново решал, это справка или поле,
        в которое нужно что-то ввести.

        «Когда» и «откуда» сюда не попали: они уже стоят подзаголовком
        панели, прямо под именем. Дважды одно и то же на одном экране
        заставляет искать разницу там, где её нет.
      */}
      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt>Статус</dt>
          <dd>
            <span className={`${styles.status} ${STATUS_CLASS[lead.status]}`}>
              {statusLabel(lead.status)}
            </span>
          </dd>
        </div>

        <div className={styles.summaryRow}>
          <dt>Телефон</dt>
          <dd className={styles.strong}>{lead.phone}</dd>
        </div>

        {quiz && (
          <div className={styles.summaryRow}>
            <dt>Подбор</dt>
            <dd className={styles.strong}>{answers(lead.quiz_answers)}</dd>
          </div>
        )}

        {lead.product_slug && (
          <div className={styles.summaryRow}>
            <dt>Товар</dt>
            <dd className={styles.strong}>
              <a
                href={`/product/${lead.product_slug}`}
                target="_blank"
                rel="noreferrer"
              >
                {lead.product_slug}
              </a>
            </dd>
          </div>
        )}

        {lead.page && (
          <div className={styles.summaryRow}>
            <dt>Страница</dt>
            <dd className={styles.strong}>
              <a href={lead.page} target="_blank" rel="noreferrer">
                {shortPage(lead.page)}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {/* Позвонить — главное действие по заявке, поэтому кнопкой,
          а не мелкой ссылкой среди остальных полей. Во всю ширину панели
          она была втрое выше любого поля и читалась как баннер, а не
          как действие. */}
      <a className={styles.call} href={`tel:${lead.phone.replace(/\D/g, "")}`}>
        <Phone aria-hidden />
        Позвонить
      </a>

      {lead.message && (
        <div className={styles.comment}>
          <span className={styles.commentLabel}>Комментарий клиента</span>
          <p className={styles.fullMessage}>{lead.message}</p>
        </div>
      )}

      <Field label="Статус">
        <Select
          value={lead.status}
          onChange={(e) => {
            const status = e.target.value as LeadStatus;
            onPatch(lead.id, { status });
            saveNow(() => updateLead(lead.id, { status }));
          }}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Заметка" hint="Видна только в админке">
        <Textarea
          rows={4}
          placeholder="О чём договорились, когда перезвонить…"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            onPatch(lead.id, { note: e.target.value });
            save(() => updateLead(lead.id, { note: e.target.value }));
          }}
        />
      </Field>

      {error && <p className={styles.error}>{error.message}</p>}

      <p className={styles.savedLine}>
        <Saved show={saved} />
      </p>
    </>
  );
}

export default function LeadsPage() {
  const load = useCallback(() => listLeads(), []);
  const { rows, loading, refreshing, error, refresh, patch } =
    useRows<LeadRow>(load);
  const [filter, setFilter] = useState<LeadStatus | "">("");

  const drawer = useDrawer<string>();
  // Карточка, с которой открыли панель: туда возвращается фокус после
  // закрытия. Иначе Tab после Escape начинается с начала страницы.
  const trigger = useRef<HTMLElement | null>(null);

  const shown = useMemo(
    () => (filter ? rows.filter((r) => r.status === filter) : rows),
    [rows, filter]
  );

  // Заявку берём из списка по id, а не запоминаем строку: правка идёт через
  // patch, и сохранённая копия разошлась бы с карточкой за спиной панели.
  const editing = drawer.value
    ? (rows.find((r) => r.id === drawer.value) ?? null)
    : null;

  const fresh = rows.filter((r) => r.status === "new").length;

  return (
    <>
      <PageHead
        title="Заявки"
        text="Телеграм показывает заявку один раз. Здесь она остаётся вместе со статусом и заметкой — видно, кому перезвонили, а кому ещё нет."
      >
        {fresh > 0 && <Badge>{fresh} новых</Badge>}

        <Select
          aria-label="Фильтр по статусу"
          value={filter}
          onChange={(e) => setFilter(e.target.value as LeadStatus | "")}
        >
          <option value="">Все статусы</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        <Button variant="ghost" small busy={refreshing} onClick={refresh}>
          <RefreshCw aria-hidden />
          {refreshing ? "Обновляю…" : "Обновить"}
        </Button>
      </PageHead>

      <State
        loading={loading}
        error={error}
        empty={shown.length === 0}
        emptyText={filter ? "С этим статусом заявок нет." : "Заявок пока нет."}
      >
        <div className={styles.grid}>
          {shown.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={(l, el) => {
                trigger.current = el;
                drawer.show(l.id);
              }}
            />
          ))}
        </div>
      </State>

      {editing && (
        <Drawer
          open={drawer.open}
          onClose={drawer.hide}
          onExited={drawer.forget}
          restoreTo={trigger}
          title={editing.name}
          subtitle={`${SOURCES[editing.source] ?? editing.source} · ${when(editing.created_at)}`}
          // Ссылки на страницу здесь больше нет: она переехала в сводку,
          // к остальным фактам о заявке. Внизу осталось одно действие —
          // закрыть, — и выбирать между ним и ссылкой не приходится.
          footer={
            <Button small className={styles.done} onClick={drawer.hide}>
              Готово
            </Button>
          }
        >
          <LeadEditor key={editing.id} lead={editing} onPatch={patch} />
        </Drawer>
      )}
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Заявки — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
