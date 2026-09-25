import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { basename } from "node:path";
import encodePng, { init as initPngEncode } from "@jsquash/png/encode.js";
import encodeJpeg, { init as initJpegEncode } from "@jsquash/jpeg/encode.js";
import { loadLogoParts } from "./lib/logo.ts";
import {
  decodeImage,
  downscale,
  initCodecs,
  kb,
  type RawImage,
} from "./lib/images.ts";
import type { Product } from "../app/types/product.ts";

/**
 * Картинки ссылок для мессенджеров и соцсетей.
 *
 * Их объявляет каждая страница сайта (`app/lib/seo.ts`). Без них ссылка,
 * отправленная в вайбер или телеграм, приходит голым адресом без превью —
 * а для мастера, к которому пишут в мессенджер, это основной канал.
 *
 * Собирается два вида:
 *
 *   public/og/default.png          — знак на фирменном фоне, для всего сайта
 *   public/og/product/<имя>.jpg    — то же плюс снимок модели, для карточек
 *
 * Товарных карточек 33, а не 50: производитель снимает одну фотографию
 * на серию, импорт дедуплицирует снимки по содержимому, и модели с общим
 * снимком делят одну картинку ссылки.
 *
 * Текста ни на одной нет намеренно. Заголовок и описание мессенджер
 * показывает сам, рядом с изображением, — дублировать их значит спорить
 * с собственным сниппетом. Дело картинки — чтобы узнали отправителя
 * и увидели, о чём речь.
 *
 * Рисуется по точкам, без браузера: в проекте нет ничего, что разложит
 * вёрстку в растр, а тянуть ради картинок headless-браузер значит добавить
 * в сборку двести мегабайт. Композиция взята со страниц сайта: тёмный блок
 * сверху, из-под него дугой выныривает светлое полотно.
 *
 * Запуск: npm run og
 */

const W = 1200;
const H = 630;

// Токены из app/styles/_tokens.scss. Здесь числами, потому что рисуем
// по точкам, а не стилями, — но значения обязаны совпадать с сайтом.
const DEEP_900 = [0x26, 0x2c, 0x47];
const SURFACE_ACCENT = [0x49, 0x52, 0x7e];
const SURFACE = [0xff, 0xff, 0xff];
const BRAND_50 = [0xee, 0xf2, 0xff];
const BRAND_600 = [0x3b, 0x5b, 0xfe];

/** Граница тёмного блока: по краям ниже, посередине выше — полотно выгибается вверх. */
const ARC_BASE = 200;
const ARC_RISE = 50;

/** Нижняя фирменная полоса. */
const RULE = 10;

const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => v + (b[i] - v) * t);

function background(): RawImage {
  const data = new Uint8ClampedArray(W * H * 4);

  for (let x = 0; x < W; x++) {
    // Граница дуги для этой колонки. Синус, а не окружность: у окружности
    // края круче середины, и на широкой картинке дуга читается пузырём.
    const arc = ARC_BASE - ARC_RISE * Math.sin((Math.PI * x) / W);
    const deep = mix(DEEP_900, SURFACE_ACCENT, x / W);

    for (let y = 0; y < H; y++) {
      const light = mix(SURFACE, BRAND_50, y / H);

      // Мягкий переход в полторы точки: ступенька по краю дуги
      // на сжатой соцсетью картинке превращается в лесенку.
      const t = Math.min(1, Math.max(0, (y - arc) / 1.5));
      const rgb = mix(deep, light, t);

      const i = (y * W + x) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
    }
  }

  // Фирменная полоса по нижнему краю: та же роль, что у синей кнопки
  // на странице, — единственное яркое пятно, и оно закрывает композицию.
  for (let y = H - RULE; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = BRAND_600[0];
      data[i + 1] = BRAND_600[1];
      data[i + 2] = BRAND_600[2];
    }
  }

  return { data, width: W, height: H };
}

