import { Link } from "react-router";
import { Snowflake, Wifi, Volume2 } from "lucide-react";
import type { CatalogProduct } from "~/lib/queries";
import { formatPrice, formatArea, formatKw } from "~/lib/format";
import { PRICE_MODE } from "~/config/pricing";
import styles from "./ProductCard.module.scss";

type Props = {
  product: CatalogProduct;

  /**
   * `grid` — картинка сверху, текст снизу.
   * `row` — картинка слева, текст справа.
   * `auto` — как `grid`, но на телефоне переключается в `row`: там карточка
   * растягивается на всю ширину и картинка 4:3 съедает пол-экрана.
   */
  layout?: "grid" | "row" | "auto";

  /**
   * Пропорции картинки в вертикальной раскладке.
   *
   * По умолчанию квадрат: снимки поставщика близки к нему, и в коробке 4:3
   * они вписывались по высоте, теряя треть площади на пустые поля по бокам.
   * `short` заметно уменьшает высоту карточки там, где колонки широкие.
   */
  media?: "wide" | "square" | "short";

  /** Плотнее отступы и мельче кегль — для тесных мест вроде выдачи квиза. */
  compact?: boolean;

  /**
   * Что скрыть. По умолчанию показывается всё; убирать стоит только то,
   * что в конкретном месте дублируется соседними элементами.
   */
  hide?: { brand?: boolean; specs?: boolean; tag?: boolean };

  /** Первые карточки в списке грузим сразу — они выше сгиба. */
  eager?: boolean;

  /** Снаружи — только скрыть карточку в свёрнутом хвосте каталога. */
  className?: string;
};

const MEDIA_CLASS = {
  wide: "mediaWide",
  square: "mediaSquare",
  short: "mediaShort",
} as const;

export function ProductCard({
  product,
  layout = "auto",
  media = "square",
  compact = false,
  hide = {},
  eager = false,
  className: extra,
}: Props) {
  const { image, name, brand, model, price, inStock, specs } = product;

  const cls = [
    styles.card,
    styles[MEDIA_CLASS[media]],
    layout === "row" && styles.row,
    layout === "auto" && styles.autoRow,
    compact && styles.compact,
    extra,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={`/product/${product.slug}`} className={cls}>
      <div className={styles.media}>
        {image ? (
          <img
            className={styles.image}
            src={image}
            alt={name}
            width={800}
            height={800}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <div className={styles.noImage} aria-hidden />
        )}

        {!inStock && <span className={styles.badge}>Под заказ</span>}
      </div>

      {/* В вертикальной раскладке обёртка «прозрачна» (display: contents),
          поэтому разметка одна на все варианты. */}
      <span className={styles.body}>
        {!hide.brand && <span className={styles.brand}>{brand}</span>}
        <b className={styles.model}>{model || name}</b>

        {!hide.specs && (
          <ul className={styles.specs}>
            {specs.areaM2 && (
              <li>
                <Snowflake size={14} aria-hidden />
                {formatArea(specs.areaM2)}
                {specs.coolingKw ? ` · ${formatKw(specs.coolingKw)}` : ""}
              </li>
            )}
            {specs.noiseDb && (
              <li>
                <Volume2 size={14} aria-hidden />
                от {specs.noiseDb} дБ
              </li>
            )}
            {specs.hasWifi && (
              <li>
                <Wifi size={14} aria-hidden />
                Wi-Fi
              </li>
            )}
          </ul>
        )}

        <span className={styles.footer}>
          <span className={styles.price}>
            {formatPrice(price)}
            <span className={styles.priceNote}>
              {PRICE_MODE === "turnkey" ? "под ключ" : "без монтажа"}
            </span>
          </span>
          {!hide.tag && specs.isInverter && (
            <span className={styles.tag}>Инвертор</span>
          )}
        </span>
      </span>
    </Link>
  );
}
