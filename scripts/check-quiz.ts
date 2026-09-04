import { readFile } from "node:fs/promises";
import { QUIZ_QUESTIONS, solveQuiz, type QuizAnswers } from "../app/lib/quiz.ts";
import type { Product } from "../app/types/product.ts";
import type { CatalogProduct } from "../app/lib/queries.ts";

/**
 * Прогон подбора по всем комбинациям ответов.
 *
 * Тестового рантайма в проекте пока нет, а проверять логику надо: главный
 * риск квиза — комбинация, на которой выдача пуста и человек упирается
 * в тупик. Функция чистая, поэтому хватает обычного скрипта.
 *
 * Запуск: npm run check:quiz
 */

const raw = JSON.parse(await readFile("app/data/products.json", "utf8")) as Product[];

const products: CatalogProduct[] = raw
  .filter((p) => p.isPublished)
  .map((p) => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    model: p.model,
    type: p.type,
    price: p.price,
    inStock: p.inStock,
    image: p.image,
    tier: p.tier,
    featured: p.featured,
    specs: {
      areaM2: p.specs.areaM2,
      coolingKw: p.specs.coolingKw,
      isInverter: p.specs.isInverter,
      hasWifi: p.specs.hasWifi,
      noiseDb: p.specs.noiseDb,
    },
  }));

const combos: QuizAnswers[] = [];
for (const area of QUIZ_QUESTIONS[0].options) {
  for (const place of QUIZ_QUESTIONS[1].options) {
    for (const heat of QUIZ_QUESTIONS[2].options) {
      for (const windows of QUIZ_QUESTIONS[3].options) {
        combos.push({
          area: area.value,
          place: place.value,
          heat: heat.value,
          windows: windows.value,
        });
      }
    }
  }
}

let empty = 0;
const emptyExamples: string[] = [];
const areaCoverage = new Map<number, number>();

for (const answers of combos) {
  const result = solveQuiz(answers, products);
  areaCoverage.set(
    result.effectiveArea,
    (areaCoverage.get(result.effectiveArea) ?? 0) + 1
  );

  if (result.picks.length === 0) {
    empty++;
    if (emptyExamples.length < 6) {
      emptyExamples.push(
        `${answers.area} м², ${answers.place}, обогрев ${answers.heat}, окон ${answers.windows} → ${result.effectiveArea} м²`
      );
    }
  }
}

console.log(`Комбинаций: ${combos.length}`);
console.log(`Пустых выдач: ${empty} (${Math.round((empty / combos.length) * 100)}%)`);

console.log("\nРасчётные площади и сколько комбинаций в них попадает:");
[...areaCoverage.entries()]
  .sort((a, b) => a[0] - b[0])
  .forEach(([area, n]) => {
    const picks = solveQuiz({ area: String(area), windows: "1" }, products).picks;
    console.log(`  ${String(area).padStart(3)} м² — ${String(n).padStart(2)} комбинаций, моделей ${picks.length}`);
  });

if (emptyExamples.length) {
  console.log("\nГде выдача пуста:");
  emptyExamples.forEach((e) => console.log("  " + e));
}

// Пустая выдача сама по себе не ошибка — интерфейс покажет фолбэк.
// Но если её больше трети, значит границы подбора заданы неверно.
if (empty / combos.length > 0.33) {
  console.error("\nСлишком много пустых выдач — проверьте границы подбора");
  process.exit(1);
}
