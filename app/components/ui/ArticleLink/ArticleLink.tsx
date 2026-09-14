import { Link } from "react-router";
import { BookOpen, ArrowRight } from "lucide-react";
import { articles } from "~/data/articles";
import styles from "./ArticleLink.module.scss";

type Props = {
  /**
   * Слаг статьи. Заголовок и время чтения берутся из данных, а не задаются
   * на месте: иначе правка заголовка в одном файле оставляет по сайту
   * четыре ссылки со старым названием, и заметить это нечем.
   */
  slug: string;

  /**
   * Подводка — зачем эта статья здесь. Своя на каждом месте: на странице
   * решения спрашивают про запас мощности, на карточке товара — что даёт
   * инвертор. Лид самой статьи отвечает вообще, а не на этот вопрос.
   */
  hint: string;

  className?: string;
};

/**
 * Ссылка на статью со страницы, где возникает её вопрос.
 *
 * Раздел «Полезное» стоял только в подвале, то есть на всех страницах сразу
 * и ни на одной по делу. Сквозную ссылку и человек не замечает, и поисковик
 * почти не учитывает; ссылка со страницы про площадь на статью про площадь
 * весит несоизмеримо больше.
 */
export function ArticleLink({ slug, hint, className }: Props) {
  const article = articles.find((a) => a.slug === slug);

  // Статью удалили или переименовали слаг — ссылка просто исчезает.
  // Битая ссылка на собственном сайте хуже, чем её отсутствие, а уронить
  // страницу решения из-за пропавшей заметки нельзя тем более.
  if (!article) return null;

  return (
    <Link
      to={`/articles/${article.slug}`}
      className={[styles.link, className].filter(Boolean).join(" ")}
    >
      <span className={styles.icon} aria-hidden>
        <BookOpen size={18} />
      </span>

      <span className={styles.body}>
        <span className={styles.hint}>{hint}</span>
        <b className={styles.title}>{article.title}</b>
        <span className={styles.meta}>{article.readMinutes} мин чтения</span>
      </span>

      <ArrowRight size={18} className={styles.arrow} aria-hidden />
    </Link>
  );
}
