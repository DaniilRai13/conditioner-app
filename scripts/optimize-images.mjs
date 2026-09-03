import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { decode as decodePng, init as initPng } from "@jsquash/png/decode.js";
import encodeWebp, { init as initWebp } from "@jsquash/webp/encode.js";

/**
 * PNG → WebP в нескольких размерах, для srcset.
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
const QUALITY = 82;

/** Исходник → нужные ширины. Высота считается по пропорции. */
const JOBS = [{ src: "hero-img.png", out: "hero-unit", widths: [1440, 720] }];

/**
 * Уменьшение усреднением по площади. Альфа домножается на цвет перед
 * усреднением и делится обратно после: иначе прозрачные пиксели затягивают
 * в края чёрную кайму.
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
  const pngWasm = await readFile(
    "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm"
  );
  await initPng(await WebAssembly.compile(pngWasm));

  // SIMD-сборка быстрее, но доступна не везде — при отказе берём обычную.
  for (const file of ["enc/webp_enc_simd.wasm", "enc/webp_enc.wasm"]) {
    try {
      const wasm = await readFile(`node_modules/@jsquash/webp/codec/${file}`);
      await initWebp(await WebAssembly.compile(wasm));
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
    console.log(`${job.src}: ${image.width}×${image.height}, ${kb(file.length)}`);

    for (const width of job.widths) {
      const height = Math.round((image.height / image.width) * width);
      const scaled =
        width >= image.width ? image : downscale(image, width, height);

      const encoded = await encodeWebp(scaled, { quality: QUALITY });
      const name = `${job.out}-${width}.webp`;
      await writeFile(join(ASSETS, name), Buffer.from(encoded));

      const saved = Math.round((1 - encoded.byteLength / file.length) * 100);
      console.log(
        `  → ${name}  ${width}×${height}  ${kb(encoded.byteLength)}  (−${saved}%)`
      );
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
