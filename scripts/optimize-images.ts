import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { initCodecs, decodeImage, writeVariants, kb } from "./lib/images.ts";

/**
 * Картинки страниц → AVIF + WebP в нескольких размерах, для srcset.
 *
 * Каталог обрабатывает `import-catalog.ts`: он берёт тот же пайплайн
 * из `lib/images.mjs`, чтобы настройки качества не разъезжались.
 *
 * Запуск: npm run images
 */

const ASSETS = "app/assets";

type Job = {
  /** Имя файла-мастера в app/assets. */
  src: string;
  /** Общее начало имён вариантов: out-480.avif, out-480.webp и так далее. */
  out: string;
  /** Ширины под реальные размеры отрисовки, с запасом на плотные экраны. */
  widths: number[];
};

/**
 * Список пуст: стоковую фотографию кондиционера с сайта убрали, её место
 * занял AcUnit — рисунок фигурами, который не нужно ни сжимать, ни хранить
 * в четырёх размерах.
 *
 * Скрипт оставлен под фотографии, которых ждём от заказчика: снимок мастера
 * на странице «Обо мне» и фото работ. Добавьте мастер-файл в app/assets,
 * впишите его сюда — и получите набор avif и webp по ширинам.
 */
const JOBS: Job[] = [];

async function run() {
  await initCodecs();

  for (const job of JOBS) {
    const file = await readFile(join(ASSETS, job.src));
    const image = await decodeImage(file);
    console.log(`${job.src}: ${image.width}×${image.height}, ${kb(file.length)}`);

    const total = await writeVariants(image, {
      outDir: ASSETS,
      base: job.out,
      widths: job.widths,
    });

    console.log(`  → ${job.widths.length * 2} файлов, суммарно ${kb(total)}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
