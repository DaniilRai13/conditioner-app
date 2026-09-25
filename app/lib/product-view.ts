import {
  Snowflake,
  Wind,
  Flame,
  Volume2,
  Thermometer,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product } from "~/types/product";
import { formatArea, formatKw } from "./format";

/**
 * Ключевые характеристики товара для верхнего блока карточки.
 *
 * Чистая функция от характеристик: занимала треть страницы товара перед
 * первым тегом, хотя разметки в ней нет вовсе — только выбор, что показать
 * и как назвать.
 *
 * Пустые поля отсеиваются здесь же. У выгрузки поставщика данные дырявые:
 * у половины мобильных нет обогрева, у части сплитов не указан шум. Строка
 * «Шум: —» ничего не сообщает, а место занимает.
 */

export type Highlight = {
  icon: LucideIcon;
  label: string;
  value: string;
  /**
   * Характеристика про тепло, а не про холод.
   *
   * Метка, а не готовый цвет: какой именно — дело оформления, здесь же
   * только факт. Иначе цвет пришлось бы менять в двух местах, а модуль
   * без разметки внезапно начал бы знать про палитру.
   */
  heat?: true;
};

export function getHighlights(specs: Product["specs"]): Highlight[] {
  const rows: (Highlight | null)[] = [
    specs.areaM2
      ? { icon: Snowflake, label: "Площадь", value: formatArea(specs.areaM2)! }
      : null,
    specs.coolingKw
      ? { icon: Wind, label: "Охлаждение", value: formatKw(specs.coolingKw)! }
      : null,
    specs.heatingKw
      ? {
          icon: Flame,
          label: "Обогрев",
          value: formatKw(specs.heatingKw)!,
          heat: true,
        }
      : null,
    specs.noiseDb
      ? { icon: Volume2, label: "Шум", value: `от ${specs.noiseDb} дБ` }
      : null,
    // Ноль здесь осмысленное значение, поэтому проверка на undefined,
    // а не на истинность: «обогрев до 0 °C» — это факт, а не пустое поле.
    specs.minHeatTemp !== undefined
      ? {
          icon: Thermometer,
          label: "Обогрев до",
          value: `${specs.minHeatTemp} °C`,
          heat: true,
        }
      : null,
    specs.hasWifi ? { icon: Wifi, label: "Wi-Fi", value: "есть" } : null,
  ];

  return rows.filter((row): row is Highlight => row !== null);
}
