import { readFile } from "node:fs/promises";
import { decodeImage, type RawImage } from "./images.ts";

/**
 * Разбор присланного знака на части.
 *
 * Заказчик прислал один файл, в котором два актива стоят рядом: слева
 * полный знак с надписью и подписью, справа одна эмблема. Между ними
 * и под надписью — чистые прозрачные промежутки, по ним и режем.
 *
 * Границы ищутся, а не записаны числами: файл ещё пришлют заново —
 * поправленный или наконец в векторе, — и захардкоженные координаты
 * в этот день молча отрежут половину знака. Поиск по прозрачности
 * переживает и смену полей, и смену размера.
 *
 * Общий модуль, потому что режут двое: сборка веб-версий (make-logo)
 * и рисование картинок ссылок (make-og). Две копии этой логики разошлись
 * бы на первом же новом файле.
 */

export type LogoParts = {
  /** Эмблема без надписи. Шапка, админка, плитки, картинки ссылок. */
  mark: RawImage;
  /** Эмблема с надписью «Климат Лайн», БЕЗ подписи под ней. */
  lockup: RawImage;
};

/**
 * Порог прозрачности.
 *
 * Не ноль: у знака широкий мягкий край, и по краю тянутся точки с альфой
 * в единицы процентов. На чёрном фоне они видны цветным ореолом, на белом
 * не видны вовсе — но границы по ним считаются на сотню точек шире, чем
 * есть на самом деле, и знак приезжает в вёрстку с полями, которых никто
 * не задавал.
 */
const SOLID = 40;

function alphaAt(img: RawImage, x: number, y: number): number {
  return img.data[(y * img.width + x) * 4 + 3];
}

/** Вырезать прямоугольник. */
function crop(img: RawImage, l: number, t: number, r: number, b: number): RawImage {
  const w = r - l + 1;
  const h = b - t + 1;
  const data = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    const from = ((y + t) * img.width + l) * 4;
    data.set(img.data.subarray(from, from + w * 4), y * w * 4);
  }

  return { data, width: w, height: h };
}

/** Самый широкий промежуток без единой видимой точки. */
function widestGap(used: Uint8Array, from: number, to: number) {
  let best = { start: 0, len: 0 };
  let run = 0;

  for (let i = from; i <= to; i++) {
    if (!used[i]) {
      run++;
      if (run > best.len) best = { start: i - run + 1, len: run };
    } else {
      run = 0;
    }
  }

  return best;
}

export async function loadLogoParts(source = "assets/logo.png"): Promise<LogoParts> {
  const img = await decodeImage(await readFile(source));

  // Занятые столбцы и строки.
  const cols = new Uint8Array(img.width);
  const rows = new Uint8Array(img.height);
  let left = img.width, right = -1, top = img.height, bottom = -1;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (alphaAt(img, x, y) <= SOLID) continue;
      cols[x] = 1;
      rows[y] = 1;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) throw new Error(`${source}: не нашёл ни одной непрозрачной точки`);

  // Вертикальный разрыв делит лист на знак и эмблему.
  const gap = widestGap(cols, left, right);
  if (gap.len < 20) {
    throw new Error(
      `${source}: не нашёл разрыв между знаком и эмблемой. ` +
        `Ожидался лист, где они стоят рядом.`
    );
  }

  const markLeft = gap.start + gap.len;
  const mark = crop(img, markLeft, top, right, bottom);

  // В левой половине под надписью идёт подпись «тепло · холод · комфорт».
  // Её отрезаем: она набрана внутри картинки и на маленьком размере
  // превращается в серую полоску, а живой текст рядом читается всегда
  // и правится в одном месте.
  const leftRows = new Uint8Array(img.height);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x < gap.start; x++) {
      if (alphaAt(img, x, y) > SOLID) { leftRows[y] = 1; break; }
    }
  }

  const strip = widestGap(leftRows, top, bottom);
  const lockupBottom = strip.len >= 15 ? strip.start - 1 : bottom;

  // Обрезаем и по горизонтали заново: без подписи знак уже, она шире.
  let lockLeft = gap.start, lockRight = left;
  for (let y = top; y <= lockupBottom; y++) {
    for (let x = left; x < gap.start; x++) {
      if (alphaAt(img, x, y) <= SOLID) continue;
      if (x < lockLeft) lockLeft = x;
      if (x > lockRight) lockRight = x;
    }
  }

  const lockup = crop(img, lockLeft, top, lockRight, lockupBottom);

  return { mark, lockup };
}
