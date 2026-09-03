import styles from "./AcUnit.module.scss";

/**
 * Векторная иллюстрация сплит-системы для hero.
 *
 * Не фотография: заказчик не передал рендер из макета, а каталожные снимки
 * поставщика плоские и без перспективы. SVG весит пару килобайт вместо
 * двухсот, не мылится на ретине и не требует лицензии.
 *
 * Важно: фон здесь НЕ заливается. Сплошной прямоугольник стены вырезает
 * в секции жёсткий короб и рвёт градиент страницы — вместо него только
 * тонкие линии панелей, чтобы блок не висел в пустоте.
 *
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
        <linearGradient id="ac-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.62" stopColor="#f7f9fc" />
          <stop offset="1" stopColor="#e8edf6" />
        </linearGradient>

        <linearGradient id="ac-top" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2f8" />
        </linearGradient>

        <linearGradient id="ac-slot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d4e6" />
          <stop offset="1" stopColor="#8f9fba" />
        </linearGradient>

        <linearGradient id="ac-flow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b5bfe" stopOpacity="0.34" />
          <stop offset="0.55" stopColor="#3b5bfe" stopOpacity="0.12" />
          <stop offset="1" stopColor="#3b5bfe" stopOpacity="0" />
        </linearGradient>

        <filter id="ac-shadow" x="-30%" y="-30%" width="160%" height="200%">
          <feDropShadow
            dx="0"
            dy="22"
            stdDeviation="20"
            floodColor="#0f172a"
            floodOpacity="0.13"
          />
        </filter>

        <filter id="ac-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Стена: едва различимые панели, чтобы блок не висел в пустоте */}
      <g stroke="#e6eaf5" strokeWidth="1.5" opacity="0.75">
        <path d="M96 40V440" />
        <path d="M304 40V440" />
        <path d="M512 40V440" />
        <path d="M40 190H600" />
        <path d="M40 330H600" />
      </g>

      {/* Поток воздуха — расходящиеся струи из-под жалюзи */}
      <g filter="url(#ac-blur)">
        <path
          d="M150 236C150 236 128 330 108 452H196C206 344 214 268 214 236Z"
          fill="url(#ac-flow)"
        />
        <path
          d="M232 236C232 236 226 340 222 452H320C310 342 300 268 296 236Z"
          fill="url(#ac-flow)"
        />
        <path
          d="M314 236C314 236 330 330 350 452H436C412 344 388 268 378 236Z"
          fill="url(#ac-flow)"
        />
        <path
          d="M396 236C396 236 428 322 466 440H532C492 340 452 266 440 236Z"
          fill="url(#ac-flow)"
        />
      </g>

      {/* Корпус внутреннего блока */}
      <g filter="url(#ac-shadow)">
        <path
          d="M104 108C104 96.95 112.95 88 124 88H516C527.05 88 536 96.95 536 108V196C536 214 524 228 506 232L134 232C116 228 104 214 104 196Z"
          fill="url(#ac-body)"
        />
        {/* Верхняя грань — намёк на объём */}
        <path
          d="M124 88H516C527.05 88 536 96.95 536 108V118H104V108C104 96.95 112.95 88 124 88Z"
          fill="url(#ac-top)"
        />
        {/* Щель выхода воздуха с жалюзи */}
        <path
          d="M132 196H508C508 214 496 228 478 231H162C144 228 132 214 132 196Z"
          fill="url(#ac-slot)"
        />
        <path
          d="M150 210H490"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Дисплей */}
      <rect x="356" y="140" width="86" height="38" rx="10" fill="#eef2f8" />
      <text
        x="399"
        y="166"
        textAnchor="middle"
        fontFamily="inherit"
        fontSize="21"
        fontWeight="700"
        fill="#3b5bfe"
      >
        24°C
      </text>

      {/* Индикатор питания */}
      <circle cx="474" cy="159" r="5" fill="#3b5bfe" opacity="0.5" />
    </svg>
  );
}
