import type { MetaFunction } from "react-router";
import { useCallback, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { deleteReview, listReviews, saveReview } from "~/lib/admin-api";
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
  Textarea,
} from "~/components/admin/ui";
import type { ReviewRow } from "~/lib/admin-api";
import styles from "./reviews.module.scss";

/**
 * Отзывы.
 *
 * Новый отзыв создаётся неопубликованным: показывать его сразу после ввода
 * значит выкладывать опечатку на сайт и править её задним числом. Галочка
 * «показывать» — отдельное решение, отдельное действие.
 *
 * Пока на сайте нет ни одного опубликованного, блок отзывов скрыт целиком:
 * раздел с одной карточкой выглядит хуже, чем его отсутствие.
 */

function ReviewCard({
  review,
  onChanged,
}: {
  review: ReviewRow;
  onChanged: () => void;
}) {
  const { save, saveNow, saved, error } = useSave();
  const [author, setAuthor] = useState(review.author);
  const [text, setText] = useState(review.text);

  return (
    <Card>
      <div className={styles.item}>
        <Field label="Кто оставил">
          <Input
            value={author}
            onChange={(e) => {
              setAuthor(e.target.value);
              save(() => saveReview({ id: review.id, author: e.target.value }));
            }}
          />
        </Field>

        <Field label="Текст">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              save(() => saveReview({ id: review.id, text: e.target.value }));
            }}
          />
        </Field>

        <div className={styles.controls}>
          <Check
            checked={review.is_published}
            label="Показывать на сайте"
            onChange={(is_published) => {
              saveNow(async () => {
                const result = await saveReview({ id: review.id, is_published });
                onChanged();
                return result;
              });
            }}
          />

          <Saved show={saved} />

          <Button
            variant="danger"
            small
            className={styles.remove}
            onClick={() => {
              // Подтверждение через confirm, а не через своё окно: удаление
              // здесь редкое, и модалка ради него — лишние сто строк.
              if (!window.confirm("Удалить отзыв? Это навсегда.")) return;
              void deleteReview(review.id).then(onChanged);
            }}
          >
            <Trash2 aria-hidden />
            Удалить
          </Button>
        </div>

        {error && <p className={styles.error}>{error.message}</p>}
      </div>
    </Card>
  );
}

export default function ReviewsPage() {
  const load = useCallback(() => listReviews(), []);
  const { rows, loading, refreshing, error, refresh } = useRows<ReviewRow>(load);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    await saveReview({
      author: "Имя",
      text: "Текст отзыва",
      is_published: false,
      sort_order: rows.length,
    });
    setBusy(false);
    refresh();
  }

  const published = rows.filter((r) => r.is_published).length;

  return (
    <>
      <PageHead
        title="Отзывы"
        text="Новый отзыв создаётся скрытым. Проверьте текст, потом поставьте галочку «показывать» — на сайте он появится после ближайшей пересборки."
      >
        <Button variant="ghost" small busy={refreshing} onClick={refresh}>
          <RefreshCw aria-hidden />
          {refreshing ? "Обновляю…" : "Обновить"}
        </Button>
        <Button small onClick={() => void add()} disabled={busy}>
          <Plus aria-hidden />
          Добавить
        </Button>
      </PageHead>

      {rows.length > 0 && published === 0 && (
        <Notice tone="warn">
          Ни один отзыв не опубликован — на сайте блок отзывов не показывается.
        </Notice>
      )}

      <State
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyText="Отзывов пока нет. Нажмите «Добавить»."
      >
        <div className={styles.list}>
          {rows.map((review) => (
            <ReviewCard key={review.id} review={review} onChanged={refresh} />
          ))}
        </div>
      </State>
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Отзывы — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
