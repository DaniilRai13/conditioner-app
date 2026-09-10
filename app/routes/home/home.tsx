import type { MetaFunction } from "react-router";
import type { Route } from "./+types/home";
import { getCatalogProducts } from "~/lib/queries";
import { Hero } from "./Hero/Hero";
import { QuizResult } from "./QuizResult/QuizResult";
import { SolutionsPreview } from "./SolutionsPreview/SolutionsPreview";
import { ServicesPreview } from "./ServicesPreview/ServicesPreview";
import { WhyMe } from "~/components/sections/WhyMe/WhyMe";
import { Proof } from "./Proof";
import { Faq } from "~/components/sections/Faq/Faq";
import { faq } from "~/data/faq";
import { Section } from "~/components/ui/Section/Section";
import { LeadBlock } from "~/components/forms/LeadBlock/LeadBlock";
import { seo } from "~/lib/seo";

export function loader() {
  // Подбору нужен весь каталог: он фильтрует его на клиенте по ответам.
  return { products: getCatalogProducts() };
}

/**
 * Canonical жёстко на «/»: ответы квиза живут в query-параметрах главной,
 * и без этого каждая комбинация ответов уехала бы в индекс отдельной
 * страницей с одинаковым содержимым.
 */
export const meta: MetaFunction = () =>
  seo({
    // Не «Установка кондиционеров в Минске и области»: ровно так называется
    // страница услуги, и два одинаковых заголовка в индексе конкурировали
    // бы между собой. Здесь — как в H1, с продажей.
    title: "Продажа и установка кондиционеров в Минске",
    description:
      "Подберу, поставлю и настрою кондиционер под ваши задачи. Работает один специалист — без посредников и лишних наценок.",
    path: "/",
  });

// Семь секций (PLAN.md §4). Порядок не случайный: подбор идёт в первом
// экране, пока внимание максимально, а FAQ стоит перед формой — снимает
// последние возражения ровно перед тем, как просить контакты.
//
// QuizResult ничего не рисует, пока подбор не закончен, поэтому на свежей
// странице между hero и решениями его просто нет.
export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <Hero />
      <QuizResult products={loaderData.products} />
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

      <LeadBlock
        id="lead"
        title="Оставьте заявку"
        lead="Перезвоню, уточню детали и назову точную стоимость. Замер и консультация — бесплатно."
        source="home"
        points={[
          "Перезвоню в течение часа в рабочее время",
          "Смету назову до начала работ, а не по факту",
          "Отвечаю лично — колл-центра и менеджеров нет",
          "Не подойдёт по площади — скажу сразу, а не продам лишнее",
        ]}
      />
    </main>
  );
}
