import { useState } from "react";
import styles from "./RangeFilter.module.scss";

type Props = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;

  /**
   * Значение, при котором фильтр выключен — у площади это минимум шкалы.
   * При нём подпись показывает «любая», а из адреса параметр убирается.
   */
  neutral: number;
  /** Единица измерения рядом с полем ввода. */
  unit: string;
  /** Вызывается на отпускании, а не на каждом пикселе перетаскивания. */
  onCommit: (value: number) => void;
};

/**
 * Ползунок с числовым полем. Тащить удобно, когда пристреливаешься;
 * вписать точно — когда цифра уже известна. Оба управляют одним значением.
 *
 * Ползунок нативный, а не свой: он даром отдаёт стрелки, Home/End,
 * PageUp/PageDown и объявление значения скринридером. Свой компонент —
 * это всё то же самое, написанное заново и хуже.
 *
 * Значение живёт в двух местах, и это осознанно. Черновик обновляется
 * непрерывно, чтобы бегунок шёл за пальцем; наружу значение уходит только
 * на отпускании. Иначе каждый пиксель перетаскивания писался бы в адресную
 * строку и пересобирал выдачу.
 */
export function RangeFilter({
  id,
  label,
  min,
  max,
  step,
  value,
  neutral,
  unit,
  onCommit,
}: Props) {
  const [draft, setDraft] = useState(value);

  // Значение могло измениться снаружи — кнопкой «сбросить» или переходом
  // назад в браузере. Правка состояния в рендере вместо эффекта:
  // без лишнего кадра со старым положением бегунка.
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }

  const commit = (v = draft) => {
    const clamped = Math.min(max, Math.max(min, v));
    if (clamped !== draft) setDraft(clamped);
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>

        <div className={styles.entry}>
          <input
            className={styles.number}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={draft}
            aria-label={`${label}, точное значение`}
            onChange={(e) => setDraft(Number(e.target.value))}
            onBlur={(e) => commit(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
          <span className={styles.unit}>{unit}</span>
        </div>
      </div>

      <input
        id={id}
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        // В React onChange у range срабатывает на каждое движение — это
        // событие input, а не change. Поэтому им ведём только черновик.
        onChange={(e) => setDraft(Number(e.target.value))}
        // Фиксация: мышь и палец отпускают указатель, клавиатура отпускает
        // клавишу, а blur страхует случай, когда до отпускания не дошло.
        onPointerUp={() => commit()}
        onKeyUp={() => commit()}
        onBlur={() => commit()}
      />

      <div className={styles.marks} aria-hidden>
        <span>
          {min} {unit}
        </span>
        <span className={draft === neutral ? styles.off : undefined}>
          {draft === neutral ? "фильтр выключен" : ""}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
