import type { CatalogProduct } from "./queries";

/**
 * Логика подбора. Чистая функция без React и без обращений к сети —
 * её можно прогнать отдельно от вёрстки (`npm run check:quiz`).
 *
 * Главное правило: пустую выдачу не показываем никогда (PLAN.md §5.1).
 * Если под комбинацию ответов ничего не нашлось, возвращаем пустой список
 * и явный признак — интерфейс покажет «подберу индивидуально», а не пустоту.
 */

export type QuizAnswers = {
  area?: string;
  place?: string;
  heat?: string;
  windows?: string;
};

export type QuizOption = {
  value: string;
  label: string;
  hint?: string;
};

export type QuizQuestion = {
  key: keyof QuizAnswers;
  title: string;
  options: QuizOption[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "area",
    title: "Какая площадь помещения?",
    options: [
      { value: "20", label: "До 20 м²", hint: "спальня, кабинет" },
      { value: "35", label: "20–35 м²", hint: "гостиная" },
      { value: "50", label: "35–50 м²", hint: "студия, большая комната" },
      { value: "70", label: "50–70 м²", hint: "офис, помещение" },
    ],
  },
  {
    key: "place",
    title: "Что охлаждаем?",
    options: [
      { value: "flat", label: "Квартиру" },
      { value: "house", label: "Частный дом" },
      { value: "office", label: "Офис" },
      { value: "other", label: "Другое", hint: "подскажу по звонку" },
    ],
  },
  {
    key: "heat",
    title: "Нужно ли греться зимой?",
    options: [
      { value: "yes", label: "Да", hint: "вместо обогревателя" },
      { value: "no", label: "Нет", hint: "только охлаждение" },
      { value: "unknown", label: "Не знаю", hint: "посоветуйте сами" },
    ],
  },
  {
    key: "windows",
    title: "Сколько окон в комнате?",
    options: [
      { value: "1", label: "Одно" },
      { value: "2", label: "Два" },
      { value: "3", label: "Три и больше", hint: "или панорамное остекление" },
    ],
  },
];

export type QuizPick = {
  tier: "budget" | "optimum" | "premium";
  label: string;
  product: CatalogProduct;
};

export type QuizResult = {
  /** Площадь с поправкой на окна — по ней и подбираем. */
  effectiveArea: number;
  /** Требуется ли инвертор: он один держит обогрев в мороз. */
  needsInverter: boolean;
  picks: QuizPick[];
  /** Одно предложение под заголовком результата. */
  reason: string;
};

const TIER_LABELS = {
  budget: "Бюджетный",
  optimum: "Оптимальный",
  premium: "Премиум",
} as const;

export function isComplete(answers: QuizAnswers): boolean {
  return QUIZ_QUESTIONS.every((q) => Boolean(answers[q.key]));
}

/**
 * Поправка на теплопритоки. Каждое окно сверх первого добавляет примерно
 * 10% нагрузки, офис — ещё 15% за счёт техники и людей. Цифры грубые,
 * но именно так считают на глаз перед замером.
 */
function correctedArea(answers: QuizAnswers): number {
  const base = Number(answers.area) || 20;
  const windows = Number(answers.windows) || 1;

  let factor = 1 + 0.1 * Math.max(0, windows - 1);
  if (answers.place === "office") factor += 0.15;

  return Math.round(base * factor);
}

function buildReason(area: number, needsInverter: boolean, count: number): string {
  if (count === 0) {
    return `Под ${area} м² в наличии сейчас ничего подходящего нет — подберу под заказ.`;
  }
  const heat = needsInverter
    ? " Все с инвертором: только он держит обогрев в мороз."
    : "";
  return `С учётом окон считаю по ${area} м².${heat}`;
}

export function solveQuiz(
  answers: QuizAnswers,
  products: CatalogProduct[]
): QuizResult {
  const effectiveArea = correctedArea(answers);
  const needsInverter = answers.heat === "yes";

  // Верхняя граница та же, что у решений: блок вдвое мощнее нужного —
  // это переплата и работа на минимальной нагрузке.
  let fits = products.filter((p) => {
    const area = p.specs.areaM2;
    if (!area) return false;
    if (area < effectiveArea || area > effectiveArea * 1.35) return false;
    if (needsInverter && !p.specs.isInverter) return false;
    return true;
  });

  // Если инверторных под эту площадь нет, лучше показать обычные
  // с оговоркой, чем пустой экран.
  if (fits.length === 0 && needsInverter) {
    fits = products.filter((p) => {
      const area = p.specs.areaM2;
      return Boolean(area && area >= effectiveArea && area <= effectiveArea * 1.35);
    });
  }

  fits = [...fits].sort((a, b) => a.price - b.price);

  const indexes =
    fits.length === 0
      ? []
      : fits.length === 1
        ? [0]
        : fits.length === 2
          ? [0, 1]
          : [0, Math.floor(fits.length / 2), fits.length - 1];

  const tiers = ["budget", "optimum", "premium"] as const;

  return {
    effectiveArea,
    needsInverter,
    picks: indexes.map((index, i) => ({
      tier: tiers[i],
      label: TIER_LABELS[tiers[i]],
      product: fits[index],
    })),
    reason: buildReason(effectiveArea, needsInverter, indexes.length),
  };
}
