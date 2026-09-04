/**
 * Пересобирает варианты каталога из мастер-файлов.
 *
 * Мастер — это `public/catalog/<slug>.webp`, один файл на товар в полном
 * размере. Его правят руками; всё остальное машинное. Скрипт читает мастера,
 * на которые ссылается products.json, и кладёт рядом avif и webp в двух
 * ширинах — то, что реально отдаётся посетителю.
 *
 * Мастера не трогает: их можно править и пересобирать сколько угодно раз.
 */
import { readFile } from "node:fs/promises";
import { initCodecs, decodeImage, writeVariants, kb } from "./lib/images.ts";

const IMAGE_DIR = "public/catalog";
const IMAGE_WIDTHS = [400, 800];

type Product = { image: string | null };

const products: Product[] = JSON.parse(
  await readFile("app/data/products.json", "utf8")
);

// Один мастер может обслуживать несколько товаров одной серии — гоняем
// кодек по уникальным файлам, а не по товарам.
const masters = [...new Set(products.map((p) => p.image).filter(Boolean))];

await initCodecs();
console.log(`Мастеров: ${masters.length}\n`);

let total = 0;
for (const path of masters as string[]) {
  // Расширение мастера не фиксируем: снимок мог быть пересохранён в редакторе
  // как jpeg или png, и подстраиваться под скрипт незачем — формат
  // распознаётся по сигнатуре файла, а не по имени.
  const file = path.replace("/catalog/", "");
  const base = file.replace(/\.[a-z]+$/i, "");
  const image = await decodeImage(await readFile(`${IMAGE_DIR}/${file}`));
  const bytes = await writeVariants(image, {
    outDir: IMAGE_DIR,
    base,
    widths: IMAGE_WIDTHS,
  });
  total += bytes;
  console.log(`  ${base} — ${kb(bytes)}`);
}

console.log(`\nГотово: ${masters.length} × ${IMAGE_WIDTHS.length * 2} файлов, ${kb(total)}`);
console.log("Дальше: вернуть <picture> в ProductCard и product.tsx.");
