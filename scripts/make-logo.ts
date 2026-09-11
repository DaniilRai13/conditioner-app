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

/**
 * Веб-версии логотипа из assets/logo.png.
 *
 * Заказчик прислал растр, а не вектор, поэтому знак нарезается скриптом,
 * а не подключается файлом. Скрипт, а не разовая ручная нарезка: логотип
 * ещё могут прислать в векторе или поправить, и тогда всё пересобирается
 * одной командой, а не вспоминается по крупицам полгода спустя.
 *
 * Что получается:
 *
 *   public/logo/mark-*.avif|webp    — эмблема без надписи, для шапки
 *   public/logo/full-*.avif|webp    — весь знак с надписью, для подвала
 *   public/apple-touch-icon.png     — плитка 180×180 для экрана айфона
 *   public/icon-192.png, icon-512.png — то же для Android и манифеста
 *
 * Значок вкладки здесь не трогается: public/favicon.svg нарисован руками
 * вектором. Растр в шестнадцать точек превращается в грязь, а вектор
 * остаётся чётким и на мониторе, и на телефоне.
 *
 * Запуск: npm run logo
 */

const SOURCE = "assets/logo.png";
const OUT = "public/logo";

await initCodecs();
await initPngEnc(
  await WebAssembly.compile(
    await readFile("node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm")
  )
);

const logo = await decodeImage(await readFile(SOURCE));
console.log(`Исходник: ${logo.width}×${logo.height}`);

// --- обрезка по непрозрачному -------------------------------------------

/**
 * Границы видимого. У присланного файла по краям прозрачные поля, и без
 * обрезки они приезжают в вёрстку отступами, которых никто не задавал:
 * знак «не прилегает» к тексту, а поправить это в CSS нельзя — поля
 * внутри картинки.
 */
function trim(image: RawImage, top = 0, bottom = image.height): RawImage {
  const { data, width } = image;
  let minX = width, maxX = -1, minY = bottom, maxY = -1;

  for (let y = top; y < bottom; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    const from = ((minY + y) * width + minX) * 4;
    out.set(data.subarray(from, from + w * 4), y * w * 4);
  }

  return { data: out, width: w, height: h };
}

/**
 * Где заканчивается эмблема и начинается надпись.
 *
 * По пустой строке пикселей между ними, но искать её нужно только в тех
 * столбцах, где стоит сама эмблема. Наивный поиск «первая пустая строка
 * сверху» промахивается: у «Й» в слове «ЛАЙН» есть галочка, она
 * поднимается выше остальных букв и стоит правее эмблемы — рез уходил
 * ниже, и в вырезанный знак приезжал кусок надписи отдельной кляксой.
 * На маленькой плитке он читался как грязь на значке.
 *
 * Числом границу задавать нельзя: пришлют логотип с другими пропорциями,
 * и рез пройдёт по буквам.
 */
function emblemBottom(image: RawImage): number {
  const { data, width, height } = image;
  const opaque = (x: number, y: number) => data[(y * width + x) * 4 + 3] > 24;

  // Столбцы эмблемы: то, что занято в верхней трети. Надписи там заведомо
  // нет, поэтому лишнего в этот диапазон не попадёт.
  let left = width;
  let right = -1;
  for (let y = 0; y < Math.floor(height / 3); y++) {
    for (let x = 0; x < width; x++) {
      if (!opaque(x, y)) continue;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  if (right < 0) throw new Error("верхняя треть пустая — это не логотип");

  let seen = false;
  for (let y = 0; y < height; y++) {
    let filled = false;
    for (let x = left; x <= right && !filled; x++) filled = opaque(x, y);

    if (filled) seen = true;
    else if (seen) return y;
  }

  throw new Error("не нашёл разрыв между эмблемой и надписью");
}

const cut = emblemBottom(logo);
const mark = trim(logo, 0, cut);
const full = trim(logo);

console.log(`Эмблема: ${mark.width}×${mark.height} (рез на ${cut})`);
console.log(`Полный знак: ${full.width}×${full.height}`);

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

  const scale = Math.min(box / mark.width, box / mark.height);
  const w = Math.max(1, Math.round(mark.width * scale));
  const h = Math.max(1, Math.round(mark.height * scale));
  const small = downscale(mark, w, h);

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
console.log("Значок вкладки не трогали — public/favicon.svg рисуется руками.");
