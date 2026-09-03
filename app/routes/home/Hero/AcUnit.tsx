import styles from "./AcUnit.module.scss";

/**
 * Векторная иллюстрация сплит-системы для hero.
 *
 * Не фотография: рендера из макета у нас нет, а каталожные снимки поставщика
 * плоские и без света. Объём набран слоями градиентов — вертикальный для
 * выпуклости корпуса, горизонтальный для затемнения торцов, отдельный для
 * утопленной решётки. Микрошум поверх убирает «пластик», характерный
 * для чистого вектора.
 *
 * Свет условно сверху-справа: блик по верхней кромке, тень уходит влево-вниз.
 * Если появится настоящий рендер — компонент заменяется целиком.
 */
export function AcUnit() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 640 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Настенная сплит-система с потоком холодного воздуха"
    >
      <defs>
        {/* Выпуклость корпуса: свет по верхней трети, затемнение к низу */}
        <linearGradient id="ac-form" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.16" stopColor="#ffffff" />
          <stop offset="0.52" stopColor="#f5f8fc" />
          <stop offset="0.82" stopColor="#e6ecf6" />
          <stop offset="1" stopColor="#d8e0ee" />
        </linearGradient>

        {/* Цилиндрический завал по торцам */}
        <linearGradient id="ac-edges" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#94a3b8" stopOpacity="0.28" />
          <stop offset="0.08" stopColor="#94a3b8" stopOpacity="0" />
          <stop offset="0.9" stopColor="#94a3b8" stopOpacity="0" />
          <stop offset="1" stopColor="#94a3b8" stopOpacity="0.2" />
        </linearGradient>

        {/* Утопленная камера выхода воздуха */}
        <linearGradient id="ac-cavity" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f3a4d" />
          <stop offset="0.45" stopColor="#46536b" />
          <stop offset="1" stopColor="#6b7a93" />
        </linearGradient>

        <linearGradient id="ac-blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eef2f8" />
          <stop offset="1" stopColor="#c4cfe1" />
        </linearGradient>

        <linearGradient id="ac-flow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b5bfe" stopOpacity="0.38" />
          <stop offset="0.5" stopColor="#3b5bfe" stopOpacity="0.13" />
          <stop offset="1" stopColor="#3b5bfe" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="ac-wall" cx="0.62" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaeff8" />
        </radialGradient>

        {/* Контактная тень на стене */}
        <filter id="ac-cast" x="-25%" y="-40%" width="150%" height="220%">
          <feDropShadow
            dx="-6"
            dy="26"
            stdDeviation="22"
            floodColor="#1e293b"
            floodOpacity="0.16"
          />
        </filter>

        <filter id="ac-soft">
          <feGaussianBlur stdDeviation="7" />
        </filter>

        <filter id="ac-gloss">
          <feGaussianBlur stdDeviation="9" />
        </filter>

        {/* Микрошум: убирает пластиковую гладкость градиентов */}
        <filter id="ac-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        <clipPath id="ac-clip">
          <rect x="70" y="94" width="500" height="160" rx="30" />
        </clipPath>
      </defs>

      {/* Стена */}
      <rect x="0" y="0" width="640" height="480" fill="url(#ac-wall)" />
      <g stroke="#dfe6f2" strokeWidth="1.25" opacity="0.6">
        <path d="M188 0V480" />
        <path d="M436 0V480" />
        <path d="M0 316H640" />
      </g>

      {/* Поток воздуха */}
      <g filter="url(#ac-soft)">
        <path d="M132 250C132 250 112 344 92 462H182C194 352 202 280 202 250Z" fill="url(#ac-flow)" />
        <path d="M222 250C222 250 214 352 210 462H312C302 354 292 280 288 250Z" fill="url(#ac-flow)" />
        <path d="M312 250C312 250 328 344 348 462H436C412 356 388 280 378 250Z" fill="url(#ac-flow)" />
        <path d="M400 250C400 250 432 336 470 452H540C500 352 458 278 446 250Z" fill="url(#ac-flow)" />
      </g>
      {/* Тонкие линии потока — читаются как струи */}
      <g stroke="#3b5bfe" strokeOpacity="0.16" strokeWidth="1.5" strokeLinecap="round">
        <path d="M168 262C160 320 150 384 138 440" />
        <path d="M258 262C256 322 254 386 250 440" />
        <path d="M348 262C356 320 368 384 382 440" />
        <path d="M424 262C440 316 460 376 482 430" />
      </g>

      {/* Корпус */}
      <g filter="url(#ac-cast)">
        <rect x="70" y="94" width="500" height="160" rx="30" fill="url(#ac-form)" />
      </g>

      <g clipPath="url(#ac-clip)">
        {/* Затемнение торцов */}
        <rect x="70" y="94" width="500" height="160" fill="url(#ac-edges)" />

        {/* Блик по верхней кромке */}
        <path
          d="M96 104H548C548 104 520 128 320 128C120 128 96 104 96 104Z"
          fill="#ffffff"
          opacity="0.85"
          filter="url(#ac-gloss)"
        />
        <path d="M104 101H540" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* Шов между верхней панелью и передней */}
        <path d="M78 168H562" stroke="#c9d4e6" strokeOpacity="0.55" strokeWidth="1.25" />

        {/* Камера выхода воздуха */}
        <path
          d="M70 196H570V224C570 240 556 254 540 254H100C84 254 70 240 70 224Z"
          fill="url(#ac-cavity)"
        />
        {/* Тень от верхней кромки внутрь камеры */}
        <rect x="70" y="196" width="500" height="12" fill="#0f172a" opacity="0.35" />

        {/* Жалюзи */}
        <rect x="86" y="206" width="468" height="17" rx="8.5" fill="url(#ac-blade)" />
        <rect x="86" y="206" width="468" height="4" rx="2" fill="#ffffff" opacity="0.9" />
        <rect x="94" y="232" width="452" height="13" rx="6.5" fill="url(#ac-blade)" opacity="0.75" />

        {/* Шум */}
        <rect
          x="70"
          y="94"
          width="500"
          height="160"
          filter="url(#ac-noise)"
          opacity="0.08"
          style={{ mixBlendMode: "overlay" }}
        />
      </g>

      {/* Дисплей */}
      <rect x="386" y="134" width="104" height="46" rx="13" fill="#e9eef7" />
      <rect x="386" y="134" width="104" height="46" rx="13" fill="#0f172a" opacity="0.05" />
      <rect x="389" y="137" width="98" height="20" rx="10" fill="#ffffff" opacity="0.65" />
      <text
        x="438"
        y="164"
        textAnchor="middle"
        fontFamily="inherit"
        fontSize="23"
        fontWeight="700"
        fill="#3b5bfe"
      >
        24°C
      </text>

      {/* Индикатор питания со свечением */}
      <circle cx="522" cy="157" r="9" fill="#3b5bfe" opacity="0.18" filter="url(#ac-soft)" />
      <circle cx="522" cy="157" r="4.5" fill="#3b5bfe" opacity="0.7" />
    </svg>
  );
}
