import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CloudUpload, Loader2, TriangleAlert } from "lucide-react";
import { getBuildTime, getLastChange, publish } from "~/lib/admin-api";
import styles from "./Publish.module.scss";

/**
 * Кнопка «Опубликовать» и состояние сайта.
 *
 * Сайт — статика: правка в админке лежит в базе, но на страницах её нет,
 * пока их не пересобрали. Кнопка запускает сборку на хостинге.
 *
 * Главное здесь не кнопка, а состояние рядом с ней. Самый частый провал
 * такой схемы — не техника, а неизвестность: человек поправил цену
 * и не понимает, попало это на сайт или нет. Одни жмут десять раз, другие
 * не жмут вовсе и считают, что админка не работает. Поэтому вместо
 * «нажми и надейся» — четыре явных состояния:
 *
 *   всё опубликовано  · есть неопубликованные правки
 *   идёт сборка       · публикация не настроена
 *
 * Живёт в меню, а не на главной: публикуют после правки, а правят
 * в разделах — возвращаться за кнопкой на главную значит забыть про неё.
 */

/** Проверка «не изменилось ли» после запуска сборки. */
const POLL_MS = 15_000;
/** Дольше этого сборка либо упала, либо идёт что-то необычное. */
const POLL_LIMIT_MS = 6 * 60_000;

type State =
  | { kind: "loading" }
  | { kind: "clean"; builtAt: string | null }
  | { kind: "dirty"; changedAt: string }
  | { kind: "building" }
  | { kind: "error"; message: string };

/** «5 минут назад», «вчера». Точное время здесь не нужно — нужен порядок. */
function ago(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const min = Math.round(diff / 60_000);

  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;

  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.round(hours / 24);
  return days === 1 ? "вчера" : `${days} дн назад`;
}

export function Publish() {
  const [state, setState] = useState<State>({ kind: "loading" });

  /**
   * Жив ли компонент. Опрос идёт по таймеру и после выхода из админки
   * продолжал бы будить страницу, которой уже нет: сама по себе ошибка
   * тихая, но каждые пятнадцать секунд она дёргает базу и сеть.
   */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Сверяет время сборки со временем последней правки. */
  const check = useCallback(async () => {
    const [builtAt, change] = await Promise.all([getBuildTime(), getLastChange()]);

    if (change.error) {
      setState({ kind: "error", message: change.error.message });
      return false;
    }

    const changedAt = change.data;

    // Правок не было вовсе, или сборка новее последней из них.
    // Строки ISO сравниваются как строки — формат для этого и придуман.
    const clean = !changedAt || (builtAt !== null && builtAt >= changedAt);

    setState(clean ? { kind: "clean", builtAt } : { kind: "dirty", changedAt });
    return clean;
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  async function onPublish() {
    setState({ kind: "building" });

    const result = await publish();
    if (result.error) {
      setState({ kind: "error", message: result.error.message });
      return;
    }

    /*
     * Ждём, пока сборка доедет до сайта.
     *
     * Узнать это можно только одним способом: запрашивать отметку у живого
     * сайта, пока она не станет новее. Хостинг о завершении не сообщает,
     * а показывать «опубликовано» сразу после нажатия было бы враньём —
     * сборка идёт минуты и может не дойти.
     */
    const startedAt = Date.now();

    const tick = async () => {
      if (!alive.current) return;
      if (await check()) return;
      if (!alive.current) return;

      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        setState({
          kind: "error",
          message:
            "Сборка запущена, но сайт за шесть минут не обновился. " +
            "Посмотрите журнал сборок у хостинга.",
        });
        return;
      }

      setState({ kind: "building" });
      setTimeout(() => void tick(), POLL_MS);
    };

    setTimeout(() => void tick(), POLL_MS);
  }

  if (state.kind === "loading") return null;

  const busy = state.kind === "building";

  return (
    <div className={styles.box}>
      {state.kind === "dirty" && (
        <>
          <span className={styles.line}>
            <TriangleAlert aria-hidden />
            Есть неопубликованные правки
          </span>
          <span className={styles.note}>изменено {ago(state.changedAt)}</span>
        </>
      )}

      {state.kind === "clean" && (
        <span className={`${styles.line} ${styles.ok}`}>
          <Check aria-hidden />
          {state.builtAt ? `Опубликовано ${ago(state.builtAt)}` : "Сайт опубликован"}
        </span>
      )}

      {busy && (
        <>
          <span className={styles.line}>
            <Loader2 className={styles.spin} aria-hidden />
            Собираю сайт
          </span>
          <span className={styles.note}>обычно 1–3 минуты</span>
        </>
      )}

      {state.kind === "error" && (
        <span className={`${styles.line} ${styles.bad}`}>
          <TriangleAlert aria-hidden />
          {state.message}
        </span>
      )}

      {/* Кнопка есть всегда, кроме времени сборки: даже когда правок нет,
          пересобрать бывает нужно — например, после правки в коде. */}
      {!busy && (
        <button type="button" className={styles.button} onClick={() => void onPublish()}>
          <CloudUpload aria-hidden />
          Опубликовать
        </button>
      )}
    </div>
  );
}
