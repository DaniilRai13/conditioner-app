import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import { solutions, areaLabel } from "~/data/solutions";
import { site } from "~/config/site";
import styles from "./not-found.module.scss";

export const meta: MetaFunction = () => [
  { title: `Страница не найдена — ${site.name}` },
  { name: "robots", content: "noindex, follow" },
];

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Container>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Такой страницы нет</h1>
        <p className={styles.lead}>
          Возможно, она переехала или в адресе опечатка. Начните с главной или
          сразу посмотрите готовые решения — они закрывают большинство задач.
        </p>

        <div className={styles.actions}>
          <Button to="/">На главную</Button>
          <Button to="/catalog" variant="secondary">
            В каталог
          </Button>
        </div>

        <div className={styles.suggest}>
          <b className={styles.suggestTitle}>Популярные решения</b>
          <ul className={styles.list}>
            {solutions.map((s) => (
              <li key={s.slug}>
                <Link to={`/solutions/${s.slug}`} className={styles.link}>
                  {s.room} · {areaLabel(s)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.call}>
          Не нашли нужное? Позвоните: <a href={site.phoneHref}>{site.phone}</a>
        </p>
      </Container>
    </main>
  );
}
