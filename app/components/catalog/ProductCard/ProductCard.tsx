import { Link } from "react-router";
import { Snowflake, Wifi, Volume2 } from "lucide-react";
import type { CatalogProduct } from "~/lib/queries";
import { formatPrice, formatArea, formatKw } from "~/lib/format";
import { PRICE_MODE } from "~/config/pricing";
import styles from "./ProductCard.module.scss";

type Props = {
  product: CatalogProduct;
};

export function ProductCard({ product }: Props) {
  const { image, name, brand, model, price, inStock, specs } = product;

  return (
    <Link to={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.media}>
        {image ? (
          <picture>
            <source
              type="image/avif"
              srcSet={`${image}-400.avif 400w, ${image}-800.avif 800w`}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 44vw, 22vw"
            />
            <img
              className={styles.image}
              src={`${image}-400.webp`}
              srcSet={`${image}-400.webp 400w, ${image}-800.webp 800w`}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 44vw, 22vw"
              alt={name}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
            />
          </picture>
        ) : (
          <div className={styles.noImage} aria-hidden />
        )}

        {!inStock && <span className={styles.badge}>Под заказ</span>}
      </div>

      <span className={styles.brand}>{brand}</span>
      <b className={styles.model}>{model || name}</b>

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

      <span className={styles.footer}>
        <span className={styles.price}>
          {formatPrice(price)}
          <span className={styles.priceNote}>
            {PRICE_MODE === "turnkey" ? "под ключ" : "без монтажа"}
          </span>
        </span>
        {specs.isInverter && <span className={styles.tag}>Инвертор</span>}
      </span>
    </Link>
  );
}
