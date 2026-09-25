import { readFile, writeFile, mkdir } from "node:fs/promises";
import encodePng, { init as initPngEnc } from "@jsquash/png/encode.js";
import {
  initCodecs,
  decodeImage,
  downscale,
  writeVariants,
  kb,
  type RawImage,
} from "./lib/images.ts";
import { loadLogoParts } from "./lib/logo.ts";

/**
 * Веб-версии логотипа из assets/logo.png.
 *
 * Заказчик прислал растр, а не вектор, поэтому знак нарезается скриптом,
 * а не подключается файлом. Скрипт, а не разовая ручная нарезка: логотип
 * ещё могут прислать в векторе или поправить, и тогда всё пересобирается
 * одной командой, а не вспоминается по крупицам полгода спустя.
 *
 * Исходник — лист, на котором два актива стоят рядом: слева знак
 * с надписью, справа одна эмблема. Режет их `lib/logo.ts`, он же
 * отрезает набранную внутри картинки подпись: на маленьком размере
 * она превращается в серую полоску, а живой текст рядом читается всегда
 * и правится в одном месте.
 *
 * Что получается:
 *
 *   public/logo/mark-*.avif|webp    — эмблема без надписи, для шапки
 *   public/logo/full-*.avif|webp    — знак с надписью, для подвала
 *   public/apple-touch-icon.png     — плитка 180×180 для экрана айфона
 *   public/icon-192.png, icon-512.png — то же для Android и манифеста
 *   public/favicon-16|32|48.png     — значки вкладки
 *
 * Значки вкладки и плитки берутся из assets/icon.png — отдельного файла
 * с эмблемой, если заказчик его прислал. Иначе эмблема вырезается из листа.
 *
 * Запуск: npm run logo
 */

const OUT = "public/logo";

await initCodecs();
await initPngEnc(
  await WebAssembly.compile(
    await readFile("node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm")
  )
);

// Разбор листа — в общем модуле: им же пользуется make-og.ts, а две копии
// этой логики разошлись бы на первом же новом файле от заказчика.
const { mark, lockup: full } = await loadLogoParts();

/**
 * Эмблема для значков. Отдельный файл заказчика, если он есть, иначе
 * вырезанная из листа.
 *
 * Отдельный лучше: на листе эмблема соседствует со знаком, и её границы
 * приходится угадывать по прозрачности. Присланный отдельно файл — это
 * то, что нарисовал дизайнер, без посредников.
 */
const icon = await (async () => {
  try {
    const own = await decodeImage(await readFile("assets/icon.png"));
    console.log(`Иконка: assets/icon.png, ${own.width}×${own.height}`);
    return own;
  } catch {
    console.log("Иконка: отдельного файла нет, беру эмблему из листа");
    return mark;
  }
})();

console.log(`Эмблема: ${mark.width}×${mark.height}`);
console.log(`Знак с надписью: ${full.width}×${full.height}`);

/**
 * Нерезкое маскирование: усиливаем разницу с размытой копией.
 *
 * Нужно только значкам вкладки. Уменьшение усредняет по площади, и на
 * шестнадцати точках от знака остаётся мягкое пятно: край пламени
 * размазывается, петля бледнеет до фона. Лёгкая резкость возвращает им
 * границу, не давая ореолов, — 0.8 подобрано сравнением на 16 точках,
 * дальше начинает звенеть.
 */
function sharpen(img: RawImage, amount: number): RawImage {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data.length);

  const at = (x: number, y: number, c: number) =>
    data[
      (Math.min(height - 1, Math.max(0, y)) * width +
        Math.min(width - 1, Math.max(0, x))) *
        4 +
        c
    ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        let blur = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) blur += at(x + dx, y + dy, c);
        }
        out[i + c] = data[i + c] + (data[i + c] - blur / 9) * amount;
      }
    }
  }

  return { data: out, width, height };
}

// --- версии для сайта ----------------------------------------------------

// Ширины под реальные места: эмблема в шапке ~40 точек, на экране входа
// крупнее; полный знак в подвале ~180. Двойные — для плотных экранов.
const markBytes = await writeVariants(mark, {
  outDir: OUT,
  base: "mark",
  widths: [96, 192],
});

