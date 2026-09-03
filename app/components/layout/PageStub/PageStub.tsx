import { Container } from "~/components/ui/Container/Container";
import { Button } from "~/components/ui/Button/Button";
import styles from "./PageStub.module.scss";

type Props = {
  title: string;
  note: string;
};

/**
 * Временная заглушка страницы. Существует, чтобы роут был реальным
 * и попадал в пререндер с первого дня — иначе проблемы со сборкой
 * всплывут в самом конце. Заменяется содержимым на этапах 1–3.
 */
export function PageStub({ title, note }: Props) {
  return (
    <main className={styles.stub}>
      <Container>
        <p className={styles.badge}>В разработке</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.note}>{note}</p>
        <Button to="/" variant="secondary">
          На главную
        </Button>
      </Container>
    </main>
  );
}