/** Наложение с учётом прозрачности: у знака альфа-канал, фон должен просвечивать. */
function composite(base: RawImage, top: RawImage, left: number, top_: number) {
  for (let y = 0; y < top.height; y++) {
    const by = top_ + y;
    if (by < 0 || by >= base.height) continue;

    for (let x = 0; x < top.width; x++) {
      const bx = left + x;
      if (bx < 0 || bx >= base.width) continue;

      const s = (y * top.width + x) * 4;
      const a = top.data[s + 3] / 255;
      if (a === 0) continue;

      const d = (by * base.width + bx) * 4;
      for (let c = 0; c < 3; c++) {
        base.data[d + c] = top.data[s + c] * a + base.data[d + c] * (1 - a);
      }
    }
  }
}

/**
 * Белая плашка со скруглением и мягкой тенью.
 *
 * Снимки поставщика сняты на белом и приходят без прозрачности, то есть
 * ложатся на фон непрозрачным прямоугольником. На градиенте его край видно,
 * и картинка выглядит собранной наспех. Плашка превращает этот край
 * в намеренный: ровно так снимки лежат и на самом сайте — ProductCard
 * подкладывает под них белое по той же причине.
 *
 * Форма считается через расстояние до скруглённого прямоугольника: оно же
 * даёт и сглаживание края (доля точки на границе), и тень (мягкий спад
 * наружу). Рисовать их по отдельности значило бы дважды описать одну фигуру.
 */
function plate(base: RawImage, x: number, y: number, w: number, h: number, r: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hw = w / 2 - r;
  const hh = h / 2 - r;

  const dist = (px: number, py: number, ox: number, oy: number) => {
    const dx = Math.max(Math.abs(px - cx - ox) - hw, 0);
    const dy = Math.max(Math.abs(py - cy - oy) - hh, 0);
    return Math.hypot(dx, dy) - r;
  };

  const BLUR = 18;
  const SHADOW = 0.18;

  for (let py = Math.max(0, y - BLUR - 8); py < Math.min(base.height, y + h + BLUR + 12); py++) {
    for (let px = Math.max(0, x - BLUR - 8); px < Math.min(base.width, x + w + BLUR + 8); px++) {
      const i = (py * base.width + px) * 4;

      // Тень со смещением вниз: свет сверху, как у карточек на сайте.
      const ds = dist(px, py, 0, 6);
      if (ds > 0 && ds < BLUR) {
        const a = SHADOW * (1 - ds / BLUR) ** 2;
        for (let c = 0; c < 3; c++) base.data[i + c] = base.data[i + c] * (1 - a);
      }

      // Сама плашка. 0.5 − d даёт долю точки на границе: без этого
      // скругление выходит лесенкой.
      const d = dist(px, py, 0, 0);
      const a = Math.min(1, Math.max(0, 0.5 - d));
      if (a > 0) {
        for (let c = 0; c < 3; c++) {
          base.data[i + c] = 255 * a + base.data[i + c] * (1 - a);
        }
      }
    }
  }
}

/**
 * Уместить снимок в коробку, сохранив пропорции.
 *
 * Только уменьшение: растянутый снимок мылится, а запас по разрешению
 * у мастеров невелик. Если картинка меньше коробки — оставляем как есть
 * и ставим по центру.
 */
function fit(image: RawImage, boxW: number, boxH: number): RawImage {
  const scale = Math.min(boxW / image.width, boxH / image.height, 1);
  if (scale === 1) return image;
  return downscale(
    image,
    Math.max(1, Math.round(image.width * scale)),
    Math.max(1, Math.round(image.height * scale)),
  );
}

await initCodecs();
const wasm = async (p: string) => WebAssembly.compile(await readFile(p));
await initPngEncode(
  await wasm("node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm"),
);
await initJpegEncode(
  await wasm("node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm"),
);

await mkdir("public/og", { recursive: true });

// =============================================================================
// Картинка по умолчанию: знак на фирменном фоне
// =============================================================================

