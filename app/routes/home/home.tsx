import type { MetaFunction } from "react-router";
import { Hero } from "./Hero/Hero";
import { QuizTeaser } from "./QuizTeaser/QuizTeaser";
import { SolutionsPreview } from "./SolutionsPreview/SolutionsPreview";
import { ServicesPreview } from "./ServicesPreview/ServicesPreview";
import { WhyMe } from "~/components/sections/WhyMe/WhyMe";
import { Proof } from "./Proof";
import { Faq } from "~/components/sections/Faq/Faq";
import { faq } from "~/data/faq";
import { Section } from "~/components/ui/Section/Section";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { site } from "~/config/site";
import styles from "./home.module.scss";

export const meta: MetaFunction = () => [
  { title: `${site.name} — установка кондиционеров в Минске и области` },
  {
    name: "description",
    content:
      "Подберу, поставлю и настрою кондиционер под ваши задачи. Работает один специалист — без посредников и лишних наценок.",
  },
];

// Семь секций (PLAN.md §4). Порядок не случайный: квиз стоит вторым,
// пока внимание максимально, а FAQ идёт перед формой — снимает последние
// возражения ровно перед тем, как просить контакты.
export default function Home() {
  return (
    <main>
      <Hero />
      <QuizTeaser />
      <SolutionsPreview />
      <ServicesPreview />
      <WhyMe />
      <Proof />

      <Section
        title="Частые вопросы"
        lead="Собрал то, о чём спрашивают чаще всего. Если вашего вопроса тут нет — напишите, отвечу лично."
      >
        <Faq items={faq} />
      </Section>

      <Section id="lead" className={styles.contact}>
        <div className={styles.contactBox}>
          <div className={styles.contactHead}>
            <h2 className={styles.contactTitle}>Оставьте заявку</h2>
            <p className={styles.contactLead}>
              Перезвоню, уточню детали и назову точную стоимость. Замер и
              консультация — бесплатно.
            </p>
          </div>
          <LeadForm source="home" />
        </div>
      </Section>
    </main>
  );
}
