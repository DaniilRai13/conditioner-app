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

/**
 * Ширины подобраны под реальные размеры отрисовки (см. HERO_SIZES):
 * 130vw на телефоне, 70vw на планшете, половина контейнера на десктопе —
 * с запасом на экраны с удвоенной плотностью.
 */
const JOBS = [
  { src: "hero-img.png", out: "hero-unit", widths: [480, 720, 1080, 1440] },
];

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