// Знак с надписью. Тот же разбор листа, что у make-logo: если резать
// здесь по-своему, два скрипта разойдутся на первом же новом файле.
const { lockup } = await loadLogoParts();
const mark = fit(lockup, 700, 300);

const lightTop = ARC_BASE - ARC_RISE;
{
  const canvas = background();
  // По центру светлой части, а не картинки целиком: иначе знак наползает
  // на тёмный блок и половина надписи теряется на тёмном.
  const y = Math.round(lightTop + (H - RULE - lightTop - mark.height) / 2);
  composite(canvas, mark, Math.round((W - mark.width) / 2), y);

  const png = await encodePng({
    data: canvas.data,
    width: W,
    height: H,
  } as unknown as ImageData);

  await writeFile("public/og/default.png", Buffer.from(png));
  console.log(`public/og/default.png — ${W}×${H}, ${kb(png.byteLength)}`);
}

// =============================================================================
// Карточки товаров: знак слева, снимок модели справа
// =============================================================================

// Знак поуже: справа стоит снимок, и полноразмерная версия с ним спорит.
// Тот же знак, но уже: справа стоит снимок, и полноразмерная версия
// с ним спорит.
const wideMark = fit(lockup, 400, 150);

const products = JSON.parse(
  await readFile("app/data/products.json", "utf8"),
) as Product[];

// Снимок один на серию, поэтому карточка тоже одна: ключ — сам файл.
// Без этого 50 моделей дали бы 50 одинаковых картинок и лишние мегабайты
// в сборке.
const byImage = new Map<string, string[]>();
for (const p of products) {
  if (!p.image) continue;
  byImage.set(p.image, (byImage.get(p.image) ?? []).concat(p.slug));
}

// Пересоздаём каталог целиком: если модель исчезла из выгрузки, её карточка
// не должна остаться лежать в сборке навсегда.
await rm("public/og/product", { recursive: true, force: true });
await mkdir("public/og/product", { recursive: true });

let total = 0;
let missing = 0;

for (const [imagePath] of byImage) {
  let photo: RawImage;
  try {
    photo = await decodeImage(await readFile(`public${imagePath}`));
  } catch {
    // Снимка нет на диске — карточки просто не будет, страница возьмёт
    // общую. Падать из-за одной картинки нельзя: остальные нужны.
    missing++;
    continue;
  }

  const canvas = background();
  const boxTop = lightTop + 20;
  const boxH = H - RULE - boxTop - 20;

  // Знак слева, по центру светлой части.
  composite(
    canvas,
    wideMark,
    110,
    Math.round(boxTop + (boxH - wideMark.height) / 2),
  );

  // Снимок справа, на белой плашке. Коробка уже половины: у знака слева
  // должно остаться поле, иначе картинка читается забитой до краёв.
  const PLATE_X = 636;
  const PLATE_W = 468;
  plate(canvas, PLATE_X, boxTop, PLATE_W, boxH, 22);

  // Внутренние поля плашки, чтобы снимок не упирался в её скругления.
  const shot = fit(photo, PLATE_W - 56, boxH - 48);
  composite(
    canvas,
    shot,
    Math.round(PLATE_X + (PLATE_W - shot.width) / 2),
    Math.round(boxTop + (boxH - shot.height) / 2),
  );

  // JPEG, а не PNG: тридцать три карточки в PNG весили бы мегабайт пять,
  // а здесь фотография на плавном фоне — ровно то, что JPEG сжимает лучше
  // всего. Качество 82 — то же, что у снимков каталога.
  const jpeg = await encodeJpeg(
    { data: canvas.data, width: W, height: H } as unknown as ImageData,
    { quality: 82 },
  );

  const name = basename(imagePath).replace(/\.[^.]+$/, "") + ".jpg";
  await writeFile(`public/og/product/${name}`, Buffer.from(jpeg));
  total += jpeg.byteLength;
}

console.log(
  `public/og/product/ — ${byImage.size - missing} карточек на ${products.length} моделей, ${kb(total)}`,
);
if (missing) console.warn(`  ${missing} снимков не нашлось на диске`);
