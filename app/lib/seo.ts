import type { MetaDescriptor } from "react-router";
import { site, IS_PREVIEW } from "~/config/site";

/**
 * Мета-теги страницы из одного места (PLAN.md §9).
 *
 * Раньше каждый роут собирал массив руками: где-то заголовок кончался
 * на «— Климат Лайн», где-то на «| Климат Лайн», canonical стоял на одной
 * странице из пятнадцати, а og-тегов не было вовсе — в мессенджере ссылка
 * выглядела голой. Здесь один формат на всех, и добавить тег теперь можно
 * в одном файле, а не в пятнадцати.
 */

type SeoInput = {
  /** Заголовок без названия сайта — оно добавляется само. */
  title: string;
  description?: string;
  /** Путь от корня: «/catalog», «/» для главной. */
  path: string;
  /** «article» для статей, у остальных — «website». */
  type?: "website" | "article";
  /** Своя картинка для соцсетей, путь от корня. */
  image?: string;
  /** «noindex, follow» для служебных страниц. */
  robots?: string;
  /**
   * Добавлять ли «— Климат Лайн» в конец заголовка. На карточках товара
   * выключено: там четырнадцать символов названия сайта отбирают место
   * у имени модели, а бренд продавца в этом заголовке и не главное.
   */
  brandSuffix?: boolean;
};

/** Картинка по умолчанию. Одна на сайт, пока нет своих по разделам. */
const OG_IMAGE = "/og/default.png";
const OG_WIDTH = "1200";
const OG_HEIGHT = "630";

/**
 * Описание длиннее 160 символов поиск всё равно обрежет — и обрежет
 * посреди слова. Режем сами и по границе предложения, а если её рядом
 * нет — по границе слова. Многоточие не ставим: это не обрыв мысли,
 * а нормальный конец сокращённого текста.
 */
function clamp(text: string, max = 160): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "));
  if (sentence > max * 0.6) return head.slice(0, sentence + 1);
  return head.slice(0, head.lastIndexOf(" ")).replace(/[,;:—-]$/, "");
}

const abs = (path: string) =>
  `${site.url.replace(/\/$/, "")}${path === "/" ? "" : path}`;

export function seo({
  title,
  description,
  path,
  type = "website",
  image = OG_IMAGE,
  robots,
  brandSuffix = true,
}: SeoInput): MetaDescriptor[] {
  const fullTitle = brandSuffix ? `${title} — ${site.name}` : title;
  const url = abs(path);

  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    // Canonical на каждой странице, а не только на главной: сайт статический,
    // и один и тот же документ доступен и с «/», и без него, и с любым
    // мусором в query — от рекламных меток до ответов квиза.
    { tagName: "link", rel: "canonical", href: url },

    { property: "og:title", content: fullTitle },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: site.name },
    { property: "og:locale", content: "ru_RU" },
    { property: "og:image", content: abs(image) },
    // Размеры обязательны: без них соцсети показывают маленькую квадратную
    // карточку, пока не скачают файл, а часть клиентов — всегда.
    { property: "og:image:width", content: OG_WIDTH },
    { property: "og:image:height", content: OG_HEIGHT },
    { property: "og:image:alt", content: fullTitle },

    // Twitter-теги читает не только сам Twitter — на них смотрят и другие
    // клиенты, когда og-разметка неполная.
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:image", content: abs(image) },
  ];

  if (description) {
    description = clamp(description);
    tags.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description }
    );
  }

  // На черновой выкладке noindex получают все страницы без исключения —
  // включая те, у которых своих правил для роботов нет.
  const robotsValue = IS_PREVIEW ? "noindex, nofollow" : robots;
  if (robotsValue) tags.push({ name: "robots", content: robotsValue });

  return tags;
}
