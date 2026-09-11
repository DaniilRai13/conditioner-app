import type { MetaFunction } from "react-router";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Plus, RefreshCw, Trash2, X } from "lucide-react";
import {
  deleteImage,
  deleteProject,
  listProjects,
  saveProject,
  uploadImage,
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
  Textarea,
} from "~/components/admin/ui";
import type { PortfolioRow } from "~/lib/admin-api";
import styles from "./portfolio.module.scss";

/**
 * Работы: описание и фотографии.
 *
 * Фотографии лежат в Storage, а не в базе строками base64: бакет публичный,
 * браузер кэширует файлы, и страница с двадцатью снимками не превращается
 * в мегабайтный JSON.
 *
 * Загрузка идёт как есть, без сжатия на клиенте. Снимок с телефона — это
 * три-пять мегабайт, и на сайте такие показывать нельзя; их прогоняет
 * скрипт scripts/optimize-images.ts на стороне сайта, когда фотографии
 * уже собраны. Сжимать здесь значило бы тащить в админку кодеки ради
 * работы, которая делается раз в сезон.
 */

function ProjectCard({
  project,
  onChanged,
}: {
  project: PortfolioRow;
  onChanged: () => void;
}) {
  const { save, saveNow, saved, error } = useSave();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    // По одному, а не параллельно: с телефона это мегабайты, и десяток
    // одновременных загрузок на мобильном интернете просто отваливается
    // по таймауту.
    let order = project.images.length;
    for (const file of Array.from(files)) {
      await uploadImage(project.id, file, order++);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    onChanged();
  }

  return (
    <Card>
      <div className={styles.item}>
        <Field label="Название">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              save(() => saveProject({ id: project.id, title: e.target.value }));
            }}
          />
        </Field>

        <Field label="Описание">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              save(() => saveProject({ id: project.id, description: e.target.value }));
            }}
          />
        </Field>

        {project.images.length > 0 && (
          <div className={styles.gallery}>
            {project.images.map((image) => (
              <figure key={image.id} className={styles.shot}>
                <img className={styles.photo} src={image.url} alt="" loading="lazy" />

                <button
                  type="button"
                  className={styles.removePhoto}
                  title="Удалить фотографию"
                  aria-label="Удалить фотографию"
                  onClick={() => {
                    if (!window.confirm("Удалить фотографию?")) return;
                    void deleteImage(image.id, image.storage_path).then(onChanged);
                  }}
                >
                  <X aria-hidden />
                </button>
              </figure>
            ))}
          </div>
        )}

        <div className={styles.controls}>
          {/* Настоящий input спрятан, а нажимают на подпись к нему: браузерный
              «Файл не выбран» невозможно оформить, и он единственный элемент
              на странице, который выглядит из другой программы. */}
          <label className={styles.upload}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => void addFiles(e.target.files)}
            />
            <ImagePlus aria-hidden />
            {uploading ? "Загружаю…" : "Добавить фотографии"}
          </label>

          <Check
            checked={project.is_published}
            label="Показывать на сайте"
            onChange={(is_published) => {
              saveNow(async () => {
                const result = await saveProject({ id: project.id, is_published });
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
              if (!window.confirm("Удалить работу вместе с фотографиями?")) return;
              void deleteProject(project.id).then(onChanged);
            }}
          >
            <Trash2 aria-hidden />
            Удалить работу
          </Button>
        </div>

        {error && <p className={styles.error}>{error.message}</p>}
      </div>
    </Card>
  );
}

export default function PortfolioPage() {
  const load = useCallback(() => listProjects(), []);
  const { rows, loading, refreshing, error, refresh } = useRows<PortfolioRow>(load);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    await saveProject({
      title: "Новая работа",
      description: "",
      is_published: false,
      sort_order: rows.length,
    });
    setBusy(false);
    refresh();
  }

  const published = rows.filter((p) => p.is_published).length;

  return (
    <>
      <PageHead
        title="Работы"
        text="Фотографии загружаются как есть, сжимать их заранее не нужно. Работа появится на сайте после того, как её отметят «показывать», и после ближайшей пересборки."
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
          Ни одна работа не опубликована — на сайте блок с работами скрыт.
        </Notice>
      )}

      <State
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyText="Работ пока нет. Нажмите «Добавить»."
      >
        <div className={styles.list}>
          {rows.map((project) => (
            <ProjectCard key={project.id} project={project} onChanged={refresh} />
          ))}
        </div>
      </State>
    </>
  );
}

export const meta: MetaFunction = () => [
  { title: "Работы — админка" },
  { name: "robots", content: "noindex, nofollow" },
];
