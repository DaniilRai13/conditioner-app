import type { MetaFunction } from "react-router";
import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  listPrices,
  listSettings,
  updatePrice,
  updateSetting,
} from "~/lib/admin-api";
import { useRows } from "~/hooks/useRows";
import { useSave } from "~/hooks/useSave";
import {
  Button,
  Card,
  Check,
  Field,
  Input,
  Notice,
  PageHead,
  Saved,
  State,
  Subhead,
  Table,
  Textarea,
} from "~/components/admin/ui";
import type { InstallPriceRow, SettingRow } from "~/lib/admin-api";
import styles from "./prices.module.scss";

/**
 * Цены на монтаж и настройки, которые с ними связаны.
 *
 * Пока хотя бы одна строка не подтверждена, страница цен на сайте пишет
 * «по запросу» вместо числа. Так и задумано: опубликованная цифра — это
 * обещание, человек приедет с ней, и подтвердить её должен тот, кто будет
 * по ней работать, а не тот, кто верстал таблицу.
 */

function PriceRow({
  row,
  onPatch,
}: {
  row: InstallPriceRow;
  onPatch: (id: string, fields: Partial<InstallPriceRow>) => void;
}) {
  const { save, saveNow, saved, error } = useSave();
  const [price, setPrice] = useState(String(row.price));

  return (
    <tr>
      <td data-label="Площадь">
        <b>{row.area}</b>
        <span className={styles.sub}>
          {row.btu} BTU · {row.kw} кВт
        </span>
      </td>

      <td className={styles.priceCell} data-label="Монтаж, р.">
        <Input
          type="number"
          min={0}
          step={10}
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            const value = Number(e.target.value);
            if (!Number.isFinite(value) || value < 0) return;
            onPatch(row.id, { price: value });
            save(() => updatePrice(row.id, { price: value }));
          }}
        />
      </td>

      <td className={styles.confirmCell} data-label="Публиковать">
        <Check
          checked={row.is_confirmed}
          label="подтверждена"
          onChange={(checked) => {
            onPatch(row.id, { is_confirmed: checked });
            saveNow(() => updatePrice(row.id, { is_confirmed: checked }));
          }}
        />
        <Saved show={saved} />
        {error && <span className={styles.rowError}>{error.message}</span>}
      </td>
    </tr>
  );
}

/** Список строк одной настройкой: «что входит», «что оплачивается отдельно». */
function ListSetting({ setting }: { setting: SettingRow }) {
  const initial = Array.isArray(setting.value)
    ? (setting.value as string[]).join("\n")
    : String(setting.value ?? "");
  const [text, setText] = useState(initial);
  const { save, saved, error } = useSave();

  return (
    <Card>
      <Field label={setting.label || setting.key} hint="По одному пункту в строке">
        <Textarea
          rows={Math.max(3, text.split("\n").length)}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const lines = e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            save(() => updateSetting(setting.key, lines));
          }}
        />
      </Field>
      <Saved show={saved} />
      {error && <p className={styles.error}>{error.message}</p>}
    </Card>
  );
}

/** Одна строка текста: срок поставки. */
function TextSetting({ setting }: { setting: SettingRow }) {
  const [value, setValue] = useState(String(setting.value ?? ""));
  const { save, saved, error } = useSave();

  return (
    <Card>
      <Field label={setting.label || setting.key}>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            save(() => updateSetting(setting.key, e.target.value));
          }}
        />
      </Field>
      <Saved show={saved} />
      {error && <p className={styles.error}>{error.message}</p>}
    </Card>
  );
}

/**
 * Галочка: показывать блок на сайте или нет.
 *
 * Отдельно от остальных настроек, потому что цена ошибки другая. Правка
 * текста — это текст, а этот флажок решает, соберётся ли страница вообще:
 * от него зависят и маршруты, и ссылки в подвале. Отсюда и сохранение
 * без паузы — тут нечего дописывать.
 */
function BoolSetting({ setting }: { setting: SettingRow }) {
  const [on, setOn] = useState(setting.value === true);
  const { saveNow, saved, error } = useSave();

  return (
    <Card>
      <Check
        checked={on}
        label={setting.label || setting.key}
        hint={
          on
            ? "Раздел появится на сайте после ближайшей пересборки."
            : "Раздел скрыт: страницы нет, ссылки в подвале нет."
        }
        onChange={(checked) => {
          setOn(checked);
          saveNow(() => updateSetting(setting.key, checked));
        }}
      />
      <Saved show={saved} />
      {error && <p className={styles.error}>{error.message}</p>}
    </Card>
  );
}

const LIST_KEYS = ["install_includes", "extra_charges"];
const TEXT_KEYS = ["delivery_days"];
const BOOL_KEYS = ["show_portfolio", "show_reviews"];

export default function PricesPage() {
  const loadPrices = useCallback(() => listPrices(), []);
  const loadSettings = useCallback(() => listSettings(), []);

  const prices = useRows<InstallPriceRow>(loadPrices);
  // Настройки не имеют колонки id — useRows требует её, поэтому подставляем
  // ключ: он и так уникален, это первичный ключ таблицы.
  const settings = useRows<SettingRow & { id: string }>(
    useCallback(async () => {
      const result = await loadSettings();
      if (result.error) return result;
      return { data: result.data.map((s) => ({ ...s, id: s.key })), error: null };
    }, [loadSettings])
  );

  const unconfirmed = prices.rows.filter((r) => !r.is_confirmed).length;

  return (
    <>
      <PageHead
        title="Цены на монтаж"
        text="Числа отсюда попадают на страницу «Сколько стоит» и в карточки товаров — но только после того, как строку подтвердят."
      >
        <Button variant="ghost" small busy={prices.refreshing} onClick={prices.refresh}>
          <RefreshCw aria-hidden />
          {prices.refreshing ? "Обновляю…" : "Обновить"}
        </Button>
      </PageHead>

      {unconfirmed > 0 && (
        <Notice tone="warn">
          Не подтверждено строк: {unconfirmed}. Пока это так, на сайте вместо цен
          стоит «по запросу» — цифры не публикуются, пока их никто не подтвердил.
        </Notice>
      )}

      <State
        loading={prices.loading}
        error={prices.error}
        empty={prices.rows.length === 0}
      >
        <Table cards>
          <thead>
            <tr>
              <th>Площадь</th>
              <th>Монтаж, р.</th>
              <th>Публиковать</th>
            </tr>
          </thead>
          <tbody>
            {prices.rows.map((row) => (
              <PriceRow key={row.id} row={row} onPatch={prices.patch} />
            ))}
          </tbody>
        </Table>
      </State>

      <State
        loading={settings.loading}
        error={settings.error}
        empty={settings.rows.length === 0}
      >
        <Subhead>Что входит и сроки</Subhead>

        <div className={styles.cards}>
          {settings.rows
            .filter((s) => TEXT_KEYS.includes(s.key))
            .map((s) => (
              <TextSetting key={s.key} setting={s} />
            ))}
          {settings.rows
            .filter((s) => LIST_KEYS.includes(s.key))
            .map((s) => (
              <ListSetting key={s.key} setting={s} />
            ))}
        </div>

        <Subhead>Блоки на сайте</Subhead>

        <Notice>
          Работы и отзывы выключены, пока для них нет содержимого: пустой раздел
          в поиске хуже отсутствующего. Заполните раздел, потом включайте.
        </Notice>

        <div className={styles.cards}>
          {settings.rows
            .filter((s) => BOOL_KEYS.includes(s.key))
            .map((s) => (
              <BoolSetting key={s.key} setting={s} />
            ))}
        </div>
      </State>
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Цены — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