const fullBytes = await writeVariants(full, {
  outDir: OUT,
  base: "full",
  widths: [240, 480],
});

console.log(`Эмблема: ${kb(markBytes)}, полный знак: ${kb(fullBytes)}`);

// --- плитки для домашнего экрана ----------------------------------------

/**
 * Квадрат с эмблемой посередине.
 *
 * На цветной подложке, а не на прозрачной: iOS и Android подставляют
 * под прозрачный значок свой фон — обычно чёрный, — и тёмно-синяя буква
 * на нём пропадает. Углы не скругляем: обе системы накладывают маску сами,
 * а скруглённое дважды выглядит обгрызенным.
 */
async function tile(size: number, file: string): Promise<number> {
  const pad = Math.round(size * 0.14);
  const box = size - pad * 2;

  const scale = Math.min(box / icon.width, box / icon.height);
  const w = Math.max(1, Math.round(icon.width * scale));
  const h = Math.max(1, Math.round(icon.height * scale));
  const small = downscale(icon, w, h);

  const out = new Uint8ClampedArray(size * size * 4);

  // Подложка — светлый голубой из самого знака: белый сливается со светлой
  // темой, а фирменный синий спорит с синевой эмблемы.
  for (let i = 0; i < out.length; i += 4) {
    out[i] = 0xf2;
    out[i + 1] = 0xf7;
    out[i + 2] = 0xff;
    out[i + 3] = 255;
  }

  const x0 = Math.round((size - w) / 2);
  const y0 = Math.round((size - h) / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const d = ((y0 + y) * size + x0 + x) * 4;
      const a = small.data[s + 3] / 255;

      // Складываем вручную: кодек ждёт готовые пиксели, а не слои.
      out[d] = small.data[s] * a + out[d] * (1 - a);
      out[d + 1] = small.data[s + 1] * a + out[d + 1] * (1 - a);
      out[d + 2] = small.data[s + 2] * a + out[d + 2] * (1 - a);
      out[d + 3] = 255;
    }
  }

  const png = await encodePng({ data: out, width: size, height: size } as ImageData);
  await writeFile(file, Buffer.from(png));
  return png.byteLength;
}

await mkdir("public", { recursive: true });

const tiles = [
  [180, "public/apple-touch-icon.png"],
  [192, "public/icon-192.png"],
  [512, "public/icon-512.png"],
] as const;

let tileBytes = 0;
for (const [size, file] of tiles) tileBytes += await tile(size, file);

console.log(`Плитки: ${tiles.length} шт., ${kb(tileBytes)}`);

// --- значки вкладки ------------------------------------------------------

/**
 * Значок вкладки нужного размера.
 *
 * С прозрачным фоном, в отличие от плиток: браузер ставит его на свою
 * полосу вкладок, цвет которой меняется от темы, и залитый квадрат
 * выглядел бы на ней наклейкой. Эмблема яркая — оранжевое с синим
 * читается и на светлой полосе, и на тёмной.
 *
 * Размеров три, потому что браузер берёт ближайший и досматривать его
 * уменьшением не станет: 16 — обычная вкладка, 32 — плотный экран
 * и панель закладок, 48 — плитка быстрого доступа.
 */
async function favicon(size: number, file: string): Promise<number> {
  const scale = Math.min(size / icon.width, size / icon.height);
  const small = downscale(
    icon,
    Math.max(1, Math.round(icon.width * scale)),
    Math.max(1, Math.round(icon.height * scale))
  );

  const crisp = sharpen(small, 0.8);
  const png = await encodePng({
    data: crisp.data,
    width: crisp.width,
    height: crisp.height,
  } as ImageData);

  await writeFile(file, Buffer.from(png));
  return png.byteLength;
}

const favicons = [
  [16, "public/favicon-16.png"],
  [32, "public/favicon-32.png"],
  [48, "public/favicon-48.png"],
] as const;

let favBytes = 0;
for (const [size, file] of favicons) favBytes += await favicon(size, file);

console.log(`Значки вкладки: ${favicons.length} шт., ${kb(favBytes)}`);
