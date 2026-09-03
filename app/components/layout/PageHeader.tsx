import type { ReactNode } from "react";
import { Container } from "~/components/ui/Container";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import styles from "./PageHeader.module.scss";

type Props = {
  title: string;
  lead?: string;
  crumbs: Crumb[];
  children?: ReactNode;
};

export function PageHeader({ title, lead, crumbs, children }: Props) {
  return (
    <div className={styles.header}>
      <Container>
        <Breadcrumbs items={crumbs} />
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
        {children}
      </Container>
    </div>
  );
}
