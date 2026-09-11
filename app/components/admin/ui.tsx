import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Info, TriangleAlert } from "lucide-react";
import type { ApiError } from "~/lib/api";
import styles from "./ui.module.scss";

/**
 * Мелкие элементы интерфейса — в одном файле.
 *
 * Каждый здесь в десяток строк, и раскладывать их по папкам с отдельными
 * стилями значит завести двадцать файлов ради кнопки и поля. Как только
 * что-то из этого перерастёт экран — переедет к себе.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  small?: boolean;
  /**
   * Идёт работа: значок крутится, кнопка не нажимается.
   *
   * Блокировка здесь не «на всякий случай», а по делу: без неё второе
   * нажатие отправляет второй запрос, и вернуться они могут в обратном
   * порядке. Внутри `useRows` от этого есть защита по номеру запроса,
   * но лучше не создавать гонку, чем разбирать её последствия.
   */
  busy?: boolean;
};

export function Button({
  variant = "primary",
  small,
  busy,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const cn = [
    styles.button,
    variant !== "primary" && styles[variant],
    small && styles.small,
    busy && styles.busy,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // disabled вынут из rest и поставлен явно: в спреде он оказался бы
  // после нашего значения и молча его перебил.
  return (
    <button
      type="button"
      className={cn}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

/**
 * Свой класс ДОБАВЛЯЕТСЯ к оформлению поля, а не заменяет его.
 *
 * Раньше className уходил в спред последним и затирал `styles.control` —
 * поле, которому задали ширину, разом теряло рамку, отступы и фокус.
 * Ломается это молча и замечается не на том поле, которое правили.
 */
const withControl = (className?: string) =>
  className ? `${styles.control} ${className}` : styles.control;

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={withControl(className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={withControl(className)} rows={4} {...rest} />;
}

export function Select({
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={withControl(className)} {...rest} />;
}

/** Галочка с подписью и пояснением под ней. */
export function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.checkText}>
        {label}
        {hint && <span className={styles.checkHint}>{hint}</span>}
      </span>
    </label>
  );
}

/**
 * Карточка. `tone="accent"` — фиолетовая подложка вместо белой.
 *
 * Цвет здесь не украшение и не «для разнообразия»: он означает, что
 * в блоке что-то делают. Заметка, куда пишут; список того, что нужно
 * доделать. Белым остаётся справка — её читают и уходят.
 *
 * Если покрасить половину экрана, правило перестаёт работать: там, где
 * выделено всё, не выделено ничего. Поэтому фиолетовых блоков на главной
 * три, а не десять.
 */
export function Card({
  children,
  tone = "plain",
}: {
  children: ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <div className={tone === "accent" ? `${styles.card} ${styles.cardAccent}` : styles.card}>
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>;
}

/**
 * Шапка раздела: заголовок, кнопки справа, пояснение под ними.
 *
 * Была на каждой странице своя, собранная инлайновыми стилями, и заголовки
 * разъезжались по размеру и отступу — на глаз незаметно по одному, заметно
 * при переходе между разделами.
 */
export function PageHead({
  title,
  text,
  children,
}: {
  title: string;
  text?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div className={styles.headRow}>
        <h1 className={styles.headTitle}>{title}</h1>
        {children}
      </div>

      {text && <p className={styles.headText}>{text}</p>}
    </header>
  );
}

/** Заголовок части раздела. */
export function Subhead({ children }: { children: ReactNode }) {
  return <h2 className={styles.subhead}>{children}</h2>;
}

/**
 * Сообщение над списком.
 *
 * `warn` — то, что прямо сейчас влияет на сайт и требует решения:
 * неподтверждённые цены, скрытый раздел. `info` — пояснение к разделу.
 * Разница в цвете, но смысл именно в этом: жёлтым отмечено то, чем
 * заканчивают работу, а не то, что читают один раз.
 */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: ReactNode;
}) {
  const Icon = tone === "warn" ? TriangleAlert : Info;

  return (
    <p
      className={`${styles.notice} ${tone === "warn" ? styles.noticeWarn : styles.noticeInfo}`}
    >
      <Icon aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * Таблица в обёртке с горизонтальной прокруткой — ради узких экранов.
 *
 * `cards` переводит её на телефоне в карточки: строка становится блоком,
 * шапка прячется, а подписи колонок берутся из `data-label` у ячеек.
 *
 * Нужно там, где в ячейках стоят поля ввода. Пять колонок с выпадающим
 * списком и полем заметки не помещаются в телефон ни при какой ширине,
 * а горизонтальная прокрутка под ними — худший из вариантов: чтобы
 * поставить статус, пришлось бы возить таблицу вбок пальцем, которым
 * в этот момент целишься в поле.
 *
 * Таблицы, где только текст, остаются таблицами: они честно прокручиваются
 * вбок и читаются рядами, а карточки разорвали бы сравнение по колонке.
 */
export function Table({
  children,
  cards,
}: {
  children: ReactNode;
  cards?: boolean;
}) {
  return (
    // Внешняя обёртка — контейнер для запроса ширины. Медиазапрос здесь
    // не годится: он меряет окно, а таблице важна её собственная ширина,
    // и это разные вещи — слева стоит меню на шестнадцать рем. В окне
    // 1100 точек таблице достаётся 770, и по окну она считалась бы
    // «широкой», продолжая сминать колонки.
    <div className={styles.tableBox}>
      <div
        className={cards ? `${styles.tableWrap} ${styles.asCards}` : styles.tableWrap}
      >
        <table className={styles.table}>{children}</table>
      </div>
    </div>
  );
}

/**
 * Загрузка, ошибка и пустой список — три состояния, которые есть у каждого
 * раздела. Собраны здесь, чтобы страницы не начинались с одинаковых
 * пятнадцати строк проверок.
 *
 * Ошибку показываем текстом из ApiError: там уже написано, что случилось
 * и что делать, — и написано по-человечески, а не «request failed».
 */
export function State({
  loading,
  error,
  empty,
  emptyText = "Пока пусто.",
  children,
}: {
  loading: boolean;
  error: ApiError | null;
  empty: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  if (loading) return <p className={styles.state}>Загружаю…</p>;
  if (error)
    return (
      <p className={styles.error} role="alert">
        {error.message}
      </p>
    );
  if (empty) return <p className={styles.state}>{emptyText}</p>;
  return <>{children}</>;
}

/** «Сохранено» рядом с полем: подтверждение без всплывающих окон. */
export function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className={styles.saved} role="status">
      сохранено
    </span>
  );
}
