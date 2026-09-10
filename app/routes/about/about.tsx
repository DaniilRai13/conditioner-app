import type { MetaFunction } from "react-router";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Card } from "~/components/ui/Card/Card";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import { aboutIntro, principles } from "~/data/about";
import { seo } from "~/lib/seo";
import styles from "./about.module.scss";

export const meta: MetaFunction = () =>
  seo({
    title: "Обо мне",
    description:
      "Работаю один: подбираю, привожу, устанавливаю и обслуживаю кондиционеры в Минске и области. Без посредников и лишних наценок.",
    path: "/about",
  });

export default function About() {
  return (
    <main>
      <PageHeader title="Обо мне" crumbs={[{ label: "Обо мне" }]} />

      <Section>
        <div className={styles.intro}>
          <div className={styles.text}>
            {aboutIntro.map((p) => (
              <p key={p.slice(0, 24)} className={styles.paragraph}>
                {p}
              </p>
            ))}
          </div>

          {/* TODO: заглушка под фото мастера. Реальный снимок — самый ценный
              элемент этой страницы: лицо продаёт сильнее любого текста. */}
          <div className={styles.photo} aria-hidden />
        </div>
      </Section>

      <Section title="Как я работаю">
        <div className={styles.principles}>
          {principles.map((p) => (
            <Card key={p.title} className={styles.principle}>
              <b className={styles.principleTitle}>{p.title}</b>
              <span className={styles.principleText}>{p.text}</span>
            </Card>
          ))}
        </div>
      </Section>

      <LeadBlock
        title="Остались вопросы?"
        lead="Напишите или позвоните — отвечу лично, без колл-центра."
        source="footer"
        points={[
          "Отвечаю сам, менеджеров между нами нет",
          "Можно просто спросить — заказывать не обязательно",
          "Пришлите фото помещения, оценю задачу по нему",
          "Обычно отвечаю в течение часа",
        ]}
      />
    </main>
  );
}
