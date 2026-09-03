import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { decode as decodePng, init as initPng } from "@jsquash/png/decode.js";
import encodeWebp, { init as initWebp } from "@jsquash/webp/encode.js";
import encodeAvif, { init as initAvif } from "@jsquash/avif/encode.js";

/**
 * PNG → AVIF + WebP в нескольких размерах, для srcset.
 *
 * Кодеки на WASM, а не `sharp`: на этой машине Smart App Control блокирует
 * нативные бинарники, включая sharp (PLAN.md §2). WASM медленнее, но скрипт
 * запускается вручную и раз в жизнь картинки.
 *
 * Уменьшение — свой боксфильтр вместо @jsquash/resize: для даунскейла
 * усреднение по площади даёт качество не хуже, а зависимость и возню
 * с инициализацией ещё одного wasm убирает.
 *
 * Запуск: npm run images
 */

const ASSETS = "app/assets";

/**
 * Ширины подобраны под реальные размеры отрисовки (см. sizes в Hero):
 * 130vw на телефоне, 70vw на планшете, 48vw на десктопе — с запасом
 * на экраны с удвоенной плотностью.
 */
const JOBS = [
  { src: "hero-img.png", out: "hero-unit", widths: [480, 720, 1080, 1440] },
];

const WEBP_QUALITY = 82;
// Шкала 0-100, как у WebP. Для hero берём выше среднего: это LCP-элемент,
// и артефакты на градиенте потока будут заметны.
const AVIF_QUALITY = 72;

/**
 * Уменьшение усреднением по площади. Альфа домножается на цвет перед
 * усреднением и делится обратно после: иначе прозрачные пиксели затягивают
 * в края тёмную кайму.
 */
function downscale(image, width, height) {
  const { data: src, width: sw, height: sh } = image;
  const out = new Uint8ClampedArray(width * height * 4);
  const xRatio = sw / width;
  const yRatio = sh / height;

  for (let y = 0; y < height; y++) {
    const y0 = Math.floor(y * yRatio);
    const y1 = Math.min(sh, Math.ceil((y + 1) * yRatio));

    for (let x = 0; x < width; x++) {
      const x0 = Math.floor(x * xRatio);
      const x1 = Math.min(sw, Math.ceil((x + 1) * xRatio));

      let r = 0, g = 0, b = 0, a = 0, n = 0;

      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * sw + sx) * 4;
          const alpha = src[i + 3] / 255;
          r += src[i] * alpha;
          g += src[i + 1] * alpha;
          b += src[i + 2] * alpha;
          a += src[i + 3];
          n++;
        }
      }

      const o = (y * width + x) * 4;
      const meanAlpha = a / n / 255;
      out[o] = meanAlpha > 0 ? r / n / meanAlpha : 0;
      out[o + 1] = meanAlpha > 0 ? g / n / meanAlpha : 0;
      out[o + 2] = meanAlpha > 0 ? b / n / meanAlpha : 0;
      out[o + 3] = a / n;
    }
  }

  return { data: out, width, height };
}

async function initCodecs() {
  const wasm = async (path) => WebAssembly.compile(await readFile(path));

  await initPng(await wasm("node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm"));
  await initAvif(await wasm("node_modules/@jsquash/avif/codec/enc/avif_enc.wasm"));

  // SIMD-сборка быстрее, но доступна не везде — при отказе берём обычную.
  for (const file of ["enc/webp_enc_simd.wasm", "enc/webp_enc.wasm"]) {
    try {
      await initWebp(await wasm(`node_modules/@jsquash/webp/codec/${file}`));
      return;
    } catch {
      // пробуем следующую сборку
    }
  }
  throw new Error("не удалось инициализировать кодек WebP");
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} КБ`;

async function run() {
  await initCodecs();

  for (const job of JOBS) {
    const file = await readFile(join(ASSETS, job.src));
    const image = await decodePng(
      file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
    );
    console.log(`${job.src}: ${image.width}×${image.height}, ${kb(file.length)}\n`);

    for (const width of job.widths) {
      const height = Math.round((image.height / image.width) * width);
      const scaled =
        width >= image.width ? image : downscale(image, width, height);

      const avif = await encodeAvif(scaled, { quality: AVIF_QUALITY });
      await writeFile(join(ASSETS, `${job.out}-${width}.avif`), Buffer.from(avif));

      const webp = await encodeWebp(scaled, { quality: WEBP_QUALITY });
      await writeFile(join(ASSETS, `${job.out}-${width}.webp`), Buffer.from(webp));

      const win = Math.round((1 - avif.byteLength / webp.byteLength) * 100);
      console.log(
        `  ${width}×${height}  avif ${kb(avif.byteLength)}  webp ${kb(webp.byteLength)}  (avif легче на ${win}%)`
      );
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
