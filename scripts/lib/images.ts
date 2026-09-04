import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { decode as decodePng, init as initPng } from "@jsquash/png/decode.js";
import decodeJpeg, { init as initJpeg } from "@jsquash/jpeg/decode.js";
import decodeWebp, { init as initWebpDec } from "@jsquash/webp/decode.js";
import encodeWebp, { init as initWebp } from "@jsquash/webp/encode.js";
import encodeAvif, { init as initAvif } from "@jsquash/avif/encode.js";

/**
 * Общий пайплайн картинок для всех скриптов.
 *
 * Кодеки на WASM, а не `sharp`: на этой машине Smart App Control блокирует
 * нативные бинарники (PLAN.md §2). Медленнее, но скрипты запускаются вручную.
 */

/** Минимальный вид растра, общий для всех кодеков jSquash. */
export type RawImage = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export const WEBP_QUALITY = 82;
export const AVIF_QUALITY = 72;

let ready = false;

export async function initCodecs() {
  if (ready) return;
  const wasm = async (path: string) => WebAssembly.compile(await readFile(path));

  await initPng(await wasm("node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm"));
  await initJpeg(await wasm("node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm"));
  // Часть каталожных снимков поставщика отдаётся уже в WebP.
  await initWebpDec(await wasm("node_modules/@jsquash/webp/codec/dec/webp_dec.wasm"));
  await initAvif(await wasm("node_modules/@jsquash/avif/codec/enc/avif_enc.wasm"));

  // SIMD-сборка быстрее, но доступна не везде — при отказе берём обычную.
  for (const file of ["enc/webp_enc_simd.wasm", "enc/webp_enc.wasm"]) {
    try {
      await initWebp(await wasm(`node_modules/@jsquash/webp/codec/${file}`));
      ready = true;
      return;
    } catch {
      // пробуем следующую сборку
    }
  }
  throw new Error("не удалось инициализировать кодек WebP");
}

/**
 * Определяем формат по сигнатуре файла, а не по расширению в URL:
 * поставщик отдаёт webp по ссылкам, которые заканчиваются на .jpg.
 */
export async function decodeImage(buffer: Buffer): Promise<RawImage> {
  const ab = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

  if (buffer[0] === 0x89 && buffer[1] === 0x50) return decodePng(ab) as Promise<RawImage>;
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF")
    return decodeWebp(ab) as Promise<RawImage>;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return decodeJpeg(ab) as Promise<RawImage>;

  throw new Error(
    `неизвестный формат, сигнатура ${buffer.subarray(0, 4).toString("hex")}`
  );
}

/**
 * Уменьшение усреднением по площади. Альфа домножается на цвет перед
 * усреднением и делится обратно после: иначе прозрачные пиксели затягивают
 * в края тёмную кайму.
 */
export function downscale(image: RawImage, width: number, height: number): RawImage {
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

/**
 * Пишет avif и webp каждой ширины. Возвращает суммарный вес в байтах.
 * Файлы называются `<base>-<width>.<ext>`.
 */
export async function writeVariants(
  image: RawImage,
  { outDir, base, widths }: { outDir: string; base: string; widths: number[] }
): Promise<number> {
  await mkdir(outDir, { recursive: true });
  let total = 0;

  for (const width of widths) {
    const height = Math.round((image.height / image.width) * width);
    const scaled = width >= image.width ? image : downscale(image, width, height);

    const asImageData = scaled as unknown as ImageData;
    const avif = await encodeAvif(asImageData, { quality: AVIF_QUALITY });
    await writeFile(join(outDir, `${base}-${width}.avif`), Buffer.from(avif));

    const webp = await encodeWebp(asImageData, { quality: WEBP_QUALITY });
    await writeFile(join(outDir, `${base}-${width}.webp`), Buffer.from(webp));

    total += avif.byteLength + webp.byteLength;
  }

  return total;
}

export const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} КБ`;
